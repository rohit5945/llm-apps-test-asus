const handler = require('../../actions/search-products/index.js');

describe('search_products handler', () => {
    test('content is an array of text blocks', async () => {
        const out = await handler({});
        expect(Array.isArray(out.content)).toBe(true);
        expect(out.content[0]).toMatchObject({ type: 'text', text: expect.any(String) });
    });

    test('structuredContent is a plain object, not a bare array', async () => {
        const out = await handler({});
        expect(typeof out.structuredContent).toBe('object');
        expect(Array.isArray(out.structuredContent)).toBe(false);
        expect(Array.isArray(out.structuredContent.products)).toBe(true);
    });

    test('filters by category', async () => {
        const out = await handler({ category: 'Zenbook S' });
        const products = out.structuredContent.products;
        expect(products.length).toBeGreaterThan(0);
        expect(products.every((p) => p.category === 'Zenbook S')).toBe(true);
    });

    test('filters by free-text query', async () => {
        const out = await handler({ query: 'DUO' });
        const products = out.structuredContent.products;
        expect(products.length).toBeGreaterThan(0);
        expect(products.every((p) => /duo/i.test(`${p.name} ${p.description}`))).toBe(true);
    });

    test('returns no results for an unmatched query', async () => {
        const out = await handler({ query: 'zzzznotarealmodel' });
        expect(out.structuredContent.products).toHaveLength(0);
        expect(out.content[0].text).toMatch(/no asus laptops found/i);
    });

    test('"gaming laptop under $1500" — use_case + max_price filters find TUF value picks, not the ROG/TUF flagships', async () => {
        const out = await handler({ use_case: 'gaming', max_price: 1500 });
        const products = out.structuredContent.products;
        expect(products.length).toBeGreaterThan(0);
        expect(products.every((p) => p.price_usd <= 1500)).toBe(true);
        expect(products.some((p) => p.id === 'tuf-gaming-a16-2025')).toBe(true);
        expect(products.some((p) => p.id === 'rog-strix-scar18-2026')).toBe(false);
    });

    test('gpu_tier filters out laptops below the requested tier', async () => {
        const out = await handler({ gpu_tier: 'high' });
        const products = out.structuredContent.products;
        expect(products.length).toBeGreaterThan(0);
        expect(products.every((p) => ['high', 'enthusiast'].includes(p.gpu_tier))).toBe(true);
    });

    test('sort_by price_asc returns ascending price order', async () => {
        const out = await handler({ use_case: 'gaming', sort_by: 'price_asc', limit: 10 });
        const prices = out.structuredContent.products.map((p) => p.price_usd);
        const sorted = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sorted);
    });

    test('limit is capped at 10', async () => {
        const out = await handler({ limit: 999 });
        expect(out.structuredContent.products.length).toBeLessThanOrEqual(10);
    });

    test('bare "Zenbook" in category expands to the whole family, not just an exact-category match', async () => {
        const out = await handler({ category: 'Zenbook' });
        const products = out.structuredContent.products;
        // 4 Zenbook models: Zenbook S16, Zenbook DUO, Zenbook A14, Zenbook 14 OLED (UX3405)
        expect(products.length).toBe(4);
        expect(products.every((p) => p.brand_line === 'zenbook')).toBe(true);
    });

    test('"Zenbook S" (not a bare brand token) still means exactly that sub-series', async () => {
        const out = await handler({ category: 'Zenbook S' });
        const products = out.structuredContent.products;
        expect(products.length).toBe(1);
        expect(products.every((p) => p.category === 'Zenbook S')).toBe(true);
    });

    test('bare "gaming" in category expands via use_case, same as the use_case param', async () => {
        const out = await handler({ category: 'gaming' });
        const products = out.structuredContent.products;
        // 7 gaming laptops: Zephyrus G14, Strix SCAR 18, Strix G16, Flow Z13, TUF A16, TUF A14, TUF F16
        expect(products.length).toBe(7);
        expect(products.every((p) => (p.use_cases || []).includes('gaming'))).toBe(true);
    });
});
