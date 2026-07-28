// ASUS US shopper offers/promotions surfaced alongside the cart.
//
// These are real, currently-verified ASUS US programs as of this research
// pass (July 2026) — not invented promos. Sources: ASUS Member program
// terms (Accidental Damage Protection registration benefit), the ASUS +
// Adobe Creative Cloud bundle promotion, and ASUS's ID.me-verified
// student/teacher/military discount program.
//
// IMPORTANT: the Adobe Creative Cloud bundle ('adobe-cc-bundle') has a hard
// expiry (2026-08-31). If this demo is still running after that date,
// revisit whether ASUS has renewed/replaced the promo before continuing to
// show it — getApplicableOffers() below will silently stop returning it
// once expired, but the OFFERS list itself should be refreshed with
// whatever (if anything) ASUS is running next.
const OFFERS = [
  {
    id: 'asus-member-adp',
    title: 'Free 1-Year Accidental Damage Protection',
    description: 'Register as an ASUS Member within 60 days of purchase and get 1 year of complimentary Accidental Damage Protection at no extra cost.',
    type: 'membership',
    evergreen: true,
  },
  {
    id: 'adobe-cc-bundle',
    title: 'Free Adobe Creative Cloud (1-3 months)',
    description: 'Buy an eligible ASUS laptop and get a complimentary Adobe Creative Cloud Pro subscription — up to a $1,071.80 value. Offer valid through Aug 31, 2026.',
    type: 'bundle',
    evergreen: false,
    expires: '2026-08-31',
  },
  {
    id: 'student-military-discount',
    title: 'Student, Teacher & Military Discount',
    description: 'Verify with ID.me at checkout to see if you qualify for an educational or military discount on this purchase.',
    type: 'discount_program',
    evergreen: true,
  },
];

/**
 * Returns the subset of OFFERS applicable to a cart's current contents:
 *  - Excludes any non-evergreen offer whose `expires` date has passed
 *    (compared to "now").
 *  - Returns an empty array unless the cart actually contains at least one
 *    laptop line item (i.e. a line item that isn't a warranty plan and
 *    isn't flagged `is_accessory`) — these are laptop-purchase offers, so
 *    an empty cart or an accessory-only cart shouldn't surface them.
 *
 * @param {Array} cartItems cart.items from lib/cart.js's getCart()/computeTotals()
 * @returns {Array} filtered OFFERS
 */
function getApplicableOffers(cartItems) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  const hasLaptop = items.some((i) => i.item_type !== 'warranty' && !i.is_accessory);
  if (!hasLaptop) return [];

  const now = new Date();
  return OFFERS.filter((offer) => {
    if (offer.evergreen === false && offer.expires) {
      return new Date(offer.expires) >= now;
    }
    return true;
  });
}

module.exports = { OFFERS, getApplicableOffers };
