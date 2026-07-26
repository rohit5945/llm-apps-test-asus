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
  const existing = cart.items.find((i) => i.product_id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      product_id: product.id,
      name: product.name,
      price_usd: product.price_usd,
      image_url: product.image_url,
      quantity,
    });
  }
  return saveCart(cart);
}

/** quantity <= 0 removes the line item. */
async function setItemQuantity(sessionId, productId, quantity) {
  const cart = await getCart(sessionId);
  const idx = cart.items.findIndex((i) => i.product_id === productId);
  if (idx === -1) return computeTotals(cart);
  if (quantity <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity = quantity;
  }
  return saveCart(cart);
}

async function clearCart(sessionId) {
  return saveCart(emptyCart(sessionId));
}

module.exports = {
  newSessionId,
  getCart,
  addItem,
  setItemQuantity,
  clearCart,
};
