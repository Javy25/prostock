import { getAvailableCategories } from './categoryRepository.js'
import { getProductReport } from './productReports.js'

export function getGeneralReport({ products, users, orders, messages, categories }) {
  const productReport = getProductReport(products, orders)
  const ordersByStatus = new Map()

  orders.forEach(order => {
    const status = order.estado || 'Sin estado'
    ordersByStatus.set(status, (ordersByStatus.get(status) || 0) + 1)
  })

  return {
    productCount: products.length,
    userCount: users.length,
    orderCount: orders.length,
    salesTotal: orders.reduce((total, order) => total + (Number(order.total) || 0), 0),
    criticalProductCount: productReport.criticalProducts.length,
    categoryCount: getAvailableCategories(categories, products).length,
    messageCount: messages.length,
    ordersByStatus: [...ordersByStatus.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status.localeCompare(b.status, 'es')),
    productsByCategory: productReport.categories,
  }
}
