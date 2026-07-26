const { CATALOG, ACCESSORIES, resolveProduct, toCard } = require('../../lib/catalog');
const cart = require('../../lib/cart');

// Curated "popular right now" fallback for when we have no product or cart
// context to personalize from (e.g. the very first thing a user asks).
// TODO: base this on real sales/analytics data once available.
const TRENDING_IDS = ['rog-strix-scar18-g834', 'zenbook-s16-ux5606', 'asus-portable-ssd-1tb', 'rog-gladius-iii-mouse'];

function byRatingDesc(a, b) {
  return (b.rating || 0) - (a.rating || 0);
}

function similarLaptops(base, limit) {
  return CATALOG
    .filter((p) => p.id !== base.id && (
      p.brand_line === base.brand_line
      || (p.use_cases || []).some((u) => (base.use_cases || []).includes(u))
    ))
    .sort(byRatingDesc)
    .slice(0, limit)
    .map((item) => ({
      item,
      reason: item.brand_line === base.brand_line
        ? `Also popular in the ${item.series} line`
        : `Other shoppers looking at "${base.name}" also liked this`,
    }));
}

function compatibleAccessories(base, limit) {
  return ACCESSORIES
    .filter((a) => (a.compatible_brand_lines || []).includes(base.brand_line)
      || (a.use_cases || []).some((u) => (base.use_cases || []).includes(u)))
    .sort(byRatingDesc)
    .slice(0, limit)
    .map((item) => ({ item, reason: `Frequently bought with ${base.name}` }));
}

module.exports = async ({
  product_id = '',
  product_name = '',
  session_id = '',
  limit = 4,
} = {}) => {
  const cappedLimit = Math.max(1, Math.min(Number(limit) || 4, 6));

  let baseProduct = null;
  let basedOn = 'trending';

  if (product_id || product_name) {
    baseProduct = resolveProduct({ product_id, product_name });
    if (baseProduct) basedOn = 'product';
  }

  if (!baseProduct && session_id && String(session_id).trim()) {
    const cartState = await cart.getCart(String(session_id).trim());
    const lastItem = cartState.items[cartState.items.length - 1];
    if (lastItem) {
      const resolved = resolveProduct({ product_id: lastItem.product_id });
      if (resolved) {
        baseProduct = resolved;
        basedOn = 'cart';
      }
    }
  }

  let picks;
  if (baseProduct) {
    picks = [
      ...similarLaptops(baseProduct, 2),
      ...compatibleAccessories(baseProduct, 2),
    ].slice(0, cappedLimit);
  } else {
    picks = TRENDING_IDS
      .map((id) => resolveProduct({ product_id: id }))
      .filter(Boolean)
      .slice(0, cappedLimit)
      .map((item) => ({ item, reason: 'Popular right now' }));
  }

  const summary = basedOn === 'trending'
    ? `Popular right now: ${picks.map((p) => p.item.name).join(', ')}.`
    : `Because ${basedOn === 'cart' ? 'of what\'s in your cart' : `you're looking at ${baseProduct.name}`}, you might also like: ${picks.map((p) => p.item.name).join(', ')}.`;

  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: {
      recommendations: picks.map((p) => ({ ...toCard(p.item), reason: p.reason })),
      based_on: basedOn,
    },
  };
};
