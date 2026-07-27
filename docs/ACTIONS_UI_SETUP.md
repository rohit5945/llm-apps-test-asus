# Adobe LLM Apps UI setup — full 9-action checklist

**Why only 3 tools work in ChatGPT today, in plain English:** the MCP server
itself already bundles all 9 action handlers automatically — `entry.js`
uses webpack's `require.context('./actions', ...)` to pick up every
`actions/*/index.js` at build time, so deployment is not the gap. The gap
is the *separate* Adobe LLM Apps admin UI, where each handler has to be
manually mapped to a ChatGPT-visible tool (name, description, input
schema) and a widget. That admin UI currently only has entries for 3 of
the 9 handlers, so the other 6 are running in production but are
completely invisible to the connector.

This doc is the copy-paste checklist to close that gap for all 9 actions.
For each: exact tool name, description text, the input JSON schema (taken
directly from the handler's destructured params — not guessed), a note on
the output shape, and which EDS widget block it should render into. Enter
every field exactly as written; the host model can only pass arguments a
tool's inputSchema declares.

---

## 1. search_products — ✅ already registered, verify description/schema match

- **Handler**: `actions/search-products/index.js` (delegates to `lib/search.js`)
- **Description** (verify this is what's entered): "Search ASUS laptops
  (Zenbook, ROG, TUF Gaming, Vivobook, ProArt) by free-text query and/or
  structured filters like budget, use case, GPU tier, RAM, screen size or
  weight. Use this whenever the user describes what they want in a laptop
  rather than naming a specific model."
- **inputSchema** (verify against the live entry):

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Free-text search terms, e.g. a model name or keyword" },
    "category": { "type": "string", "description": "Exact series name, e.g. \"Zenbook S\", \"ROG Strix\" — or a bare brand/use-case word like \"zenbook\" or \"gaming\" to get the whole family" },
    "brand_line": { "type": "string", "enum": ["zenbook", "rog", "tuf", "vivobook", "proart"], "description": "ASUS sub-brand" },
    "use_case": { "type": "string", "enum": ["gaming", "creator", "student", "productivity", "business", "travel", "budget", "professional"], "description": "What the laptop is mainly for" },
    "min_price": { "type": "number", "description": "Minimum price in USD" },
    "max_price": { "type": "number", "description": "Maximum price in USD — set this from phrases like \"under $1200\"" },
    "min_ram_gb": { "type": "number", "description": "Minimum RAM in GB" },
    "gpu_tier": { "type": "string", "enum": ["integrated", "entry", "mid", "high", "enthusiast"], "description": "Minimum acceptable GPU tier" },
    "min_screen_size": { "type": "number" },
    "max_screen_size": { "type": "number" },
    "max_weight_kg": { "type": "number", "description": "Set this for \"lightweight\"/\"portable\" requests" },
    "sort_by": { "type": "string", "enum": ["relevance", "price_asc", "price_desc", "rating_desc"] },
    "limit": { "type": "number", "description": "Max results to return, default 5, max 10" }
  }
}
```
- **Output shape**: `structuredContent: { products: [<card>, ...] }` — bare
  array under a `products` key, each card is `lib/catalog.js#toCard()`.
- **Widget**: `blocks/search-products/` in the EDS repo.

## 2. get_product_details — ✅ already registered, verify description/schema match

