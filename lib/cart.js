const crypto = require('crypto');

// MCP tool calls are stateless — there is no logged-in user or HTTP session.
// To support a real multi-turn cart, we persist it in Adobe I/O Runtime's
// State service (bundled in @adobe/aio-sdk, already a dependency here),
// keyed by a `session_id` the tool hands back to the caller. The LLM host
// is expected to remember and re-send that session_id on later cart calls
// within the same conversation (this is spelled out in each cart action's
// tool description — see docs/ACTIONS_UI_SETUP.md).
//
// In local dev (`npm run dev:local`) there's no Runtime namespace, so
// State.init() throws — we fall back to an in-memory Map so handlers still
// work end-to-end locally. That fallback is single-instance and resets on
// restart; it is NOT suitable for production, only local iteration.

const CART_TTL_SECONDS = 60 * 60 * 24; // 24h — plenty for one shopping session
// Simple, visible personalization touch: a free-shipping progress nudge,
// same idea as any e-commerce cart. Swap for a real shipping-rules API later.
const FREE_SHIPPING_THRESHOLD_USD = 1500;
let memoryStore = null;

function getMemoryStore() {
  if (!memoryStore) memoryStore = new Map();
  return {
    get: async (key) => (memoryStore.has(key) ? { value: memoryStore.get(key) } : undefined),
    put: async (key, value) => { memoryStore.set(key, value); },
    delete: async (key) => { memoryStore.delete(key); },
  };
}

let statePromise = null;
async function getState() {
  if (!statePromise) {
    statePromise = (async () => {
      try {
        // eslint-disable-next-line global-require
        const { State } = require('@adobe/aio-sdk');
        if (!State || typeof State.init !== 'function') throw new Error('State SDK unavailable');
        return await State.init();
      } catch (e) {
        return getMemoryStore();
      }
    })();
  }
  return statePromise;
}

function cartKey(sessionId) {
  return `asus-cart:${sessionId}`;
}

function emptyCart(sessionId) {
  return { session_id: sessionId, items: [], updated_at: new Date().toISOString() };
}

// Warranty plans count toward subtotal_usd/item_count/free-shipping just
// like any laptop or accessory line — it's still real money the shopper is
// spending, and there's no product-y reason to exclude it from the
// threshold. This function doesn't need to know about item_type at all;
// every line item (product, accessory, or warranty) has quantity+price_usd.
function computeTotals(cart) {
  const item_count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal_usd = Math.round(cart.items.reduce((sum, i) => sum + i.quantity * i.price_usd, 0) * 100) / 100;
  const qualifies_free_shipping = subtotal_usd >= FREE_SHIPPING_THRESHOLD_USD;
  const free_shipping_remaining_usd = Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD_USD - subtotal_usd) * 100) / 100);
  return {
    ...cart,
    item_count,
    subtotal_usd,
    free_shipping_threshold_usd: FREE_SHIPPING_THRESHOLD_USD,
    free_shipping_remaining_usd,
    qualifies_free_shipping,
  };
}

async function getCart(sessionId) {
  const state = await getState();
  const res = await state.get(cartKey(sessionId));
  if (!res || !res.value) return computeTotals(emptyCart(sessionId));
  try {
    const parsed = typeof res.value === 'string' ? JSON.parse(res.value) : res.value;
    return computeTotals(parsed);
  } catch (e) {
    return computeTotals(emptyCart(sessionId));
  }
}

async function saveCart(cart) {
  const state = await getState();
  const toSave = { session_id: cart.session_id, items: cart.items, updated_at: new Date().toISOString() };
  await state.put(cartKey(cart.session_id), JSON.stringify(toSave), { ttl: CART_TTL_SECONDS });
  return computeTotals(toSave);
}

function newSessionId() {
  return `sess_${crypto.randomUUID()}`;
}

async function addItem(sessionId, product, quantity) {
  const cart = await getCart(sessionId);
  const existing = cart.items.find((i) => i.item_type !== 'warranty' && i.product_id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      item_type: 'product',
      product_id: product.id,
      name: product.name,
      price_usd: product.price_usd,
      image_url: product.image_url,
      is_accessory: !!product.is_accessory,
      quantity,
    });
  }
  return saveCart(cart);
}

/**
 * Adds an ASUS Premium Care warranty plan to the cart, attached to a
 * specific laptop/accessory line item via `for_product_id`. Warranty line
 * items are distinguished from products by `item_type: 'warranty'` and
 * always carry quantity 1 (one plan per protected item) — calling this
 * again for the same plan+product is idempotent, it won't create a
 * duplicate line. Validating that `for_product_id` is actually already in
 * the cart is the caller's job (see actions/manage-cart) — this module
 * only knows how to store the line item once told to.
 */
async function addWarrantyItem(sessionId, plan, forProductId) {
  const cart = await getCart(sessionId);
  const existing = cart.items.find(
    (i) => i.item_type === 'warranty' && i.for_product_id === forProductId && i.plan_id === plan.id,
  );
  if (!existing) {
    cart.items.push({
      item_type: 'warranty',
      plan_id: plan.id,
      name: plan.name,
      price_usd: plan.price_usd,
      quantity: 1,
      for_product_id: forProductId,
    });
  }
  return saveCart(cart);
}

/** Removes the warranty plan line item attached to for_product_id (optionally scoped to a specific planId). */
async function removeWarrantyItem(sessionId, forProductId, planId) {
  const cart = await getCart(sessionId);
  const idx = cart.items.findIndex(
    (i) => i.item_type === 'warranty' && i.for_product_id === forProductId && (!planId || i.plan_id === planId),
  );
  if (idx === -1) return computeTotals(cart);
  cart.items.splice(idx, 1);
  return saveCart(cart);
}

/** quantity <= 0 removes the line item. Product/accessory lines only — use removeWarrantyItem for plans. */
async function setItemQuantity(sessionId, productId, quantity) {
  const cart = await getCart(sessionId);
  const idx = cart.items.findIndex((i) => i.item_type !== 'warranty' && i.product_id === productId);
  if (idx === -1) return computeTotals(cart);
  if (quantity <= 0) {
    cart.items.splice(idx, 1);
    // Dropping a laptop also drops any warranty plan attached to it —
    // otherwise you'd end up with an orphaned protection plan for a
    // product that's no longer in the cart.
    cart.items = cart.items.filter((i) => !(i.item_type === 'warranty' && i.for_product_id === productId));
  } else {
    cart.items[idx].quantity = quantity;
  }
  return saveCart(cart);
}

async function clearCart(sessionId) {
  return saveCart(emptyCart(sessionId));
}

/**
 * Adds a `warranty_upsell: true` hint to every non-accessory product line
 * item that has no warranty plan attached yet, so the cart widget can
 * render an "Add protection?" prompt per item without a second tool
 * round-trip. Warranty line items themselves pass through unchanged.
 */
function annotateWarrantyUpsell(cart) {
  const protectedProductIds = new Set(
    cart.items.filter((i) => i.item_type === 'warranty').map((i) => i.for_product_id),
  );
  const items = cart.items.map((i) => {
    if (i.item_type === 'warranty') return i;
    return { ...i, warranty_upsell: !i.is_accessory && !protectedProductIds.has(i.product_id) };
  });
  return { ...cart, items };
}

module.exports = {
  newSessionId,
  getCart,
  addItem,
  addWarrantyItem,
  removeWarrantyItem,
  setItemQuantity,
  clearCart,
  annotateWarrantyUpsell,
};
