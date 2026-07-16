const handler = require('../../actions/search-products/index.js');

describe('search_products handler', () => {
    test('content is an array of text blocks', async () => {
        const out = await handler({});
        expect(Array.isArray(out.content)).toBe(true);
        expect(out.content[0]).toMatchObject({ type: 'text', text: expect.any(String) });
    });

    test('"Show me some ASUS Zenbook laptops" returns Zenbook models', async () => {
        const out = await handler({});
        expect(out.content[0].text).toMatch(/Zenbook/i);
        expect(out.structuredContent.products.length).toBeGreaterThan(0);
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
        expect(out.content[0].text).toMatch(/no asus zenbook models found/i);
    });
});
