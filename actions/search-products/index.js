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
];

module.exports = async ({ query = '', category = '' } = {}) => {
    const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
    const cat = typeof category === 'string' ? category.trim() : '';

    const results = MOCK_DATA.filter((item) => {
        if (cat && item.category !== cat) return false;
        if (q) {
            const haystack = `${item.name} ${item.description || ''}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    });

    const filterParts = [];
    if (cat) filterParts.push(`series "${cat}"`);
    if (q) filterParts.push(`matching "${query.trim()}"`);
    const filterText = filterParts.length ? ` ${filterParts.join(' and ')}` : '';

    const summary = results.length
        ? `Found ${results.length} ASUS Zenbook model${results.length === 1 ? '' : 's'}${filterText}.`
        : `No ASUS Zenbook models found${filterText}.`;

    return {
        content: [{ type: 'text', text: summary }],
        // structuredContent.products — derived from action name "search_products" (bare array outputSchema rule)
        structuredContent: { products: results }
    };
};

/*
 * TODO: Replace MOCK_DATA with a real API call.
 *
 * Suggested endpoint pattern (update based on actual site API):
 *   GET ${process.env.API_BASE_URL}/products?query=${query}&category=${category}
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
 *     `${process.env.API_BASE_URL}/products?query=${encodeURIComponent(query)}`,
 *     { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } }
 *   )
 *   if (!res.ok) throw new Error(`API error: ${res.status}`)
 *   return await res.json()
 */