- **Handler**: `actions/get-product-details/index.js`
- **Description**: "Get full specs, price, rating and stock status for one
  specific ASUS laptop by name or id."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "product_name": { "type": "string", "description": "Laptop name or partial name, e.g. \"Zenbook DUO\"" },
    "product_id": { "type": "string", "description": "Exact catalog id if already known from a previous tool result" }
  }
}
```
- **Output shape**: `structuredContent` is a flat single-object product
  card (`toCard()`), not wrapped in a key — widget reads it directly.
- **Widget**: `blocks/product-details/` in the EDS repo.

## 3. browse_products_by_series — ✅ already registered, verify description/schema match

- **Handler**: `actions/browse-products-by-series/index.js`
- **Description**: "Browse ASUS laptops by exact series name (e.g.
  \"Zenbook S\"), by sub-brand (\"rog\", \"tuf\", \"vivobook\", \"zenbook\",
  \"proart\"), or by use case (\"gaming\", \"creator\", \"student\", ...).
  Prefer search_products instead when the user gives a budget or spec
  constraint."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "description": "Series name, sub-brand, or use case, e.g. \"Zenbook S\", \"rog\", \"gaming\"" },
    "max_price": { "type": "number" },
    "sort_by": { "type": "string", "enum": ["relevance", "price_asc", "price_desc", "rating_desc"] },
    "limit": { "type": "number" }
  },
  "required": ["category"]
}
```
- **Output shape**: `structuredContent: { products: [<card>, ...] }`, same shape as search_products.
- **Widget**: `blocks/search-products/` in the EDS repo (shares the results grid with search_products).

---

## 4. compare_products — ❌ NOT REGISTERED — this is why it doesn't work in ChatGPT

- **Handler**: `actions/compare-products/index.js`
- **Description**: "Compare 2-4 specific ASUS laptops side by side on
  price, CPU, GPU, RAM, storage, screen, weight, battery and rating. Use
  this when the user names two or more models to compare, e.g. \"compare
  the ROG Strix G16 and the TUF Gaming A16\"."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "product_names": { "type": "array", "items": { "type": "string" }, "description": "2-4 laptop names to compare" },
    "product_ids": { "type": "array", "items": { "type": "string" }, "description": "2-4 catalog ids, if already known" }
  }
}
```
- **Output shape**: `structuredContent: { products, spec_fields, best_per_row, catalog_options }`.
  - `products`: array of `toCard()` cards for the resolved laptops (max 4).
  - `spec_fields`: `[{ key, label }, ...]` — the comparison rows to render.
  - `best_per_row`: `{ [spec_key]: winning_product_id }` for specs with a clear "better" direction.
  - **`catalog_options` (new)**: de-duplicated `[{ id, name, brand_line }, ...]` for every
    laptop in `CATALOG` NOT already in `products`, capped at 12, laptops only (no accessories).
    This lets the widget render an "add another laptop to compare" dropdown without a second
    tool call, since the picker itself can't call tools directly.
- **Widget**: `blocks/compare-products/` in the EDS repo.

## 5. manage_cart — ❌ NOT REGISTERED — this is why it doesn't work in ChatGPT

- **Handler**: `actions/manage-cart/index.js` — single tool for all cart
  CRUD (add/update/remove/view/clear), now including adding an ASUS
  Premium Care (APC) warranty plan to a cart line item.
- **Description**: "Add, update, remove, view, or clear items in the
  user's ASUS shopping cart — including attaching ASUS Premium Care (APC)
  warranty/protection plans to a laptop already in the cart. IMPORTANT:
  this tool returns a `session_id` — always reuse the *same* session_id on
  every later manage_cart, view_cart, get_recommendations,
  get_warranty_options or checkout call in this conversation so the cart
  persists; do not generate your own. To add a warranty plan, set
  operation=\"add\" plus `plan_id` (from get_warranty_options) and
  `for_product_name`/`for_product_id` naming the laptop already in the
  cart that the plan protects — the laptop must be added first."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "operation": { "type": "string", "enum": ["view", "add", "update", "remove", "clear"], "description": "Cart action to perform" },
    "product_name": { "type": "string" },
    "product_id": { "type": "string" },
    "quantity": { "type": "number", "description": "Quantity to add, or to set for update. Ignored for remove/view/clear." },
    "session_id": { "type": "string", "description": "Cart session id returned by a previous manage_cart call. Omit only on the very first call." },
    "plan_id": { "type": "string", "enum": ["apc-1yr", "apc-2yr", "apc-3yr-adp"], "description": "ASUS Premium Care warranty plan id — only used with operation add/remove to attach/detach a protection plan" },
    "for_product_id": { "type": "string", "description": "Catalog id of the laptop already in the cart that this warranty plan protects" },
    "for_product_name": { "type": "string", "description": "Name of the laptop already in the cart that this warranty plan protects (alternative to for_product_id)" }
  },
  "required": ["operation"]
}
```
- **Output shape**: `structuredContent` is the cart object: `{ session_id, items, item_count, subtotal_usd, free_shipping_threshold_usd, free_shipping_remaining_usd, qualifies_free_shipping, updated_at }`.
  - `items[]` now has two shapes distinguished by `item_type`:
    - Laptop/accessory line: `{ item_type: 'product', product_id, name, price_usd, image_url, is_accessory, quantity }`
    - Warranty line: `{ item_type: 'warranty', plan_id, name, price_usd, quantity: 1, for_product_id }`
  - Warranty plan cost counts toward `subtotal_usd`, `item_count`, and the free-shipping threshold — it's still money the shopper is spending.
  - Removing a laptop also removes any warranty plan attached to it (no orphaned protection plans).
