const handler = require('../../actions/compare-products/index.js');

describe('compare_products handler', () => {
    test('compares two products by name', async () => {
        const out = await handler({ product_names: ['ROG Strix G16', 'TUF Gaming F15'] });
        expect(Array.isArray(out.content)).toBe(true);
        expect(out.structuredContent.products).toHaveLength(2);
        expect(out.structuredContent.spec_fields.length).toBeGreaterThan(0);
    });

    test('compares by product_ids', async () => {
        const out = await handler({ product_ids: ['rog-zephyrus-g14-ga403', 'proart-studiobook16-h7604'] });
        expect(out.structuredContent.products.map((p) => p.id)).toEqual(
            expect.arrayContaining(['rog-zephyrus-g14-ga403', 'proart-studiobook16-h7604'])
        );
    });

    test('flags the cheapest product as the price winner', async () => {
        const out = await handler({ product_names: ['TUF Gaming A15', 'ROG Strix SCAR 18'] });
        expect(out.structuredContent.best_per_row.price_usd).toBe('tuf-gaming-a15-fa507');
    });

    test('caps comparison at 4 products', async () => {
        const out = await handler({
            product_names: ['ROG Strix G16', 'TUF Gaming F15', 'Vivobook Pro 15', 'ProArt P16', 'Zenbook 14 (UM3406ZA)'],
        });
        expect(out.structuredContent.products.length).toBeLessThanOrEqual(4);
    });

    test('requires at least 2 valid products', async () => {
        const out = await handler({ product_names: ['ROG Strix G16'] });
        expect(out.content[0].text).toMatch(/at least 2/i);
        expect(out.structuredContent).toBeUndefined();
    });

    test('returns a helpful message when nothing is provided', async () => {
        const out = await handler({});
        expect(out.content[0].text).toMatch(/provide/i);
    });
});
