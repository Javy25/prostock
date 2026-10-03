import { CRITICAL_STOCK_THRESHOLD, getCriticalProducts, getProductReport } from '../src/data/productReports.js'

describe('reportes de productos', () => {
  it('considera crítico el stock igual o inferior al umbral definido', () => {
    const products = [
      { id: 1, stock: CRITICAL_STOCK_THRESHOLD },
      { id: 2, stock: CRITICAL_STOCK_THRESHOLD + 1 },
    ]

    expect(getCriticalProducts(products)).toEqual([products[0]])
  })

  it('devuelve una lista vacía cuando ningún producto está bajo el umbral', () => {
    expect(getCriticalProducts([
      { id: 1, stock: CRITICAL_STOCK_THRESHOLD + 1 },
      { id: 2, stock: 40 },
    ])).toEqual([])
  })

  it('calcula cantidades y stock por categoría a partir de los productos', () => {
    const report = getProductReport([
      { id: 1, categoria: 'Escolar', stock: 4 },
      { id: 2, categoria: 'Escolar', stock: 6 },
      { id: 3, categoria: 'Oficina', stock: 12 },
    ])

    expect(report.productCount).toBe(3)
    expect(report.availableStock).toBe(22)
    expect(report.criticalProducts.map(product => product.id)).toEqual([1, 2])
    expect(report.categories).toEqual([
      { name: 'Escolar', products: 2, stock: 10 },
      { name: 'Oficina', products: 1, stock: 12 },
    ])
  })

  it('calcula unidades e total vendido solo desde líneas de pedidos', () => {
    const report = getProductReport(
      [{ id: 1, nombre: 'Cuaderno', categoria: 'Escolar', stock: 5 }],
      [{ items: [
        { productoId: 1, nombre: 'Cuaderno', cantidad: 2, precioConIva: 1190, totalLinea: 2380 },
        { productoId: 1, nombre: 'Cuaderno', cantidad: 1, precioConIva: 1190, totalLinea: 1190 },
      ] }],
    )

    expect(report.salesByProduct).toEqual([
      { key: '1', name: 'Cuaderno', units: 3, total: 3570 },
    ])
  })

  it('no inventa ventas cuando no hay líneas de pedidos', () => {
    expect(getProductReport([{ id: 1, stock: 3 }]).salesByProduct).toEqual([])
  })

  it('devuelve métricas vacías cuando no hay productos ni pedidos', () => {
    expect(getProductReport([], [])).toEqual({
      productCount: 0,
      availableStock: 0,
      criticalProducts: [],
      categories: [],
      salesByProduct: [],
    })
  })
})
