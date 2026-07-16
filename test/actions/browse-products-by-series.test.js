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
        expect(products.length).toBe(2)
        expect(products.every((p) => p.category === 'Zenbook A')).toBe(true)
    })

    test('unknown series returns no results', async () => {
        const out = await handler({ category: 'Zenbook X' })
        expect(out.content[0].text).toMatch(/no zenbook models|no .* found/i)
        expect(out.structuredContent.products).toEqual([])
    })
})
