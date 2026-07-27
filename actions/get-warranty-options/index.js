const { resolveProduct, toCard, WARRANTY_PLANS } = require('../../lib/catalog');

// ASUS Premium Care (APC) protection plans — see the pricing note above
// WARRANTY_PLANS in lib/catalog.js for which figures are confirmed vs.
// estimated. Works with or without a specific laptop: pass
// product_name/product_id to scope the response to that model's card, or
// call with neither for the generic 3-tier lineup (e.g. before the user
// has picked a laptop yet, or from a general "what warranty options do you
// offer" question).
module.exports = async ({ product_id = '', product_name = '' } = {}) => {
  const item = resolveProduct({ product_id, product_name });
  const plans = WARRANTY_PLANS.map((p) => ({ ...p }));

  const planSummary = plans.map((p) => `${p.name} — $${p.price_usd}`).join('; ');
  const queried = product_id || product_name;
  const text = item
    ? `ASUS Premium Care (APC) protection plans for ${item.name}: ${planSummary}. The 3-year plan also adds Accidental Damage Protection (ADP) for drops, spills, electrical surges and a cracked LCD.`
    : `No specific ASUS laptop matched${queried ? ` "${queried}"` : ''} — here are the general ASUS Premium Care (APC) protection plans available for any laptop: ${planSummary}. The 3-year plan also adds Accidental Damage Protection (ADP).`;

  return {
    content: [{ type: 'text', text }],
    structuredContent: {
      product: item ? toCard(item) : null,
      plans,
    },
  };
};

/*
 * TODO: Replace the hardcoded WARRANTY_PLANS lineup with a real ASUS
 * Premium Care pricing API once available. Suggested endpoint pattern:
 *   GET ${process.env.API_BASE_URL}/warranty-plans?product_id=${product_id}
 * Environment variables: API_BASE_URL, API_KEY (add to .env and app.config.yaml inputs).
 */
