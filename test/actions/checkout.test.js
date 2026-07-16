const cartHandler = require('../../actions/manage-cart/index.js');
const checkoutHandler = require('../../actions/checkout/index.js');

describe('checkout handler', () => {
    test('requires a session_id', async () => {
        const out = await checkoutHandler({});
        expect(out.content[0].text).toMatch(/session_id/i);
    });

    test('empty cart cannot be checked out', async () => {
        const view = await cartHandler({ operation: 'view' });
        const out = await checkoutHandler({ session_id: view.structuredContent.session_id });
        expect(out.content[0].text).toMatch(/empty/i);
    });

    test('checking out a non-empty cart returns an order summary and clears the cart', async () => {
        const added = await cartHandler({ operation: 'add', product_name: 'TUF Gaming A15', quantity: 1 });
        const sessionId = added.structuredContent.session_id;

        const out = await checkoutHandler({ session_id: sessionId });
        expect(out.content[0].text).toMatch(/order summary/i);
        expect(out.structuredContent.checkout_note).toMatch(/demo checkout/i);

        const afterCheckout = await cartHandler({ operation: 'view', session_id: sessionId });
        expect(afterCheckout.structuredContent.items).toEqual([]);
    });
});
