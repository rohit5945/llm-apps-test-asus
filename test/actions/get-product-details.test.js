const handler = require('../../actions/get-product-details/index.js');

describe('get_product_details handler', () => {
    test('content is an array of text blocks', async () => {
        const out = await handler({ product_name: 'ASUS Zenbook DUO (UX8407)' });
        expect(Array.isArray(out.content)).toBe(true);
        expect(out.content[0]).toMatchObject({ type: 'text', text: expect.any(String) });
    });

    test('"Tell me more about the ASUS Zenbook DUO" returns model details', async () => {
        const out = await handler({ product_name: 'ASUS Zenbook DUO' });
        expect(out.content[0].text.length).toBeGreaterThan(0);
        expect(out.structuredContent).toBeDefined();
        expect(out.structuredContent.name).toBe('ASUS Zenbook DUO (UX8407)');
        expect(out.structuredContent.category).toBe('Zenbook Duo');
    });

    test('structuredContent is a plain object, not a bare array', async () => {
        const out = await handler({ product_name: 'ASUS Zenbook DUO' });
        expect(typeof out.structuredContent).toBe('object');
        expect(Array.isArray(out.structuredContent)).toBe(false);
    });

    test('returns error message when required arg is missing', async () => {
        const out = await handler({});
        expect(out.content[0].text).toMatch(/product_name|provide/i);
    });

    test('returns not-found message and no structuredContent for unknown model', async () => {
        const out = await handler({ product_name: 'Nonexistent Laptop 9000' });
        expect(out.content[0].text).toMatch(/no.*found|not found/i);
        expect(out.structuredContent).toBeUndefined();
    });
});
