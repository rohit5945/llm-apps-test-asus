const handler = require('../../actions/manage-cart/index.js');

describe('manage_cart handler', () => {
    test('view on a brand new session returns an empty cart and a new session_id', async () => {
        const out = await handler({ operation: 'view' });
        expect(out.structuredContent.items).toEqual([]);
        expect(out.structuredContent.session_id).toMatch(/^sess_/);
        expect(out.content[0].text).toMatch(/empty/i);
    });

    test('add creates a cart and returns the same session_id on follow-up calls', async () => {
        const added = await handler({ operation: 'add', product_name: 'TUF Gaming A15', quantity: 2 });
        const sessionId = added.structuredContent.session_id;
        expect(added.structuredContent.items).toHaveLength(1);
        expect(added.structuredContent.items[0].quantity).toBe(2);
        expect(added.structuredContent.subtotal_usd).toBe(1998);

        const viewed = await handler({ operation: 'view', session_id: sessionId });
        expect(viewed.structuredContent.items).toHaveLength(1);
        expect(viewed.structuredContent.session_id).toBe(sessionId);
    });

    test('adding the same product twice increments quantity instead of duplicating', async () => {
        const first = await handler({ operation: 'add', product_name: 'ROG Strix G16' });
        const sessionId = first.structuredContent.session_id;
        const second = await handler({ operation: 'add', product_name: 'ROG Strix G16', session_id: sessionId });
        expect(second.structuredContent.items).toHaveLength(1);
        expect(second.structuredContent.items[0].quantity).toBe(2);
    });

    test('update changes quantity; quantity 0 / remove drops the line item', async () => {
        const added = await handler({ operation: 'add', product_name: 'Vivobook Pro 15' });
        const sessionId = added.structuredContent.session_id;
        const updated = await handler({ operation: 'update', product_name: 'Vivobook Pro 15', quantity: 5, session_id: sessionId });
        expect(updated.structuredContent.items[0].quantity).toBe(5);

        const removed = await handler({ operation: 'remove', product_name: 'Vivobook Pro 15', session_id: sessionId });
        expect(removed.structuredContent.items).toHaveLength(0);
    });

    test('clear empties the cart', async () => {
        const added = await handler({ operation: 'add', product_name: 'Zenbook 14 (UM3406ZA)' });
        const sessionId = added.structuredContent.session_id;
        const cleared = await handler({ operation: 'clear', session_id: sessionId });
        expect(cleared.structuredContent.items).toEqual([]);
    });

    test('add with an unknown product name fails gracefully', async () => {
        const out = await handler({ operation: 'add', product_name: 'Nonexistent Laptop 9000' });
        expect(out.content[0].text).toMatch(/no asus laptop found/i);
        expect(out.structuredContent).toBeUndefined();
    });

    test('unknown operation returns a helpful error', async () => {
        const out = await handler({ operation: 'teleport' });
        expect(out.content[0].text).toMatch(/unknown cart operation/i);
    });
});
