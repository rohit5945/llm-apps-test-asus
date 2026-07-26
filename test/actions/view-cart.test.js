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
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A15', quantity: 2 });
        const sessionId = added.structuredContent.session_id;
        const out = await viewCartHandler({ session_id: sessionId });
        expect(out.structuredContent.items).toHaveLength(1);
        expect(out.structuredContent.subtotal_usd).toBe(1998);
        expect(out.content[0].text).toMatch(/TUF Gaming A15/);
    });

    test('surfaces free-shipping nudge below threshold and congrats above it', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A15', quantity: 1 });
        const sessionId = added.structuredContent.session_id;
        const below = await viewCartHandler({ session_id: sessionId });
        expect(below.structuredContent.qualifies_free_shipping).toBe(false);
        expect(below.content[0].text).toMatch(/more for free shipping/i);

        await cartHandler({ operation: 'add', product_name: 'ROG Strix SCAR 18', session_id: sessionId });
        const above = await viewCartHandler({ session_id: sessionId });
        expect(above.structuredContent.qualifies_free_shipping).toBe(true);
        expect(above.content[0].text).toMatch(/free shipping/i);
    });
});
