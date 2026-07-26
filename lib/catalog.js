// Shared ASUS product catalog used by search-products, get-product-details,
// browse-products-by-series, compare-products and manage-cart.
//
// REFRESHED July 2026: every laptop below is a real, currently-sold ASUS
// model, sourced directly from asus.com / eshop.asus.com product pages
// (name, price, CPU/GPU/RAM/storage/screen/weight, and a real hero image
// hosted on ASUS's own CDN). Ratings/review counts are still synthetic —
// ASUS doesn't publish aggregate review data on these pages — everything
// else is real as of the last refresh. `product_url` links straight to the
// live ASUS page for that model.
//
// TODO: Replace this hand-refreshed dataset with a real API/PIM call once
// available. Suggested endpoint pattern:
//   GET ${process.env.API_BASE_URL}/products
// Environment variables to configure in .env and app.config.yaml `inputs`:
//   API_BASE_URL, API_KEY
// Until then, re-run the research pass periodically (prices/specs/images
// above) to keep this from going stale — ASUS refreshes these lines often.

// Order matters — used to compare "at least this tier" GPU filters.
const GPU_TIERS = ['integrated', 'entry', 'mid', 'high', 'enthusiast'];

const CATALOG = [
  // ---- ROG (Republic of Gamers — high-performance gaming) ----
  {
    id: 'rog-zephyrus-g14-2025',
    name: 'ROG Zephyrus G14 (2025)',
    brand_line: 'rog',
    series: 'ROG Zephyrus',
    category: 'ROG Zephyrus',
    description: 'The lightest ROG laptop ASUS has ever built — an ultra-slim 14" gaming laptop with an RTX 5080 and AI accelerators built into both CPU and GPU.',
    highlights: ['14" 3K OLED, 120Hz, ROG Nebula HDR Display', 'NVIDIA GeForce RTX 5080 Laptop GPU', 'Only 1.5kg — the lightest ROG ever made'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/BA146EC2-FF9D-4A8E-A91A-C9F864DE6BBB',
    product_url: 'https://rog.asus.com/us/laptops/rog-zephyrus/rog-zephyrus-g14-2025/',
    price_usd: 2499,
    cpu: 'AMD Ryzen AI 9 HX 370',
    gpu: 'NVIDIA GeForce RTX 5080',
    gpu_tier: 'high',
    ram_gb: 32,
    storage_gb: 2048,
    screen_size_in: 14,
    battery_hours: 10,
    weight_kg: 1.5,
    rating: 4.8,
    review_count: 64,
    in_stock: true,
    use_cases: ['gaming', 'creator'],
  },
  {
    id: 'rog-strix-scar18-2026',
    name: 'ROG Strix SCAR 18 (2026)',
    brand_line: 'rog',
    series: 'ROG Strix',
    category: 'ROG Strix',
    description: 'ASUS\'s flagship 18" desktop-replacement — the world\'s first 4K 240Hz Mini LED laptop panel, paired with the fastest mobile GPU ASUS offers and a customizable AniMe Vision lid.',
    highlights: ['18" 4K (3840x2400) Mini LED, 240Hz, Pantone Validated', 'NVIDIA GeForce RTX 5080 Laptop GPU, 16GB GDDR7', 'Customizable AniMe Vision lid display'],
    image_url: 'https://eshop.asus.com/media/catalog/product/0/e/0e90fa4926512081ca977f17d0589c9a.png',
    product_url: 'https://eshop.asus.com/us/rog/rog-strix-scar-18-2026-gaming-laptop.html',
    price_usd: 4299,
    cpu: 'Intel Core Ultra 9 290HX+',
    gpu: 'NVIDIA GeForce RTX 5080 (16GB)',
    gpu_tier: 'enthusiast',
    ram_gb: 32,
    storage_gb: 1024,
    screen_size_in: 18,
    battery_hours: 7,
    weight_kg: 3.7,
    rating: 4.9,
    review_count: 22,
    in_stock: true,
    use_cases: ['gaming'],
  },
  {
    id: 'rog-strix-g16-2025',
    name: 'ROG Strix G16 (2025)',
    brand_line: 'rog',
    series: 'ROG Strix',
    category: 'ROG Strix',
    description: 'ASUS\'s "true next-gen gaming laptop" at a more approachable price — 16" of fast-refresh gaming with NVIDIA Advanced Optimus and RTX 50-series graphics.',
    highlights: ['16" up to 2.5K WQXGA, 240Hz', 'NVIDIA GeForce RTX 5070 Laptop GPU', 'NVIDIA Advanced Optimus'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/CB995004-F8A4-4EFC-915A-DE8C414E6F9D',
    product_url: 'https://rog.asus.com/us/laptops/rog-strix/rog-strix-g16-2025/',
    price_usd: 1399,
    cpu: 'Intel Core Ultra 9 275HX',
    gpu: 'NVIDIA GeForce RTX 5070',
    gpu_tier: 'mid',
    ram_gb: 16,
    storage_gb: 1024,
    screen_size_in: 16,
    battery_hours: 8,
    weight_kg: 2.4,
    rating: 4.5,
    review_count: 118,
    in_stock: true,
    use_cases: ['gaming'],
  },

  // ---- TUF Gaming (durable, value gaming) ----
  {
    id: 'tuf-gaming-a16-2025',
    name: 'TUF Gaming A16 (2025)',
    brand_line: 'tuf',
    series: 'TUF Gaming',
    category: 'TUF Gaming',
    description: '"Robust Performance, Elevated Victory" — a MIL-STD-810H durable gaming laptop with 0dB Ambient Cooling and dependable RTX 50-series graphics at a value price.',
    highlights: ['16" FHD+ 165Hz, G-Sync', 'NVIDIA GeForce RTX 5060 Laptop GPU', 'MIL-STD-810H military-grade durability'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/c0b28d76-4515-4965-9982-18898fdd5208/w800',
    product_url: 'https://www.asus.com/us/laptops/for-gaming/tuf-gaming/asus-tuf-gaming-a16-2025/',
    price_usd: 1399,
    cpu: 'AMD Ryzen 9 8940HX',
    gpu: 'NVIDIA GeForce RTX 5060',
    gpu_tier: 'entry',
    ram_gb: 16,
    storage_gb: 1024,
    screen_size_in: 16,
    battery_hours: 9,
    weight_kg: 2.2,
    rating: 4.4,
    review_count: 206,
    in_stock: true,
    use_cases: ['gaming', 'budget'],
  },
  {
    id: 'tuf-gaming-a14-2024',
    name: 'TUF Gaming A14 (2024)',
    brand_line: 'tuf',
    series: 'TUF Gaming',
    category: 'TUF Gaming',
    description: 'The smallest TUF Gaming laptop ASUS has built — "Portable Power, Maximum Impact" in a sub-1.5kg MIL-STD-810H chassis.',
    highlights: ['14" 2.5K (2560x1600) 165Hz IPS, 100% sRGB', 'NVIDIA GeForce RTX 4060 Laptop GPU', 'Only 1.46kg — smallest TUF Gaming ever built'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/8ef79421-e9c6-4c8b-8529-0e0dc2a09952/w800',
    product_url: 'https://www.asus.com/us/laptops/for-gaming/tuf-gaming/asus-tuf-gaming-a14-2024/',
    price_usd: 1299,
    cpu: 'AMD Ryzen AI 9 HX 370',
    gpu: 'NVIDIA GeForce RTX 4060',
    gpu_tier: 'entry',
    ram_gb: 32,
    storage_gb: 1024,
    screen_size_in: 14,
    battery_hours: 10,
    weight_kg: 1.46,
    rating: 4.5,
    review_count: 71,
    in_stock: true,
    use_cases: ['gaming', 'travel', 'budget'],
  },

  // ---- Zenbook (premium ultraportable / productivity — "quiet luxury") ----
  {
    id: 'zenbook-s16-um5606',
    name: 'ASUS Zenbook S16 (UM5606)',
    brand_line: 'zenbook',
    series: 'Zenbook S',
    category: 'Zenbook S',
    description: '"A statement of craftsmanship defined by its meticulous detailing" — the Zenbook S line\'s flagship, in a Ceraluminum chassis with Harman/Kardon-tuned audio.',
    highlights: ['16" 3K OLED, 120Hz, touch', 'Six Super Linear Speakers, tuned by Harman/Kardon', 'Ceraluminum chassis, 1.50kg'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/f34d32c6-c387-4d9f-a3ae-b7e22bcd8720/',
    product_url: 'https://www.asus.com/us/laptops/for-home/zenbook/asus-zenbook-s-16-um5606/',
    price_usd: 1199,
    cpu: 'AMD Ryzen AI 7 350',
    gpu: 'AMD Radeon Graphics (integrated)',
    gpu_tier: 'integrated',
    ram_gb: 24,
    storage_gb: 1024,
    screen_size_in: 16,
    battery_hours: 18,
    weight_kg: 1.5,
    rating: 4.6,
    review_count: 133,
    in_stock: true,
    use_cases: ['productivity', 'creator', 'business'],
  },
  {
    id: 'zenbook-duo-ux8407-2026',
    name: 'ASUS Zenbook DUO (UX8407)',
    brand_line: 'zenbook',
    series: 'Zenbook Duo',
    category: 'Zenbook Duo',
    description: '"Let\'s DUO it" — the dual 14" 3K OLED screen laptop with the fastest graphics, longest battery, and next-gen AI in the Zenbook DUO line, letting you carry your complete workspace anywhere.',
    highlights: ['Dual 14" 3K OLED displays, 120Hz', 'Detachable backlit keyboard', 'Intel Core Ultra X9 388H + Intel Arc B390 graphics'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/9fe03e85-4f8e-416e-bdea-2eb8879361aa/',
    product_url: 'https://www.asus.com/us/laptops/for-home/zenbook/asus-zenbook-duo-ux8407/',
    price_usd: 2299,
    cpu: 'Intel Core Ultra X9 388H',
    gpu: 'Intel Arc B390',
    gpu_tier: 'mid',
    ram_gb: 32,
    storage_gb: 1024,
    screen_size_in: 14,
    battery_hours: 18,
    weight_kg: 1.65,
    rating: 4.6,
    review_count: 129,
    in_stock: true,
    use_cases: ['productivity', 'creator', 'business'],
  },
  {
    id: 'zenbook-a14-ux3407-2025',
    name: 'ASUS Zenbook A14 (UX3407)',
    brand_line: 'zenbook',
    series: 'Zenbook A',
    category: 'Zenbook A',
    description: '"Unload. Unplugged. Unlimited." — ASUS\'s lightest Zenbook ever, in a full-body Ceraluminum chassis that\'s entirely life-resistant, with the longest battery life in the lineup.',
    highlights: ['Full-body Ceraluminum™ chassis, sub-1kg', '33+ hour rated battery life', 'Qualcomm Snapdragon X2 Elite (ARM, always-connected)'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/ac85e468-3f21-4773-a8e8-8c72034a5f19/',
    product_url: 'https://www.asus.com/us/laptops/for-home/zenbook/asus-zenbook-a-14-ux3407/',
    price_usd: 1099,
    cpu: 'Qualcomm Snapdragon X2 Elite',
    gpu: 'Qualcomm Adreno (integrated)',
    gpu_tier: 'integrated',
    ram_gb: 16,
    storage_gb: 512,
    screen_size_in: 14,
    battery_hours: 33,
    weight_kg: 0.99,
    rating: 4.7,
    review_count: 58,
    in_stock: true,
    use_cases: ['student', 'travel', 'productivity'],
  },

  // ---- ProArt (creator / studio) ----
  {
    id: 'proart-px13-hn7306',
    name: 'ASUS ProArt PX13 (HN7306)',
    brand_line: 'proart',
    series: 'ProArt PX',
    category: 'ProArt PX',
    description: '"Your ultimate portable studio" — a 360° convertible creator laptop with 64GB of unified memory for unstoppable on-the-go AI and content work.',
    highlights: ['64GB unified memory — "Unstoppable AI"', '13.3" 3K OLED touchscreen, 360° convertible', 'AMD Ryzen AI Max+ 395, 16 cores'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/e94a421e-3a3b-4350-beb0-3215e70aa17a/',
    product_url: 'https://www.asus.com/us/laptops/for-creators/proart/proart-px13-hn7306/',
    price_usd: 2799,
    cpu: 'AMD Ryzen AI Max+ 395',
    gpu: 'AMD Radeon Graphics (unified)',
    gpu_tier: 'integrated',
    ram_gb: 64,
    storage_gb: 1024,
    screen_size_in: 13.3,
    battery_hours: 10,
    weight_kg: 1.39,
    rating: 4.7,
    review_count: 41,
    in_stock: true,
    use_cases: ['creator', 'professional'],
  },
  {
    id: 'proart-pz14-ht7407',
    name: 'ASUS ProArt PZ14 (HT7407)',
    brand_line: 'proart',
    series: 'ProArt PZ',
    category: 'ProArt PZ',
    description: '"Performance That Keeps You Creating" — a remarkably light detachable-tablet creator laptop with a brilliant 3K OLED display and ultra-smooth 144Hz motion.',
    highlights: ['14" 3K OLED touchscreen, 144Hz', 'Detachable tablet design, 0.79kg', 'Snapdragon X2 Elite (always-connected)'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/3724e2c3-d1c7-45a9-9d87-43d2db53b2dc/',
    product_url: 'https://www.asus.com/us/laptops/for-creators/proart/proart-pz14-ht7407/',
    price_usd: 2499,
    cpu: 'Qualcomm Snapdragon X2 Elite',
    gpu: 'Qualcomm Adreno (integrated)',
    gpu_tier: 'integrated',
    ram_gb: 32,
    storage_gb: 1024,
    screen_size_in: 14,
    battery_hours: 14,
    weight_kg: 0.79,
    rating: 4.6,
    review_count: 19,
    in_stock: true,
    use_cases: ['creator', 'professional', 'travel'],
  },

  // ---- Vivobook (mainstream / everyday laptops) ----
  {
    id: 'vivobook-s14-m5406',
    name: 'ASUS Vivobook S14 (M5406)',
    brand_line: 'vivobook',
    series: 'Vivobook S',
    category: 'Vivobook S',
    description: '"Everyday, elevated" — a Copilot+ PC with a sleek minimalist design and a bright OLED display for school and work.',
    highlights: ['14" 3K OLED, 120Hz', 'Copilot+ PC AI features', 'AMD Ryzen AI 9 HX 370'],
    image_url: 'https://dlcdnwebimgs.asus.com/gain/496ec5ea-48e1-4c76-bbff-9f5de8368036/',
    product_url: 'https://www.asus.com/us/laptops/for-home/vivobook/',
    price_usd: 1199,
    cpu: 'AMD Ryzen AI 9 HX 370',
    gpu: 'AMD Radeon Graphics (integrated)',
    gpu_tier: 'integrated',
    ram_gb: 16,
    storage_gb: 512,
    screen_size_in: 14,
    battery_hours: 12,
    weight_kg: 1.4,
    rating: 4.4,
    review_count: 87,
    in_stock: true,
    use_cases: ['student', 'productivity', 'business'],
  },
];

// Cross-sell / upsell accessories — separate from the laptop CATALOG so
// search-products/browse-products-by-series (which only ever browse
// laptops) don't accidentally surface a mouse or a monitor. Used by
// get-recommendations and addable to the cart like any laptop.
const ACCESSORIES = [
  {
    id: 'rog-gladius-iii-mouse',
    name: 'ROG Gladius III Wireless Mouse',
    brand_line: 'rog',
    series: 'ROG Accessories',
    category: 'Gaming Mouse',
    description: 'Lightweight wireless gaming mouse with swappable switches and Aura Sync RGB.',
    highlights: ['79g ultralight design', 'Hot-swappable switches', '2.4GHz wireless + Bluetooth'],
    image_url: null,
    price_usd: 99,
    rating: 4.7,
    review_count: 340,
    in_stock: true,
    use_cases: ['gaming'],
    compatible_brand_lines: ['rog', 'tuf'],
    is_accessory: true,
  },
  {
    id: 'asus-dual-usb-c-dock',
    name: 'ASUS Dual USB-C Docking Station',
    brand_line: 'zenbook',
    series: 'ASUS Accessories',
    category: 'Docking Station',
    description: 'One-cable 4K dual-monitor dock with 100W power delivery — ideal for ultraportables.',
    highlights: ['Dual 4K@60Hz output', '100W USB-C power delivery', 'Single-cable desk setup'],
    image_url: null,
    price_usd: 149,
    rating: 4.5,
    review_count: 212,
    in_stock: true,
    use_cases: ['productivity', 'business', 'creator'],
    compatible_brand_lines: ['zenbook', 'vivobook', 'proart'],
    is_accessory: true,
  },
  {
    id: 'asus-neoprene-sleeve-14',
    name: 'ASUS Neoprene Sleeve 14"',
    brand_line: 'zenbook',
    series: 'ASUS Accessories',
    category: 'Sleeve',
    description: 'Slim protective sleeve for 14-inch laptops, water-resistant neoprene.',
    highlights: ['Water-resistant exterior', 'Soft interior lining', 'Fits most 14" laptops'],
    image_url: null,
    price_usd: 29,
    rating: 4.4,
    review_count: 501,
    in_stock: true,
    use_cases: ['travel', 'student', 'productivity'],
    compatible_brand_lines: ['zenbook', 'vivobook'],
    is_accessory: true,
  },
  {
    id: 'rog-strix-xg27-monitor',
    name: 'ROG Strix XG27AQ 27" Gaming Monitor',
    brand_line: 'rog',
    series: 'ROG Accessories',
    category: 'Monitor',
    description: '27" QHD 170Hz IPS gaming monitor with G-SYNC compatibility.',
    highlights: ['170Hz QHD IPS panel', 'G-SYNC Compatible', 'HDR400'],
    image_url: null,
    price_usd: 399,
    rating: 4.8,
    review_count: 150,
    in_stock: true,
    use_cases: ['gaming'],
    compatible_brand_lines: ['rog', 'tuf'],
    is_accessory: true,
  },
  {
    id: 'proart-pa279-monitor',
    name: 'ProArt Display PA279CRV 27" 4K Monitor',
    brand_line: 'proart',
    series: 'ProArt Accessories',
    category: 'Monitor',
    description: 'Factory-calibrated 4K HDR monitor for color-critical creative work.',
    highlights: ['Factory color calibration', '4K UHD, 98% DCI-P3', 'Built-in colorimeter support'],
    image_url: null,
    price_usd: 599,
    rating: 4.8,
    review_count: 87,
    in_stock: true,
    use_cases: ['creator', 'professional'],
    compatible_brand_lines: ['proart', 'zenbook'],
    is_accessory: true,
  },
  {
    id: 'asus-portable-ssd-1tb',
    name: 'ASUS 1TB Portable SSD',
    brand_line: 'vivobook',
    series: 'ASUS Accessories',
    category: 'Storage',
    description: 'Pocket-sized 1TB USB-C SSD with up to 1050MB/s transfer speeds.',
    highlights: ['1050MB/s transfer speeds', 'Pocket-sized aluminum body', 'USB-C, backward compatible'],
    image_url: null,
    price_usd: 89,
    rating: 4.6,
    review_count: 275,
    in_stock: true,
    use_cases: ['creator', 'student', 'productivity', 'gaming'],
    compatible_brand_lines: ['zenbook', 'rog', 'tuf', 'vivobook', 'proart'],
    is_accessory: true,
  },
];

// Combined index used for lookups (get-product-details, manage-cart,
// compare-products, get-recommendations) so accessories are addressable
// the same way laptops are. Laptop-only browsing (search-products,
// browse-products-by-series) intentionally keeps using CATALOG alone.
const ALL_ITEMS = [...CATALOG, ...ACCESSORIES];

/**
 * Fallback color swatch per brand line, used by widgets when a product has
 * no image_url. Kept here (not just in the EDS repo) so the structuredContent
 * payload can optionally carry it for hosts that don't run the EDS widget.
 */
const BRAND_FALLBACK_COLOR = {
  zenbook: '#1F3A5C',
  rog: '#E2231A',
  tuf: '#F2A900',
  vivobook: '#7B2FF7',
  proart: '#C9A227',
};

/**
 * Returns a deep link to the real ASUS product page when we have one
 * (`product_url`, populated for every laptop in CATALOG from the July 2026
 * research pass); accessories and any future item without a confirmed real
 * URL fall back to an asus.com search link.
 */
function buyUrl(product) {
  if (product.product_url) return product.product_url;
  return `https://www.asus.com/search/?q=${encodeURIComponent(product.name)}`;
}

/** Trims a catalog record down to the fields widgets actually render. */
function toCard(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image_url: product.image_url,
    category: product.category,
    brand_line: product.brand_line,
    series: product.series,
    price_usd: product.price_usd,
    cpu: product.cpu,
    gpu: product.gpu,
    gpu_tier: product.gpu_tier,
    ram_gb: product.ram_gb,
    storage_gb: product.storage_gb,
    screen_size_in: product.screen_size_in,
    weight_kg: product.weight_kg,
    battery_hours: product.battery_hours,
    rating: product.rating,
    review_count: product.review_count,
    in_stock: product.in_stock,
    use_cases: product.use_cases,
    highlights: product.highlights,
    fallback_color: BRAND_FALLBACK_COLOR[product.brand_line] || '#1a1a1a',
    buy_url: buyUrl(product),
    is_accessory: !!product.is_accessory,
  };
}

/**
 * Resolves a single product OR accessory by id (exact) or name (exact,
 * then partial). Used by get-product-details, compare-products, the cart
 * actions, and get-recommendations.
 */
function resolveProduct({ product_id, product_name } = {}) {
  if (product_id) {
    const byId = ALL_ITEMS.find((p) => p.id === product_id);
    if (byId) return byId;
  }
  if (product_name && typeof product_name === 'string' && product_name.trim()) {
    const query = product_name.trim().toLowerCase();
    const exact = ALL_ITEMS.find((p) => p.name.toLowerCase() === query);
    if (exact) return exact;
    const partial = ALL_ITEMS.find((p) => p.name.toLowerCase().includes(query));
    if (partial) return partial;
  }
  return null;
}

module.exports = {
  CATALOG,
  ACCESSORIES,
  ALL_ITEMS,
  GPU_TIERS,
  BRAND_FALLBACK_COLOR,
  toCard,
  resolveProduct,
  buyUrl,
};
