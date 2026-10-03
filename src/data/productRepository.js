import productsSeed from '../../data/productos.json'

export function readProducts(products = productsSeed) {
  return [...products]
}

export function createProduct(products, product) {
  return [...products, product]
}

export function updateProduct(products, productId, updatedProduct) {
  return products.map(product => product.id === productId ? updatedProduct : product)
}

export function deleteProduct(products, productId) {
  return products.filter(product => product.id !== productId)
}
