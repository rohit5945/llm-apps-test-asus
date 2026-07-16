# Adobe LLM Apps UI setup — search / compare / cart expansion

Tool metadata (name, description, input schema, widget wiring) lives in the
Adobe LLM Apps UI, not in this repo (see the main README's "developer
contract"). This doc is the checklist for what to enter in the UI so the
code in this PR actually works end to end. Nothing here is optional — the
host model can only pass the arguments a tool's inputSchema declares, so
until these are entered, `search-products` etc. will keep behaving like the
old 7-laptop demo even though the handler now supports a lot more.

For each action: download the current `actions.json` after making these
changes and drop it at the repo root to test locally with `npm run dev:local`.

## search-products (update existing)

Update the description and inputSchema so the model can extract budget /
use-case / spec constraints out of sentences like *"I'm looking for a
gaming laptop under $1200"* or *"a light 14-inch laptop for a student"*.

- **Description**: "Search ASUS laptops (Zenbook, ROG, TUF Gaming, Vivobook,
  ProArt) by free-text query and/or structured filters like budget, use
  case, GPU tier, RAM, screen size or weight. Use this whenever the user
  describes what they want in a laptop rather than naming a specific model."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Free-text search terms, e.g. a model name or keyword" },
    "category": { "type": "string", "description": "Exact series name, e.g. \"Zenbook S\", \"ROG Strix\" — or a bare brand/use-case word like \"zenbook\" or \"gaming\" to get the whole family" },
    "brand_line": { "type": "string", "enum": ["zenbook", "rog", "tuf", "vivobook", "proart"], "description": "ASUS sub-brand" },
    "use_case": { "type": "string", "enum": ["gaming", "creator", "student", "productivity", "business", "travel", "budget", "professional"], "description": "What the laptop is mainly for — infer this from phrases like \"gaming laptop\" or \"for school\"" },
    "min_price": { "type": "number", "description": "Minimum price in USD" },
    "max_price": { "type": "number", "description": "Maximum price in USD — set this from phrases like \"under $1200\" or \"budget of 1000\"" },
    "min_ram_gb": { "type": "number", "description": "Minimum RAM in GB" },
    "gpu_tier": { "type": "string", "enum": ["integrated", "entry", "mid", "high", "enthusiast"], "description": "Minimum acceptable GPU tier" },
    "min_screen_size": { "type": "number" },
    "max_screen_size": { "type": "number" },
    "max_weight_kg": { "type": "number", "description": "Set this for \"lightweight\"/\"portable\" requests" },
    "sort_by": { "type": "string", "enum": ["relevance", "price_asc", "price_desc", "rating_desc"] },
    "limit": { "type": "number", "description": "Max results to return, default 5 (10 for a broad brand/use-case browse), max 10" }
  }
}
```
- **Widget**: keep the existing `widget_type: "EDS"` config, same
  `script_url` you already have configured; `widget_embed_url` unchanged
  (still points at the `search-products` block/demo page).

## get-product-details (update existing)

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
- **Widget**: unchanged EDS config.

## browse-products-by-series (update existing)

- **Description**: "Browse ASUS laptops by exact series name (e.g. \"Zenbook
  S\"), by sub-brand (\"rog\", \"tuf\", \"vivobook\", \"zenbook\", \"proart\"),
  or by use case (\"gaming\", \"creator\", \"student\", ...). Prefer
  search-products instead when the user gives a budget or spec constraint."
- **inputSchema**: add `max_price`, `sort_by`, `limit` alongside the existing
  `category` param:

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
- **Widget**: unchanged EDS config.

## compare-products (new)

- **Description**: "Compare 2-4 specific ASUS laptops side by side on price,
  CPU, GPU, RAM, storage, screen, weight, battery and rating. Use this when
  the user names two or more models to compare, e.g. \"compare the ROG Strix
  G16 and the TUF Gaming F15\"."
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
- **Widget**: EDS, `widget_embed_url` → the `compare-products` demo page
  (`.../compare-products-demo` on the EDS repo's preview/live domain), same
  `script_url` as the other widgets in this app.

## manage-cart (new)

One tool for all cart CRUD (add / update / remove / view / clear) — see the
README in the backend PR for why this is a single tool instead of four.

- **Description**: "Add, update, remove, view, or clear items in the user's
  ASUS shopping cart. IMPORTANT: this tool returns a `session_id` — always
  reuse the *same* session_id on every later manage-cart or checkout call in
  this conversation so the cart persists; do not generate your own."
- **inputSchema**:

```json
{
  "type": "object",
  "properties": {
    "operation": { "type": "string", "enum": ["view", "add", "update", "remove", "clear"], "description": "Cart action to perform" },
    "product_name": { "type": "string" },
    "product_id": { "type": "string" },
    "quantity": { "type": "number", "description": "Quantity to add, or to set for update. Ignored for remove/view/clear." },
    "session_id": { "type": "string", "description": "Cart session id returned by a previous manage-cart call. Omit only on the very first call." }
  },
  "required": ["operation"]
}
```
- **Widget**: EDS, `widget_embed_url` → the `cart` demo page
  (`.../cart-demo`), same `script_url` as the others.
- **Annotations**: this tool has side effects (add/update/remove/clear all
  mutate state) — do **not** mark it `readOnlyHint: true` the way `echo` is.

## checkout (new)

- **Description**: "Check out the user's ASUS cart for a given session_id.
  This is a demo checkout — it prints an order summary and links to
  asus.com, it does not take payment or place a real order. Requires a
  session_id from a prior manage-cart call."
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
- **Widget**: none needed — text-only response is enough for a demo
  checkout; give it a `structuredContent`-aware EDS widget later if you wire
  a real order API.

## Known gaps to flag back to the team

- **Catalog is still mock data.** `lib/catalog.js` has ~17 realistic
  Zenbook/ROG/TUF/Vivobook/ProArt records with price + specs, but it is not
  a live feed. Swap it for a real API per the `TODO` comment at the top of
  that file and in each action.
- **Cart persistence uses Adobe I/O Runtime State** (via `@adobe/aio-sdk`,
  already a dependency) keyed by `session_id`, with an in-memory fallback
  for local dev. This works, but only as long as the host model faithfully
  echoes `session_id` back — there's no login/session of its own to rely on.
- **Checkout is a demo.** No real order/payment API is wired up; see the
  `TODO` in `actions/checkout/index.js`.
- **Product images**: only the original 7 Zenbook items have real
  `image_url`s pulled from `dlcdnwebimgs.asus.com`. The ROG/TUF/Vivobook/
  ProArt additions ship with `image_url: null` and fall back to a themed
  color swatch in the widgets — add real image URLs when available rather
  than guessing CDN paths.
- **Brand colors are a public approximation**, not the official Adobe/ASUS
  brand kit (see `scripts/asus-brand.js` in the EDS repo for the exact
  values and where to update them).
