const handler = require('../../actions/manage-cart/index.js');

describe('manage_cart handler', () => {
    test('view on a brand new session returns an empty cart and a new session_id', async () => {
        const out = await handler({ operation: 'view' });
        expect(out.structuredContent.items).toEqual([]);
        expect(out.structuredContent.session_id).toMatch(/^sess_/);
        expect(out.content[0].text).toMatch(/empty/i);
    });

    test('add creates a cart and returns the same session_id on follow-up calls', async () => {
        const added = await handler({ operation: 'add', product_name: 'TUF Gaming A16', quantity: 2 });
        const sessionId = added.structuredContent.session_id;
        expect(added.structuredContent.items).toHaveLength(1);
        expect(added.structuredContent.items[0].quantity).toBe(2);
        expect(added.structuredContent.subtotal_usd).toBe(2798);

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
        const added = await handler({ operation: 'add', product_name: 'Vivobook S14' });
        const sessionId = added.structuredContent.session_id;
        const updated = await handler({ operation: 'update', product_name: 'Vivobook S14', quantity: 5, session_id: sessionId });
        expect(updated.structuredContent.items[0].quantity).toBe(5);

        const removed = await handler({ operation: 'remove', product_name: 'Vivobook S14', session_id: sessionId });
        expect(removed.structuredContent.items).toHaveLength(0);
    });

    test('clear empties the cart', async () => {
        const added = await handler({ operation: 'add', product_name: 'Zenbook A14' });
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

    test('add a warranty plan for a laptop already in the cart', async () => {
        const added = await handler({ operation: 'add', product_name: 'ROG Strix G16' });
        const sessionId = added.structuredContent.session_id;
        const withPlan = await handler({
            operation: 'add',
            plan_id: 'apc-3yr-adp',
            for_product_name: 'ROG Strix G16',
            session_id: sessionId,
        });
        expect(withPlan.structuredContent.items).toHaveLength(2);
        const planLine = withPlan.structuredContent.items.find((i) => i.item_type === 'warranty');
        expect(planLine).toBeDefined();
        expect(planLine.plan_id).toBe('apc-3yr-adp');
        expect(planLine.for_product_id).toBe('rog-strix-g16-2025');
        expect(planLine.price_usd).toBe(209.99);
        expect(withPlan.content[0].text).toMatch(/ASUS Premium Care/i);
    });

    test('rejects adding a warranty plan for a laptop that is not in the cart yet', async () => {
        const started = await handler({ operation: 'view' });
        const sessionId = started.structuredContent.session_id;
        const out = await handler({
            operation: 'add',
            plan_id: 'apc-1yr',
            for_product_name: 'ROG Strix G16',
            session_id: sessionId,
        });
        expect(out.content[0].text).toMatch(/isn't in your cart yet/i);
        expect(out.structuredContent).toBeUndefined();
    });

    test('rejects an unknown plan_id', async () => {
        const added = await handler({ operation: 'add', product_name: 'ROG Strix G16' });
        const sessionId = added.structuredContent.session_id;
        const out = await handler({
            operation: 'add',
            plan_id: 'apc-9999yr',
            for_product_name: 'ROG Strix G16',
            session_id: sessionId,
        });
        expect(out.content[0].text).toMatch(/unknown warranty plan/i);
    });

    test('warranty plan cost counts toward subtotal and item_count', async () => {
        const added = await handler({ operation: 'add', product_name: 'TUF Gaming A16', quantity: 1 });
        const sessionId = added.structuredContent.session_id;
        const withPlan = await handler({
            operation: 'add',
            plan_id: 'apc-2yr',
            for_product_name: 'TUF Gaming A16',
            session_id: sessionId,
        });
        expect(withPlan.structuredContent.subtotal_usd).toBeCloseTo(1399 + 149.99, 2);
        expect(withPlan.structuredContent.item_count).toBe(2);
    });

    test('removing the laptop also removes its attached warranty plan', async () => {
        const added = await handler({ operation: 'add', product_name: 'Zenbook A14' });
        const sessionId = added.structuredContent.session_id;
        await handler({ operation: 'add', plan_id: 'apc-1yr', for_product_name: 'Zenbook A14', session_id: sessionId });
        const removed = await handler({ operation: 'remove', product_name: 'Zenbook A14', session_id: sessionId });
        expect(removed.structuredContent.items).toHaveLength(0);
    });
});
