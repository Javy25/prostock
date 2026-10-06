import { withTax } from '../utils/storeFormatters.js'

export const CRITICAL_STOCK_THRESHOLD = 10

export function getCriticalProducts(products, threshold = CRITICAL_STOCK_THRESHOLD) {
  return products.filter(product => Number(product.stock) <= threshold)
}

export function getProductReport(products, orders = []) {
  const categories = new Map()
  const salesByProduct = new Map()
  let availableStock = 0

  products.forEach(product => {
    const category = product.categoria || 'Sin categoría'
    const categoryReport = categories.get(category) || { name: category, products: 0, stock: 0 }
    categoryReport.products += 1
    categoryReport.stock += Number(product.stock) || 0
    categories.set(category, categoryReport)
    availableStock += Number(product.stock) || 0
  })

  for (const order of orders) {
    for (const item of order.items || []) {
      const key = String(item.productoId ?? item.id ?? item.codigo ?? item.nombre)
      const sold = salesByProduct.get(key) || {
        key,
        name: item.nombre || 'Producto sin nombre',
        units: 0,
        total: 0,
      }
      const quantity = Number(item.cantidad) || 0
      const unitPrice = Number(item.precioConIva ?? withTax(item.precio))
      sold.units += quantity
      sold.total += Number(item.totalLinea ?? unitPrice * quantity)
      salesByProduct.set(key, sold)
    }
  }

  return {
    productCount: products.length,
    availableStock,
    criticalProducts: getCriticalProducts(products),
    categories: [...categories.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    salesByProduct: [...salesByProduct.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  }
}
