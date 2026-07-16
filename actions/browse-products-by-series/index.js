const { CATALOG, toCard } = require('../../lib/catalog');
const { searchProducts } = require('../../lib/search');

// `category` originally meant "exact Zenbook series name". We keep that
// contract, and additionally accept a brand_line (rog | tuf | vivobook |
// zenbook | proart) or use_case (gaming | creator | ...) in the same param
// so "browse ROG laptops" and "browse gaming laptops" both work without a
// breaking schema change. See docs/ACTIONS_UI_SETUP.md.
module.exports = async ({ category = '', max_price, sort_by, limit = 10 } = {}) => {
  if (!category || typeof category !== 'string' || !category.trim()) {
    return {
      content: [{ type: 'text', text: 'Please provide a category (series, brand line, or use case) to browse, e.g. "ROG Strix", "rog", or "gaming".' }],
      // structuredContent.products — derived from action name "browse_products_by_series" (bare array outputSchema rule)
      structuredContent: { products: [] },
    };
  }

  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();
  const knownBrandLines = ['zenbook', 'rog', 'tuf', 'vivobook', 'proart'];
  const knownUseCases = ['gaming', 'creator', 'student', 'productivity', 'business', 'travel', 'budget', 'professional'];

  let filters = { category: trimmed, max_price, sort_by, limit };
  if (knownBrandLines.includes(lower)) {
    filters = { brand_line: lower, max_price, sort_by, limit };
  } else if (knownUseCases.includes(lower)) {
    filters = { use_case: lower, max_price, sort_by, limit };
  }

  const { results } = searchProducts(CATALOG, filters);

  if (results.length === 0) {
    return {
      content: [{ type: 'text', text: `No ASUS laptops found in the "${trimmed}" series.` }],
      structuredContent: { products: [] },
    };
  }

  const summary = `Found ${results.length} ${trimmed} model${results.length === 1 ? '' : 's'}: ${results.map((p) => p.name).join(', ')}.`;

  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: { products: results.map(toCard) },
  };
};

/*
 * TODO: Replace CATALOG-backed browsing with a real API call once available.
 * Suggested endpoint pattern:
 *   GET ${process.env.API_BASE_URL}/products?series=${category}
 * Environment variables: API_BASE_URL, API_KEY (add to .env and app.config.yaml inputs).
 */
