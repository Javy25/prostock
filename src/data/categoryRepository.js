import productsSeed from '../../data/productos.json'

export function readCategories(products = productsSeed) {
  return [...new Set(products.map(product => product.categoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'))
}

export function addCategory(categories, category) {
  const normalized = String(category || '').trim()
  if (!normalized || categories.some(item => item.toLocaleLowerCase('es') === normalized.toLocaleLowerCase('es'))) {
    return categories
  }
  return [...categories, normalized].sort((a, b) => a.localeCompare(b, 'es'))
}

export function getAvailableCategories(categories, products) {
  return [...new Set([...categories, ...products.map(product => product.categoria).filter(Boolean)])]
    .sort((a, b) => a.localeCompare(b, 'es'))
}
