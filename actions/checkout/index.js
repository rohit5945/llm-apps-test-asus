const { buyUrl } = require('../../lib/catalog');
const cart = require('../../lib/cart');

// Demo checkout: there is no real ASUS/Adobe Commerce order API wired up
// yet, so this produces an order summary plus a per-item link to asus.com
// and then clears the cart, simulating a completed order. Replace the
// TODO below with a real checkout/order-creation call when available.
module.exports = async ({ session_id = '' } = {}) => {
  const sessionId = session_id && String(session_id).trim();
  if (!sessionId) {
    return { content: [{ type: 'text', text: 'Please provide the session_id for the cart you want to check out.' }] };
  }

  const current = await cart.getCart(sessionId);
  if (current.items.length === 0) {
    return { content: [{ type: 'text', text: 'Your cart is empty — add a laptop before checking out.' }] };
  }

  const lines = current.items.map((i) => `${i.quantity}x ${i.name} ($${i.price_usd} each) — ${buyUrl({ name: i.name })}`);
  const summary = `Order summary (${current.item_count} item${current.item_count === 1 ? '' : 's'}, subtotal $${current.subtotal_usd}):\n${lines.join('\n')}\n\nThis is a demo checkout — no payment was taken. Follow the links above to complete a real purchase on asus.com.`;

  const structuredContent = { ...current, checkout_note: 'Demo checkout — no real order was placed. Connect an ASUS/Adobe Commerce order API to go live.' };

  await cart.clearCart(sessionId);

  return {
    content: [{ type: 'text', text: summary }],
    structuredContent,
  };
};

/*
 * TODO: Replace the demo summary above with a real order-creation call once
 * available, e.g.:
 *   POST ${process.env.API_BASE_URL}/orders  { items, session_id }
 * Environment variables: API_BASE_URL, API_KEY (add to .env and app.config.yaml inputs).
 */
