const handler = require('../../actions/browse-products-by-series/index.js')

describe('browse_products_by_series handler', () => {
    test('returns content block shape on happy path', async () => {
        const out = await handler({ category: 'Zenbook S' })
        expect(out).toHaveProperty('content')
        expect(Array.isArray(out.content)).toBe(true)
        expect(out.content[0]).toMatchObject({ type: 'text', text: expect.any(String) })
    })

    test('"Show me the Zenbook S series laptops" returns matching models', async () => {
        const out = await handler({ category: 'Zenbook S' })
        expect(out.content[0].text.length).toBeGreaterThan(0)
        expect(out.structuredContent.products.length).toBeGreaterThan(0)
        expect(out.structuredContent.products.every((p) => p.category === 'Zenbook S')).toBe(true)
    })

    test('structuredContent is a plain object, not a bare array', async () => {
        const out = await handler({ category: 'Zenbook S' })
        expect(typeof out.structuredContent).toBe('object')
        expect(Array.isArray(out.structuredContent)).toBe(false)
        expect(Array.isArray(out.structuredContent.products)).toBe(true)
    })

    test('returns error message when required arg is missing', async () => {
        const out = await handler({})
        expect(Array.isArray(out.content)).toBe(true)
        expect(out.content[0].text).toMatch(/category|provide/i)
        expect(out.structuredContent.products).toEqual([])
    })

    test('filters by category — only the requested series is returned', async () => {
        const out = await handler({ category: 'Zenbook A' })
        const products = out.structuredContent.products
        expect(products.length).toBe(1)
        expect(products.every((p) => p.category === 'Zenbook A')).toBe(true)
    })

    test('unknown series returns no results', async () => {
        const out = await handler({ category: 'Zenbook X' })
        expect(out.content[0].text).toMatch(/no .* found/i)
        expect(out.structuredContent.products).toEqual([])
    })

    test('accepts a brand_line shorthand like "rog"', async () => {
        const out = await handler({ category: 'rog' })
        const products = out.structuredContent.products
        // 4 ROG models: Zephyrus G14, Strix SCAR 18, Strix G16, Flow Z13
        expect(products.length).toBe(4)
        expect(products.every((p) => p.brand_line === 'rog')).toBe(true)
    })

    test('accepts a use_case shorthand like "gaming"', async () => {
        const out = await handler({ category: 'gaming' })
        const products = out.structuredContent.products
        // 7 gaming laptops across ROG/TUF
        expect(products.length).toBe(7)
        expect(products.every((p) => (p.use_cases || []).includes('gaming'))).toBe(true)
    })
})
