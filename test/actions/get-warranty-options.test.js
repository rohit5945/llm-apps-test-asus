const handler = require('../../actions/get-warranty-options/index.js');

describe('get_warranty_options handler', () => {
    test('returns the 3 ASUS Premium Care tiers for a resolved product', async () => {
        const out = await handler({ product_name: 'ROG Strix G16' });
        expect(out.structuredContent.product).not.toBeNull();
        expect(out.structuredContent.product.id).toBe('rog-strix-g16-2025');
        expect(out.structuredContent.plans).toHaveLength(3);
        expect(out.structuredContent.plans.map((p) => p.id)).toEqual(['apc-1yr', 'apc-2yr', 'apc-3yr-adp']);
    });

    test('the confirmed 3-year + ADP tier price is 209.99', async () => {
        const out = await handler({ product_id: 'zenbook-s16-um5606' });
        const threeYear = out.structuredContent.plans.find((p) => p.id === 'apc-3yr-adp');
        expect(threeYear.price_usd).toBe(209.99);
        expect(threeYear.includes_adp).toBe(true);
    });

    test('no product resolves -> still returns the 3 generic plans with product: null', async () => {
        const out = await handler({ product_name: 'Nonexistent Laptop 9000' });
        expect(out.structuredContent.product).toBeNull();
        expect(out.structuredContent.plans).toHaveLength(3);
        expect(out.content[0].text).toMatch(/general|no specific/i);
    });

    test('called with no args at all -> still returns generic plans, no crash', async () => {
        const out = await handler({});
        expect(out.structuredContent.product).toBeNull();
        expect(out.structuredContent.plans).toHaveLength(3);
    });

    test('content is an array of text blocks', async () => {
        const out = await handler({ product_name: 'TUF Gaming A16' });
        expect(Array.isArray(out.content)).toBe(true);
        expect(out.content[0]).toMatchObject({ type: 'text', text: expect.any(String) });
    });
});
