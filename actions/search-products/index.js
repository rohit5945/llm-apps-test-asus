const { CATALOG, toCard } = require('../../lib/catalog');
const { searchProducts } = require('../../lib/search');

// See docs/ACTIONS_UI_SETUP.md for the input schema to register in the
// Adobe LLM Apps UI so the host model can actually pass these arguments.
module.exports = async (args = {}) => {
  const { results, appliedFilters } = searchProducts(CATALOG, args);

  const filterText = appliedFilters.length ? ` ${appliedFilters.join(', ')}` : '';
  const summary = results.length
    ? `Found ${results.length} ASUS laptop${results.length === 1 ? '' : 's'}${filterText}: ${results.map((p) => `${p.name} ($${p.price_usd})`).join('; ')}.`
    : `No ASUS laptops found${filterText}. Try a higher budget or a different series.`;

  return {
    content: [{ type: 'text', text: summary }],
    // structuredContent.products — bare array outputSchema rule (derived from action name "search_products")
    structuredContent: { products: results.map(toCard) },
  };
};

/*
 * TODO: Replace CATALOG-backed search with a real API call once available.
 * Suggested endpoint pattern:
 *   GET ${process.env.API_BASE_URL}/products?query=...&max_price=...&use_case=...
 * Environment variables: API_BASE_URL, API_KEY (add to .env and app.config.yaml inputs).
 */
