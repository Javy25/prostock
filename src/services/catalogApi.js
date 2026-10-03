import { apiRequest } from '../api.js'

export function listCatalogProducts(request = apiRequest) {
  return request('/api/products')
}

export function saveCatalogProduct(product, productId, request = apiRequest) {
  return request(productId ? `/api/products/${productId}` : '/api/products', {
    method: productId ? 'PUT' : 'POST',
    body: JSON.stringify(product),
  })
}

export function removeCatalogProduct(productId, request = apiRequest) {
  return request(`/api/products/${productId}`, { method: 'DELETE' })
}
