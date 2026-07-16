const { resolveProduct, toCard } = require('../../lib/catalog');

module.exports = async ({ product_name = '', product_id = '' } = {}) => {
  if (!product_id && (!product_name || typeof product_name !== 'string' || !product_name.trim())) {
    return {
      content: [{ type: 'text', text: 'Please provide a product_name or product_id to look up a laptop.' }],
    };
  }

  const item = resolveProduct({ product_id, product_name });

  if (!item) {
    return {
      content: [{ type: 'text', text: `No ASUS laptop found matching "${product_id || product_name}".` }],
    };
  }

  const stock = item.in_stock ? 'In stock' : 'Currently out of stock';
  const summary = `${item.name} — $${item.price_usd}. ${item.description} ${item.cpu}, ${item.gpu}, ${item.ram_gb}GB RAM, ${item.storage_gb}GB storage, ${item.screen_size_in}" display, ${item.weight_kg}kg. Rating ${item.rating}/5 (${item.review_count} reviews). ${stock}.`;

  return {
    content: [{ type: 'text', text: summary }],
    // structuredContent — flat single-object detail shape (widget reads sc directly, no wrapper key)
    structuredContent: toCard(item),
  };
};

/*
 * TODO: Replace CATALOG-backed lookup with a real API call once available.
 * Suggested endpoint pattern:
 *   GET ${process.env.API_BASE_URL}/products/${product_id}
 * Environment variables: API_BASE_URL, API_KEY (add to .env and app.config.yaml inputs).
 */
