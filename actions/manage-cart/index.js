const { resolveProduct, resolveWarrantyPlan } = require('../../lib/catalog');
const cart = require('../../lib/cart');
const { getApplicableOffers } = require('../../lib/offers');

function shippingNote(cartState) {
  if (cartState.qualifies_free_shipping) return ' You qualify for free shipping!';
  if (cartState.free_shipping_remaining_usd > 0) return ` Add $${cartState.free_shipping_remaining_usd} more for free shipping.`;
  return '';
}

function offersNote(offers) {
  return offers && offers.length
    ? ' You may also qualify for free Adobe Creative Cloud and other offers — ask to see them.'
    : '';
}

// Single tool for all cart CRUD (add/update/remove/view/clear) so the host
// model only has to pick one tool for anything cart-related, instead of
// juggling four near-identical ones. See docs/ACTIONS_UI_SETUP.md for the
// input schema and for the session_id hand-off contract this relies on.
//
// Warranty plans (ASUS Premium Care / APC) are added through this same
// "add" operation: pass `plan_id` (one of lib/catalog.js WARRANTY_PLANS —
// apc-1yr | apc-2yr | apc-3yr-adp) plus `for_product_name`/`for_product_id`
// naming the laptop line item the plan protects. That laptop must already
// be in the cart; see the validation below.
module.exports = async ({
  operation = 'view',
  product_id = '',
  product_name = '',
  quantity = 1,
  session_id = '',
  plan_id = '',
  for_product_id = '',
  for_product_name = '',
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
    const offers = getApplicableOffers(current.items);
    const text = current.items.length
      ? `Cart (${current.item_count} item${current.item_count === 1 ? '' : 's'}): ${current.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}. Subtotal: $${current.subtotal_usd}.${shippingNote(current)}${offersNote(offers)}${sessionNote}`
      : `Your cart is empty.${sessionNote}`;
    return { content: [{ type: 'text', text }], structuredContent: { ...current, offers } };
  }

  if (op === 'clear') {
    const cleared = await cart.clearCart(sessionId);
    return {
      content: [{ type: 'text', text: `Cart cleared.${sessionNote}` }],
      structuredContent: cleared,
    };
  }

  // Adding a warranty plan is recognized by the presence of plan_id, so it
  // shares the "add" operation instead of needing a whole new operation
  // value for the host model to learn.
  if (op === 'add' && plan_id) {
    const forProduct = resolveProduct({ product_id: for_product_id, product_name: for_product_name });
    if (!forProduct) {
      return {
        content: [{ type: 'text', text: `Please specify which laptop this protection plan is for using for_product_name or for_product_id — couldn't find "${for_product_id || for_product_name}".` }],
      };
    }
    const plan = resolveWarrantyPlan({ plan_id });
    if (!plan) {
      return {
        content: [{ type: 'text', text: `Unknown warranty plan "${plan_id}". Use one of: apc-1yr, apc-2yr, apc-3yr-adp (call get-warranty-options to see current pricing).` }],
      };
    }
    const current = await cart.getCart(sessionId);
    const alreadyInCart = current.items.some((i) => i.item_type !== 'warranty' && i.product_id === forProduct.id);
    if (!alreadyInCart) {
      return {
        content: [{ type: 'text', text: `${forProduct.name} isn't in your cart yet — add the laptop before attaching a protection plan to it.` }],
      };
    }
    const updated = await cart.addWarrantyItem(sessionId, plan, forProduct.id);
    const offers = getApplicableOffers(updated.items);
    return {
      content: [{ type: 'text', text: `Added ${plan.name} ($${plan.price_usd}) for your ${forProduct.name}. Subtotal: $${updated.subtotal_usd} (${updated.item_count} item${updated.item_count === 1 ? '' : 's'}).${shippingNote(updated)}${offersNote(offers)}${sessionNote}` }],
      structuredContent: { ...updated, offers },
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
    const offers = getApplicableOffers(updated.items);
    return {
      content: [{ type: 'text', text: `Added ${qty}x ${product.name} ($${product.price_usd} each) to your cart. Subtotal: $${updated.subtotal_usd} (${updated.item_count} item${updated.item_count === 1 ? '' : 's'}).${shippingNote(updated)}${offersNote(offers)}${sessionNote}` }],
      structuredContent: { ...updated, offers },
    };
  }

  // Removing a warranty plan is recognized the same way: plan_id present
  // on a "remove" call means "remove this plan from that laptop", not
  // "remove a laptop line item".
  if (op === 'remove' && plan_id) {
    const forProduct = resolveProduct({ product_id: for_product_id, product_name: for_product_name });
    if (!forProduct) {
      return { content: [{ type: 'text', text: 'Please specify which laptop\'s protection plan to remove using for_product_name or for_product_id.' }] };
    }
    const updated = await cart.removeWarrantyItem(sessionId, forProduct.id, plan_id);
    return {
      content: [{ type: 'text', text: `Removed protection plan from ${forProduct.name}. Subtotal: $${updated.subtotal_usd} (${updated.item_count} item${updated.item_count === 1 ? '' : 's'}).${sessionNote}` }],
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
