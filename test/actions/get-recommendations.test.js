const handler = require('../../actions/get-recommendations/index.js');
const cartHandler = require('../../actions/manage-cart/index.js');

describe('get_recommendations handler', () => {
    test('no context -> trending fallback', async () => {
        const out = await handler({});
        expect(out.structuredContent.based_on).toBe('trending');
        expect(out.structuredContent.recommendations.length).toBeGreaterThan(0);
        expect(out.structuredContent.recommendations.every((r) => r.reason)).toBe(true);
    });

    test('product-based: gaming laptop pulls in a compatible accessory', async () => {
        const out = await handler({ product_name: 'ROG Strix G16' });
        expect(out.structuredContent.based_on).toBe('product');
        const recs = out.structuredContent.recommendations;
        expect(recs.length).toBeGreaterThan(0);
        expect(recs.some((r) => r.is_accessory)).toBe(true);
        expect(recs.some((r) => r.id === 'rog-strix-g16-g614')).toBe(false); // never recommend itself
    });

    test('product-based: recommends other laptops in the same brand line', async () => {
        const out = await handler({ product_name: 'ROG Strix G16' });
        const recs = out.structuredContent.recommendations;
        expect(recs.some((r) => r.brand_line === 'rog' && !r.is_accessory)).toBe(true);
    });

    test('cart-based: falls back to the most recently added cart item when no product given', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'ProArt Studiobook 16' });
        const sessionId = added.structuredContent.session_id;
        const out = await handler({ session_id: sessionId });
        expect(out.structuredContent.based_on).toBe('cart');
        expect(out.structuredContent.recommendations.some((r) => r.brand_line === 'proart')).toBe(true);
    });

    test('unknown product name falls back to trending instead of erroring', async () => {
        const out = await handler({ product_name: 'Totally Fake Laptop 9000' });
        expect(out.structuredContent.based_on).toBe('trending');
    });

    test('limit is respected and capped', async () => {
        const out = await handler({ limit: 999 });
        expect(out.structuredContent.recommendations.length).toBeLessThanOrEqual(6);
    });

    test('accessories can be resolved and added to the cart directly', async () => {
        const out = await cartHandler({ operation: 'add', product_name: 'ROG Gladius III Wireless Mouse' });
        expect(out.structuredContent.items[0].name).toBe('ROG Gladius III Wireless Mouse');
    });
});
