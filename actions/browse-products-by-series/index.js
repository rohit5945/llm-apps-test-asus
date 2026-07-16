const { CATALOG, toCard } = require('../../lib/catalog');
const { searchProducts } = require('../../lib/search');

// `category` originally meant "exact Zenbook series name". We keep that
// contract; lib/search.js additionally expands a bare brand_line (rog | tuf
// | vivobook | zenbook | proart) or use_case (gaming | creator | ...) passed
// through this same param into a whole-family match, so "browse ROG
// laptops" / "browse gaming laptops" / "show me zenbook laptops" all return
// every matching model instead of only the 1-2 that literally have that
// string as their exact category. See docs/ACTIONS_UI_SETUP.md.
module.exports = async ({ category = '', max_price, sort_by, limit } = {}) => {
  if (!category || typeof category !== 'string' || !category.trim()) {
    return {
      content: [{ type: 'text', text: 'Please provide a category (series, brand line, or use case) to browse, e.g. "ROG Strix", "rog", or "gaming".' }],
      // structuredContent.products — derived from action name "browse_products_by_series" (bare array outputSchema rule)
      structuredContent: { products: [] },
    };
  }

  const trimmed = category.trim();
  const { results } = searchProducts(CATALOG, { category: trimmed, max_price, sort_by, limit });

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
