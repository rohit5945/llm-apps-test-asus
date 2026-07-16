const { GPU_TIERS } = require('./catalog');

/**
 * Filters + ranks the catalog against structured filter params.
 *
 * Design note: natural-language queries like "gaming laptop under $1200"
 * are parsed by the LLM host, not by this code — the MCP tool's inputSchema
 * (authored in the Adobe LLM Apps UI) declares parameters such as
 * `use_case`, `max_price`, `min_ram_gb`, `gpu_tier`, etc. The model extracts
 * those from the user's sentence and calls this tool with structured
 * arguments. This function only needs to honor whichever of those arguments
 * are present. See docs/ACTIONS_UI_SETUP.md for the exact schema to enter.
 *
 * @param {Array} catalog Full product catalog (array of raw catalog records)
 * @param {object} filters
 * @param {string} [filters.query] Free-text query matched against name/description/series
 * @param {string} [filters.category] Exact series/category match (back-compat with original param)
 * @param {string} [filters.brand_line] zenbook | rog | tuf | vivobook | proart
 * @param {string} [filters.use_case] gaming | creator | student | productivity | business | travel | budget | professional
 * @param {number} [filters.min_price]
 * @param {number} [filters.max_price]
 * @param {number} [filters.min_ram_gb]
 * @param {string} [filters.gpu_tier] Minimum acceptable GPU tier (integrated..enthusiast)
 * @param {number} [filters.min_screen_size]
 * @param {number} [filters.max_screen_size]
 * @param {number} [filters.max_weight_kg]
 * @param {string} [filters.sort_by] relevance (default) | price_asc | price_desc | rating_desc
 * @param {number} [filters.limit] Defaults to 5, capped at 10
 * @returns {{ results: Array, appliedFilters: string[] }}
 */
function searchProducts(catalog, filters = {}) {
  const {
    query = '',
    category = '',
    brand_line = '',
    use_case = '',
    min_price,
    max_price,
    min_ram_gb,
    gpu_tier,
    min_screen_size,
    max_screen_size,
    max_weight_kg,
    sort_by = 'relevance',
    limit = 5,
  } = filters;

  const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
  const cat = typeof category === 'string' ? category.trim().toLowerCase() : '';
  const line = typeof brand_line === 'string' ? brand_line.trim().toLowerCase() : '';
  const useCase = typeof use_case === 'string' ? use_case.trim().toLowerCase() : '';
  const minGpuTierIdx = gpu_tier ? GPU_TIERS.indexOf(String(gpu_tier).toLowerCase()) : -1;

  const appliedFilters = [];
  if (cat) appliedFilters.push(`series "${category.trim()}"`);
  if (line) appliedFilters.push(`brand "${brand_line.trim()}"`);
  if (useCase) appliedFilters.push(`use case "${use_case.trim()}"`);
  if (q) appliedFilters.push(`matching "${query.trim()}"`);
  if (typeof max_price === 'number') appliedFilters.push(`under $${max_price}`);
  if (typeof min_price === 'number') appliedFilters.push(`over $${min_price}`);
  if (typeof min_ram_gb === 'number') appliedFilters.push(`at least ${min_ram_gb}GB RAM`);
  if (minGpuTierIdx >= 0) appliedFilters.push(`${gpu_tier}-tier GPU or better`);
  if (typeof max_weight_kg === 'number') appliedFilters.push(`under ${max_weight_kg}kg`);

  let filtered = catalog.filter((item) => {
    if (cat && item.category.toLowerCase() !== cat) return false;
    if (line && item.brand_line !== line) return false;
    if (useCase && !(item.use_cases || []).some((u) => u.toLowerCase() === useCase)) return false;
    if (typeof min_price === 'number' && item.price_usd < min_price) return false;
    if (typeof max_price === 'number' && item.price_usd > max_price) return false;
    if (typeof min_ram_gb === 'number' && item.ram_gb < min_ram_gb) return false;
    if (minGpuTierIdx >= 0) {
      const itemTierIdx = GPU_TIERS.indexOf(item.gpu_tier);
      if (itemTierIdx < minGpuTierIdx) return false;
    }
    if (typeof min_screen_size === 'number' && item.screen_size_in < min_screen_size) return false;
    if (typeof max_screen_size === 'number' && item.screen_size_in > max_screen_size) return false;
    if (typeof max_weight_kg === 'number' && item.weight_kg > max_weight_kg) return false;
    if (q) {
      const haystack = `${item.name} ${item.description || ''} ${item.series} ${(item.use_cases || []).join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Relevance score only matters for free-text queries; otherwise fall back to rating.
  const scored = filtered.map((item) => {
    let score = item.rating || 0;
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const haystack = `${item.name} ${item.description || ''}`.toLowerCase();
      score += tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 2 : 0), 0);
    }
    return { item, score };
  });

  const sorters = {
    price_asc: (a, b) => a.item.price_usd - b.item.price_usd,
    price_desc: (a, b) => b.item.price_usd - a.item.price_usd,
    rating_desc: (a, b) => (b.item.rating || 0) - (a.item.rating || 0),
    relevance: (a, b) => b.score - a.score,
  };
  const sorter = sorters[sort_by] || sorters.relevance;
  scored.sort(sorter);

  const cappedLimit = Math.max(1, Math.min(Number(limit) || 5, 10));
  const results = scored.slice(0, cappedLimit).map((s) => s.item);

  return { results, appliedFilters };
}

module.exports = { searchProducts };
