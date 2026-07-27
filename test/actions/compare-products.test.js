const handler = require('../../actions/compare-products/index.js');

describe('compare_products handler', () => {
    test('compares two products by name', async () => {
        const out = await handler({ product_names: ['ROG Strix G16', 'TUF Gaming A16'] });
        expect(Array.isArray(out.content)).toBe(true);
        expect(out.structuredContent.products).toHaveLength(2);
        expect(out.structuredContent.spec_fields.length).toBeGreaterThan(0);
    });

    test('compares by product_ids', async () => {
        const out = await handler({ product_ids: ['rog-zephyrus-g14-2025', 'proart-px13-hn7306'] });
        expect(out.structuredContent.products.map((p) => p.id)).toEqual(
            expect.arrayContaining(['rog-zephyrus-g14-2025', 'proart-px13-hn7306'])
        );
    });

    test('flags the cheapest product as the price winner', async () => {
        const out = await handler({ product_names: ['TUF Gaming A16', 'ROG Strix SCAR 18'] });
        expect(out.structuredContent.best_per_row.price_usd).toBe('tuf-gaming-a16-2025');
    });

    test('caps comparison at 4 products', async () => {
        const out = await handler({
            product_names: ['ROG Strix G16', 'TUF Gaming A16', 'Vivobook S14', 'ProArt PX13', 'Zenbook A14'],
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

    test('catalog_options excludes products already being compared', async () => {
        const out = await handler({ product_names: ['ROG Strix G16', 'TUF Gaming A16'] });
        const ids = out.structuredContent.catalog_options.map((o) => o.id);
        expect(ids).not.toEqual(expect.arrayContaining(['rog-strix-g16-2025', 'tuf-gaming-a16-2025']));
        expect(out.structuredContent.catalog_options.length).toBeGreaterThan(0);
        expect(out.structuredContent.catalog_options.length).toBeLessThanOrEqual(12);
    });

    test('catalog_options entries expose only id, name, brand_line', async () => {
        const out = await handler({ product_names: ['ROG Strix G16', 'TUF Gaming A16'] });
        const option = out.structuredContent.catalog_options[0];
        expect(Object.keys(option).sort()).toEqual(['brand_line', 'id', 'name']);
    });
});
