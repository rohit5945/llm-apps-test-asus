const cartHandler = require('../../actions/manage-cart/index.js');
const viewCartHandler = require('../../actions/view-cart/index.js');

describe('view_cart handler', () => {
    test('no session_id -> friendly empty-state, no crash', async () => {
        const out = await viewCartHandler({});
        expect(out.structuredContent.items).toEqual([]);
        expect(out.content[0].text).toMatch(/don't have an active cart|empty/i);
    });

    test('empty cart for a real session says empty', async () => {
        const created = await cartHandler({ operation: 'view' });
        const out = await viewCartHandler({ session_id: created.structuredContent.session_id });
        expect(out.content[0].text).toMatch(/empty/i);
    });

    test('reflects items added via manage-cart', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A16', quantity: 2 });
        const sessionId = added.structuredContent.session_id;
        const out = await viewCartHandler({ session_id: sessionId });
        expect(out.structuredContent.items).toHaveLength(1);
        expect(out.structuredContent.subtotal_usd).toBe(2798);
        expect(out.content[0].text).toMatch(/TUF Gaming A16/);
    });

    test('surfaces free-shipping nudge below threshold and congrats above it', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A16', quantity: 1 });
        const sessionId = added.structuredContent.session_id;
        const below = await viewCartHandler({ session_id: sessionId });
        expect(below.structuredContent.qualifies_free_shipping).toBe(false);
        expect(below.content[0].text).toMatch(/more for free shipping/i);

        await cartHandler({ operation: 'add', product_name: 'ROG Strix SCAR 18', session_id: sessionId });
        const above = await viewCartHandler({ session_id: sessionId });
        expect(above.structuredContent.qualifies_free_shipping).toBe(true);
        expect(above.content[0].text).toMatch(/free shipping/i);
    });

    test('flags warranty_upsell true for a laptop with no attached plan', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A16' });
        const sessionId = added.structuredContent.session_id;
        const out = await viewCartHandler({ session_id: sessionId });
        const laptopLine = out.structuredContent.items.find((i) => i.item_type !== 'warranty');
        expect(laptopLine.warranty_upsell).toBe(true);
    });

    test('warranty_upsell flips to false once a plan is attached', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A16' });
        const sessionId = added.structuredContent.session_id;
        await cartHandler({
            operation: 'add',
            plan_id: 'apc-1yr',
            for_product_name: 'TUF Gaming A16',
            session_id: sessionId,
        });
        const out = await viewCartHandler({ session_id: sessionId });
        const laptopLine = out.structuredContent.items.find((i) => i.item_type !== 'warranty');
        expect(laptopLine.warranty_upsell).toBe(false);
        const planLine = out.structuredContent.items.find((i) => i.item_type === 'warranty');
        expect(planLine.warranty_upsell).toBeUndefined();
    });
});
