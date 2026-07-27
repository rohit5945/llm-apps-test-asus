const { resolveProduct, toCard, CATALOG } = require('../../lib/catalog');

const SPEC_FIELDS = [
  { key: 'price_usd', label: 'Price', better: 'lower' },
  { key: 'cpu', label: 'CPU', better: null },
  { key: 'gpu', label: 'GPU', better: null },
  { key: 'ram_gb', label: 'RAM', better: 'higher' },
  { key: 'storage_gb', label: 'Storage', better: 'higher' },
  { key: 'screen_size_in', label: 'Screen', better: null },
  { key: 'weight_kg', label: 'Weight', better: 'lower' },
  { key: 'battery_hours', label: 'Battery', better: 'higher' },
  { key: 'rating', label: 'Rating', better: 'higher' },
];

/** For each numeric spec with a defined "better" direction, mark the winning product id. */
function computeBestPerRow(products) {
  const best = {};
  SPEC_FIELDS.forEach(({ key, better }) => {
    if (!better) return;
    const withValues = products.filter((p) => typeof p[key] === 'number');
    if (withValues.length < 2) return;
    const winner = withValues.reduce((acc, p) => {
      if (!acc) return p;
      if (better === 'lower') return p[key] < acc[key] ? p : acc;
      return p[key] > acc[key] ? p : acc;
    }, null);
    if (winner) best[key] = winner.id;
  });
  return best;
}

module.exports = async ({ product_ids = [], product_names = [] } = {}) => {
  const ids = Array.isArray(product_ids) ? product_ids : [];
  const names = Array.isArray(product_names) ? product_names : [];

  if (ids.length === 0 && names.length === 0) {
    return {
      content: [{ type: 'text', text: 'Please provide 2-4 product_names (or product_ids) to compare, e.g. ["ROG Strix G16", "TUF Gaming F15"].' }],
    };
  }

  const requests = ids.length
    ? ids.map((id) => ({ product_id: id }))
    : names.map((name) => ({ product_name: name }));

  const resolved = [];
  const unresolved = [];
  requests.forEach((req) => {
    const item = resolveProduct(req);
    if (item && !resolved.find((r) => r.id === item.id)) resolved.push(item);
    else if (!item) unresolved.push(req.product_id || req.product_name);
  });

  if (resolved.length < 2) {
    const missingText = unresolved.length ? ` Couldn't find: ${unresolved.join(', ')}.` : '';
    return {
      content: [{ type: 'text', text: `Need at least 2 valid ASUS laptops to compare.${missingText}` }],
    };
  }

  const products = resolved.slice(0, 4);
  const bestPerRow = computeBestPerRow(products);

  const cheapest = products.reduce((a, b) => (b.price_usd < a.price_usd ? b : a));
  const lightest = products.reduce((a, b) => (b.weight_kg < a.weight_kg ? b : a));
  const summary = `Comparing ${products.map((p) => p.name).join(' vs ')}. Cheapest: ${cheapest.name} ($${cheapest.price_usd}). Lightest: ${lightest.name} (${lightest.weight_kg}kg).`;

  // De-duplicated list of every laptop NOT already in this comparison, so
  // the widget can render an "add another laptop to compare" picker
  // without a second tool round-trip — the picker itself can't call tools
  // directly. Real laptops only (CATALOG, not ACCESSORIES); capped at 12
  // (CATALOG only has 11 today, so the cap is mostly future-proofing).
  const selectedIds = new Set(products.map((p) => p.id));
  const catalogOptions = CATALOG
    .filter((p) => !selectedIds.has(p.id))
    .slice(0, 12)
    .map((p) => ({ id: p.id, name: p.name, brand_line: p.brand_line }));

  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: {
      products: products.map(toCard),
      spec_fields: SPEC_FIELDS.map(({ key, label }) => ({ key, label })),
      best_per_row: bestPerRow,
      catalog_options: catalogOptions,
    },
  };
};
