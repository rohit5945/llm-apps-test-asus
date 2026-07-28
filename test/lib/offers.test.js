const { OFFERS, getApplicableOffers } = require('../../lib/offers');

describe('getApplicableOffers', () => {
    test('exports exactly 3 base offers', () => {
        expect(OFFERS).toHaveLength(3);
    });

    test('empty cart -> no offers', () => {
        expect(getApplicableOffers([])).toEqual([]);
        expect(getApplicableOffers(undefined)).toEqual([]);
    });

    test('accessory-only cart -> no offers (laptop-purchase offers only)', () => {
        const items = [{ item_type: 'product', is_accessory: true, product_id: 'rog-gladius-iii-mouse' }];
        expect(getApplicableOffers(items)).toEqual([]);
    });

    test('warranty-only line items (no laptop) -> no offers', () => {
        const items = [{ item_type: 'warranty', for_product_id: 'tuf-gaming-a16-2025' }];
        expect(getApplicableOffers(items)).toEqual([]);
    });

    test('cart with a laptop -> returns all 3 offers before expiry', () => {
        const items = [{ item_type: 'product', is_accessory: false, product_id: 'tuf-gaming-a16-2025' }];
        const offers = getApplicableOffers(items);
        expect(offers).toHaveLength(3);
        expect(offers.map((o) => o.id).sort()).toEqual(['adobe-cc-bundle', 'asus-member-adp', 'student-military-discount']);
    });

    test('expired bundle offer is excluded once past its expiry date', () => {
        const items = [{ item_type: 'product', is_accessory: false, product_id: 'tuf-gaming-a16-2025' }];
        const RealDate = Date;
        // Simulate "now" being after the Adobe CC bundle's 2026-08-31 expiry.
        global.Date = class extends RealDate {
            constructor(...args) {
                if (args.length === 0) return new RealDate('2026-09-15T00:00:00Z');
                return new RealDate(...args);
            }
        };
        try {
            const offers = getApplicableOffers(items);
            expect(offers.some((o) => o.id === 'adobe-cc-bundle')).toBe(false);
            expect(offers).toHaveLength(2);
        } finally {
            global.Date = RealDate;
        }
    });
});
