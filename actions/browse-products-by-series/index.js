// TODO: Replace MOCK_DATA with a real API call.
// See the TODO block below the handler for endpoint details.
const MOCK_DATA = [
    {
        name: 'ASUS Zenbook DUO (UX8407)',
        description: 'Dual 3K Lumina Pro OLED laptop with Intel Core Ultra Series 3, 18+ hr battery, and durable Ceraluminum chassis.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/cee1353c-a974-4436-9235-ce4443f58285/w800/fwebp',
        category: 'Zenbook Duo'
    },
    {
        name: 'ASUS Zenbook 14 (UX3480); Copilot+ PC',
        description: 'Lightweight 14-inch Copilot+ PC in the Zenbook family.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/696b867d-2d95-4af2-b2d4-0ad7799ef495/w800/fwebp',
        category: 'Zenbook'
    },
    {
        name: 'ASUS Zenbook A16 (UX3607); Copilot+ PC',
        description: '16-inch Zenbook A-series Copilot+ PC.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/ec3e3399-c34a-4ed9-be76-c9be1ac1ca6e/w800/fwebp',
        category: 'Zenbook A'
    },
    {
        name: 'ASUS Zenbook A14 (UX3407); Copilot+ PC',
        description: 'Ultralight 14-inch Zenbook A-series Copilot+ PC.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/daf7ed78-fcec-4f54-82a6-db3204fdece3/w800/fwebp',
        category: 'Zenbook A'
    },
    {
        name: 'ASUS Zenbook S16 (UX5606); Copilot+ PC',
        description: 'Premium 16-inch Zenbook S-series Copilot+ PC.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/8264ddf7-ccc7-4b11-b18d-360f92049814/w800/fwebp',
        category: 'Zenbook S'
    },
    {
        name: 'ASUS Zenbook S14 (UX5406); Copilot+ PC',
        description: 'Premium 14-inch Zenbook S-series Copilot+ PC.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/827c5809-1d54-487a-aad4-9b5c0aee3fb8/w800/fwebp',
        category: 'Zenbook S'
    },
    {
        name: 'ASUS Zenbook 14 (UM3406ZA)',
        description: '14-inch Zenbook laptop.',
        image_url: 'https://dlcdnwebimgs.asus.com/gain/1474e646-c89a-484b-b052-e3e2e46a1e5a/w800/fwebp',
        category: 'Zenbook'
    }
]

module.exports = async ({ category = '' }) => {
    if (!category || typeof category !== 'string' || !category.trim()) {
        return {
            content: [{ type: 'text', text: 'Please provide a category (Zenbook series) to browse, e.g. "Zenbook S".' }],
            // structuredContent.products — derived from action name "browse_products_by_series" (bare array outputSchema rule)
            structuredContent: { products: [] }
        }
    }

    const query = category.trim().toLowerCase()
    const products = MOCK_DATA.filter((item) => item.category.toLowerCase() === query)

    if (products.length === 0) {
        return {
            content: [{ type: 'text', text: `No Zenbook models found for the "${category.trim()}" series.` }],
            // structuredContent.products — derived from action name "browse_products_by_series" (bare array outputSchema rule)
            structuredContent: { products: [] }
        }
    }

    const summary = `Found ${products.length} ${category.trim()} model${products.length === 1 ? '' : 's'}: ${products.map((p) => p.name).join(', ')}.`

    return {
        content: [{ type: 'text', text: summary }],
        // structuredContent.products — derived from action name "browse_products_by_series" (bare array outputSchema rule)
        structuredContent: { products }
    }
}

/*
 * TODO: Replace MOCK_DATA with a real API call.
 *
 * Suggested endpoint pattern (update based on actual site API):
 *   GET ${process.env.API_BASE_URL}/products?series=${category}
 *
 * Environment variables to configure:
 *   API_BASE_URL   Base URL of the website's API
 *   API_KEY        API key if required (add to .env and app.config.yaml)
 *
 * Authentication: check the website's developer docs or network requests
 *   captured during browsing for the correct auth header pattern.
 *
 * Example fetch:
 *   const res = await fetch(
 *     `${process.env.API_BASE_URL}/products?series=${encodeURIComponent(category)}`,
 *     { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } }
 *   )
 *   if (!res.ok) throw new Error(`API error: ${res.status}`)
 *   return await res.json()
 */
