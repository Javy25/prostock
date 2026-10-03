import { getGeneralReport } from '../src/data/generalReports.js'

describe('reportes generales', () => {
  it('resume métricas desde productos, usuarios, pedidos, mensajes y categorías existentes', () => {
    const report = getGeneralReport({
      products: [
        { id: 1, categoria: 'Escolar', stock: 5 },
        { id: 2, categoria: 'Escolar', stock: 20 },
        { id: 3, categoria: 'Oficina', stock: 15 },
      ],
      users: [{ id: 1 }, { id: 2 }],
      orders: [
        { estado: 'Confirmado', total: 2380, items: [] },
        { estado: 'Confirmado', total: 1190, items: [] },
        { estado: 'Pendiente', total: 500, items: [] },
      ],
      messages: [{ id: 1 }],
      categories: ['Escolar', 'Oficina', 'Sin productos'],
    })

    expect(report).toEqual({
      productCount: 3,
      userCount: 2,
      orderCount: 3,
      salesTotal: 4070,
      criticalProductCount: 1,
      categoryCount: 3,
      messageCount: 1,
      ordersByStatus: [
        { status: 'Confirmado', count: 2 },
        { status: 'Pendiente', count: 1 },
      ],
      productsByCategory: [
        { name: 'Escolar', products: 2, stock: 25 },
        { name: 'Oficina', products: 1, stock: 15 },
      ],
    })
  })

  it('informa valores vacíos sin inventar métricas cuando no hay datos', () => {
    const report = getGeneralReport({ products: [], users: [], orders: [], messages: [], categories: [] })

    expect(report.productCount).toBe(0)
    expect(report.salesTotal).toBe(0)
    expect(report.ordersByStatus).toEqual([])
    expect(report.productsByCategory).toEqual([])
  })
})
