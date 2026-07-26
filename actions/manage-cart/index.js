const { resolveProduct } = require('../../lib/catalog');
const cart = require('../../lib/cart');

function shippingNote(cartState) {
  if (cartState.qualifies_free_shipping) return ' You qualify for free shipping!';
  if (cartState.free_shipping_remaining_usd > 0) return ` Add $${cartState.free_shipping_remaining_usd} more for free shipping.`;
  return '';
}

// Single tool for all cart CRUD (add/update/remove/view/clear) so the host
// model only has to pick one tool for anything cart-related, instead of
// juggling four near-identical ones. See docs/ACTIONS_UI_SETUP.md for the
// input schema and for the session_id hand-off contract this relies on.
module.exports = async ({
  operation = 'view',
  product_id = '',
  product_name = '',
  quantity = 1,
  session_id = '',
} = {}) => {
  const op = String(operation || 'view').toLowerCase();
  let sessionId = session_id && String(session_id).trim() ? String(session_id).trim() : null;
  const isNewSession = !sessionId;
  if (isNewSession) sessionId = cart.newSessionId();

  const sessionNote = isNewSession
    ? ` Session started — reuse session_id "${sessionId}" for the rest of this cart.`
    : '';

  if (op === 'view') {
    const current = await cart.getCart(sessionId);
    const text = current.items.length
      ? `Cart (${current.item_count} item${current.item_count === 1 ? '' : 's'}): ${current.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}. Subtotal: $${current.subtotal_usd}.${shippingNote(current)}${sessionNote}`
      : `Your cart is empty.${sessionNote}`;
    return { content: [{ type: 'text', text }], structuredContent: current };
  }

  if (op === 'clear') {
    const cleared = await cart.clearCart(sessionId);
    return {
      content: [{ type: 'text', text: `Cart cleared.${sessionNote}` }],
      structuredContent: cleared,
    };
  }

  if (op === 'add') {
    if (!product_id && !product_name) {
      return { content: [{ type: 'text', text: 'Please provide a product_name or product_id to add to the cart.' }] };
    }
    const product = resolveProduct({ product_id, product_name });
    if (!product) {
      return { content: [{ type: 'text', text: `No ASUS laptop found matching "${product_id || product_name}".` }] };
    }
    if (!product.in_stock) {
      return { content: [{ type: 'text', text: `${product.name} is currently out of stock.` }] };
    }
    const qty = Math.max(1, Number(quantity) || 1);
    const updated = await cart.addItem(sessionId, product, qty);
    return {
      content: [{ type: 'text', text: `Added ${qty}x ${product.name} ($${product.price_usd} each) to your cart. Subtotal: $${updated.subtotal_usd} (${updated.item_count} item${updated.item_count === 1 ? '' : 's'}).${shippingNote(updated)}${sessionNote}` }],
      structuredContent: updated,
    };
  }

  if (op === 'update' || op === 'remove') {
    if (!product_id && !product_name) {
      return { content: [{ type: 'text', text: 'Please provide a product_name or product_id to update in the cart.' }] };
    }
    // update-by-name needs to resolve against catalog to get a stable id;
    // update-by-id can go straight to the cart line item.
    let resolvedId = product_id;
    if (!resolvedId) {
      const product = resolveProduct({ product_name });
      if (!product) return { content: [{ type: 'text', text: `No ASUS laptop found matching "${product_name}".` }] };
      resolvedId = product.id;
    }
    const newQty = op === 'remove' ? 0 : Math.max(0, Number(quantity) || 0);
    const updated = await cart.setItemQuantity(sessionId, resolvedId, newQty);
    return {
      content: [{ type: 'text', text: `Cart updated. Subtotal: $${updated.subtotal_usd} (${updated.item_count} item${updated.item_count === 1 ? '' : 's'}).${sessionNote}` }],
      structuredContent: updated,
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown cart operation "${operation}". Use one of: view, add, update, remove, clear.` }],
  };
};
