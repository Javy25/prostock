import productsSeed from '../../data/productos.json'

export function readProducts(products = productsSeed) {
  return [...products]
}

export function applySeedOffers(products, seed = productsSeed) {
  const offersById = new Map(seed
    .filter(product => Number(product.precioOferta) > 0 && Number(product.precioOferta) < Number(product.precio))
    .map(product => [String(product.id), Number(product.precioOferta)]))
  let changed = false
  const updated = products.map(product => {
    const offerPrice = offersById.get(String(product.id))
    if (offerPrice === undefined || Number(product.precioOferta) === offerPrice) return product
    changed = true
    return { ...product, precioOferta: offerPrice }
  })
  return changed ? updated : products
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