- **Widget**: `blocks/cart/` in the EDS repo.
- **Annotations**: has side effects (add/update/remove/clear all mutate state) — do **not** mark `readOnlyHint: true`.

## 6. view_cart — ❌ NOT REGISTERED — this is why it doesn't work in ChatGPT

- **Handler**: `actions/view-cart/index.js` — read-only wrapper around
  manage_cart's "view" operation, with per-item warranty upsell hints
  layered on top.
- **Description**: "Show the current contents of the user's ASUS shopping
  cart — items, quantities, subtotal, free-shipping progress, and which
  laptops don't yet have an ASUS Premium Care protection plan attached.
  Use this whenever the user asks to see, view, or check their cart.
  Requires the session_id from a prior manage_cart call; if there isn't
  one yet, treat the cart as empty."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "session_id": { "type": "string", "description": "Cart session id returned by a previous manage_cart call" }
  }
}
```
- **Output shape**: same cart object as manage_cart's view, PLUS a
  **`warranty_upsell: true|false`** flag on every non-warranty, non-accessory
  line item — `true` means that laptop has no warranty plan attached yet,
  so the widget can show an "Add protection?" prompt (which sends a
  `manage_cart` add call with the matching `plan_id`/`for_product_id`).
  Warranty line items and accessory line items never carry this flag.
- **Widget**: `blocks/cart/` in the EDS repo (same block as manage_cart).
- **Annotations**: read-only, safe to mark `readOnlyHint: true`.

## 7. checkout — ❌ NOT REGISTERED — this is why it doesn't work in ChatGPT

- **Handler**: `actions/checkout/index.js`
- **Description**: "Check out the user's ASUS cart for a given
  session_id, including any laptops, accessories, and ASUS Premium Care
  protection plans in it. This is a demo checkout — it prints an order
  summary and links to asus.com, it does not take payment or place a real
  order. Requires a session_id from a prior manage_cart call."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "session_id": { "type": "string", "description": "Cart session id to check out" }
  },
  "required": ["session_id"]
}
```
- **Output shape**: `structuredContent` is the final cart snapshot (items,
  subtotal, free-shipping status) plus `checkout_note` — a demo-checkout
  disclaimer string. Cart is cleared as a side effect.
- **Widget**: `blocks/checkout-confirmation/` in the EDS repo.

## 8. get_recommendations — ❌ NOT REGISTERED — this is why it doesn't work in ChatGPT

