const cart = require('../../lib/cart');

// A thin, dedicated wrapper around manage-cart's "view" operation. This
// exists mainly so the host model has an obvious, high-confidence tool to
// call for "show me my cart" / "what's in my cart" — manage-cart's
// operation param works too, but a differently-named tool per intent
// reduces the chance the model picks the wrong one or the wrong operation.
module.exports = async ({ session_id = '' } = {}) => {
  const sessionId = session_id && String(session_id).trim();

  if (!sessionId) {
    return {
      content: [{ type: 'text', text: "You don't have an active cart yet — search for a laptop and add one to get started!" }],
      structuredContent: { items: [], item_count: 0, subtotal_usd: 0 },
    };
  }

  const current = await cart.getCart(sessionId);

  if (current.items.length === 0) {
    return {
      content: [{ type: 'text', text: 'Your cart is empty.' }],
      structuredContent: current,
    };
  }

  const shipping = current.qualifies_free_shipping
    ? ' You qualify for free shipping!'
    : ` Add $${current.free_shipping_remaining_usd} more for free shipping.`;
  const text = `Your cart has ${current.item_count} item${current.item_count === 1 ? '' : 's'}: ${current.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}. Subtotal: $${current.subtotal_usd}.${shipping}`;

  return {
    content: [{ type: 'text', text }],
    structuredContent: current,
  };
};