- **Handler**: `actions/get-recommendations/index.js`
- **Description**: "Get personalized ASUS product recommendations —
  similar or complementary laptops and accessories (mice, docks, sleeves,
  monitors, storage). Pass product_name/product_id when the user is
  looking at a specific laptop, pass session_id to base recommendations on
  their cart, or call with neither for general trending picks. Also call
  this proactively after a successful add-to-cart to surface complementary
  accessories."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "product_name": { "type": "string", "description": "Laptop the recommendations should be based on" },
    "product_id": { "type": "string", "description": "Exact catalog id, if already known" },
    "session_id": { "type": "string", "description": "Cart session id — used to base recommendations on the last item added to cart if no product is specified" },
    "limit": { "type": "number", "description": "Max recommendations to return, default 4, max 6" }
  }
}
```
- **Output shape**: `structuredContent: { recommendations: [<card + reason>, ...], based_on: 'product'|'cart'|'trending' }`.
- **Widget**: `blocks/recommendations/` in the EDS repo.
- **Annotations**: read-only, safe to mark `readOnlyHint: true`.

## 9. get_warranty_options — ❌ NOT REGISTERED — this is why it doesn't work in ChatGPT

- **Handler**: `actions/get-warranty-options/index.js` (new)
- **Description**: "Show ASUS Premium Care (APC) protection plan options
  and pricing — a 1-year or 2-year warranty extension, or a 3-year
  extension bundled with Accidental Damage Protection (ADP) covering
  drops, spills, electrical surges, and cracked LCD screens. Pass
  product_name/product_id to scope this to a specific laptop, or call with
  neither for the general plan lineup. Call manage_cart with the returned
  plan_id afterward to add a plan to a laptop already in the cart."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "product_name": { "type": "string", "description": "Laptop to show protection plans for, e.g. \"ROG Strix G16\"" },
    "product_id": { "type": "string", "description": "Exact catalog id, if already known" }
  }
}
```
- **Output shape**: `structuredContent: { product: <card>|null, plans: [<plan>, ...] }`.
  - `product`: `toCard()` card for the resolved laptop, or `null` if none resolved (still returns the 3 generic plans in that case).
  - `plans`: always exactly 3, from `lib/catalog.js` `WARRANTY_PLANS`:
    `apc-1yr` ($79.99, estimate), `apc-2yr` ($149.99, estimate), `apc-3yr-adp`
    ($209.99, confirmed live shop.asus.com price, includes ADP). Each plan
    object: `{ id, name, provider, duration_years, price_usd, includes_adp, covers[], description }`.
- **Widget**: `blocks/warranty-options/` in the EDS repo — **not yet built**
  (tracked separately; the cart widget's `warranty_upsell` prompt from
  view_cart is the interim entry point into this flow until the dedicated
  picker widget exists).

---

## Known gaps to flag back to the team

- **Catalog is still mock data.** `lib/catalog.js` has 11 realistic
  Zenbook/ROG/TUF/Vivobook/ProArt laptop records plus 6 cross-sell
  accessories with price + specs, but it is not a live feed. Swap it for a
  real API per the `TODO` comment at the top of that file and in each
  action.
- **ASUS Premium Care pricing is partially estimated.** Only the 3-year +
  ADP tier ($209.99) is a confirmed live shop.asus.com price; the 1-year
  and 2-year tiers are reasonable estimates scaled down from that anchor —
  see the comment above `WARRANTY_PLANS` in `lib/catalog.js`. Replace with
  confirmed per-tier pricing if ASUS publishes it.
- **Cart persistence uses Adobe I/O Runtime State** (via `@adobe/aio-sdk`),
  keyed by `session_id`, with an in-memory fallback for local dev. This
  works, but only as long as the host model faithfully echoes `session_id`
  back — there's no login/session of its own to rely on.
- **Checkout is a demo.** No real order/payment API is wired up; see the
  `TODO` in `actions/checkout/index.js`.
- **Recommendations are catalog-derived, not ML-based.** Good enough for a
  demo; swap in a real recommendation service before relying on this for
  production personalization.
- **`blocks/warranty-options/` doesn't exist yet in the EDS repo.** The
  backend action and cart upsell hint are ready; the dedicated plan-picker
  widget is still on the backlog (see task tracker).
