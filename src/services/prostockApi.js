import { apiRequest } from '../api.js'

const collection = value => {
  if (Array.isArray(value)) return value
  return value?.content
    || value?.items
    || value?.data
    || value?.resultados
    || value?.productos
    || value?.clientes
    || value?.boletas
    || value?.blogs
    || []
}

export function normalizeProduct(product) {
  product = product.producto || product
  const imagesValue = product.imagenes || product.images
  const category = product.categoria
    ?? product.category
    ?? product.tipoCategoria?.nombre
    ?? product.tipoCategoria?.nombreCategoria
    ?? product.tipoCategoria?.descripcion
    ?? product.tipoCategoria?.tipo
    ?? ''
  const image = product.imagen ?? product.imageUrl ?? product.linkImagen ?? ''
  const images = Array.isArray(imagesValue)
    ? imagesValue
    : (imagesValue || image
    ? [image || imagesValue]
    : [])
  return {
    ...product,
    id: product.id ?? product.productoId,
    codigo: product.codigo ?? product.code ?? product.sku ?? String(product.id ?? product.productoId ?? ''),
    nombre: product.nombre ?? product.name ?? product.titulo ?? product.nombreModelo ?? '',
    descripcion: product.descripcion ?? product.description ?? '',
    categoria: typeof category === 'string'
      ? category
      : category.nombre ?? category.nombreCategoria ?? category.descripcion ?? '',
    precio: Number(product.precio ?? product.precioNeto ?? product.price ?? 0),
    stock: Number(product.stock ?? product.cantidadDisponible ?? 0),
    imagen: image || images[0] || '',
    imagenes: images,
  }
}

export function normalizeCustomer(customer) {
  const { password: _password, contrasena: _contrasena, ...profile } = customer
  return {
    ...profile,
    id: customer.id ?? customer.clienteId,
    nombre: customer.nombre ?? customer.name ?? '',
    email: customer.email ?? '',
    rol: customer.rol ?? customer.role ?? 'CLIENTE',
    direccion: customer.direccion ?? customer.address ?? '',
    comuna: customer.comuna ?? customer.commune ?? '',
    region: customer.region ?? '',
  }
}

export function normalizeReceipt(receipt) {
  receipt = receipt.boleta || receipt
  const items = receipt.items || receipt.detalles || receipt.productos || []
  return {
    ...receipt,
    id: receipt.id ?? receipt.boletaId,
    usuarioId: receipt.usuarioId ?? receipt.clienteId,
    fecha: receipt.fecha ?? receipt.createdAt ?? receipt.fechaEmision ?? '',
    estado: receipt.estado ?? receipt.status ?? 'Emitida',
    items: items.map(item => ({
      ...item,
      productoId: item.productoId ?? item.product?.id,
      nombre: item.nombre ?? item.productoNombre ?? item.product?.nombre ?? '',
      cantidad: Number(item.cantidad ?? 0),
      precio: Number(item.precio ?? item.precioUnitario ?? item.product?.precio ?? 0),
      totalLinea: item.totalLinea === undefined && item.subtotal === undefined
        ? undefined
        : Number(item.totalLinea ?? item.subtotal),
    })),
    total: Number(receipt.total ?? receipt.totalPagar ?? receipt.montoTotal ?? 0),
  }
}

export function normalizeBlogPost(post) {
  post = post.blog || post.publicacion || post
  return {
    ...post,
    id: post.id ?? post.blogId,
    slug: post.slug ?? String(post.id ?? post.blogId),
    title: post.title ?? post.titulo ?? '',
    category: post.category ?? post.categoria ?? '',
    date: post.date ?? post.fecha ?? post.createdAt ?? '',
    image: post.image ?? post.imagen ?? post.imageUrl ?? '',
    summary: post.summary ?? post.resumen ?? '',
    content: post.content ?? post.contenido ?? post.body ?? '',
    sections: post.sections ?? post.secciones,
  }
}

export function listProducts(request = apiRequest, category = '') {
  const path = category
    ? `/api/productos/categoria/${encodeURIComponent(category)}`
    : '/api/productos'
  return request(path).then(value => collection(value).map(normalizeProduct))
}

export async function getProduct(productId, request = apiRequest) {
  const product = await request(`/api/productos/${productId}`)
  return product ? normalizeProduct(product) : null
}

export function saveProduct(product, productId, request = apiRequest) {
  return request(productId ? `/api/productos/${productId}` : '/api/productos', {
    method: productId ? 'PUT' : 'POST',
    body: JSON.stringify(product),
  }).then(normalizeProduct)
}

export function deleteProduct(productId, request = apiRequest) {
  return request(`/api/productos/${productId}`, { method: 'DELETE' })
}

export function listCustomers(request = apiRequest) {
  return request('/api/clientes').then(value => collection(value).map(normalizeCustomer))
}

export async function getCustomer(customerId, request = apiRequest) {
  const response = await request(`/api/clientes/${customerId}`)
  const customer = response?.cliente || response
  return customer ? normalizeCustomer(customer) : null
}

export function saveCustomer(customer, customerId, request = apiRequest) {
  const { password, contrasena, ...profile } = customer
  const payload = {
    ...profile,
    ...(password || contrasena ? { contrasena: contrasena || password } : {}),
  }
  return request(customerId ? `/api/clientes/${customerId}` : '/api/clientes', {
    method: customerId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeCustomer)
}

export function deleteCustomer(customerId, request = apiRequest) {
  return request(`/api/clientes/${customerId}`, { method: 'DELETE' })
}

export async function loginCustomer(email, contrasena, request = apiRequest) {
  const response = await request('/api/clientes/login', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  })
  return normalizeCustomer(response.cliente || response)
}

export async function getCart(customerId, request = apiRequest) {
  const value = await request(customerId ? `/api/clientes/${customerId}/carrito` : '/api/carrito')
  const cart = value?.carrito || value
  const rawItems = collection(cart)
  const hasIncompleteProduct = rawItems.some(item => {
    const product = item.producto || item.product || item
    return !(product.nombre || product.name) || product.precio === undefined && product.price === undefined
  })
  const products = hasIncompleteProduct ? await listProducts(request) : []
  return rawItems.map(item => {
    const rawProduct = item.producto || item.product || item
    const id = item.productoId ?? item.productId ?? rawProduct.id ?? item.id
    const product = products.find(entry => String(entry.id) === String(id)) || rawProduct
    return {
      ...normalizeProduct({ ...product, ...rawProduct, id }),
      cantidad: Number(item.cantidad ?? item.quantity ?? 1),
    }
  })
}

export function addCartItem(customerId, productId, cantidad, request = apiRequest) {
  const path = customerId
    ? `/api/clientes/${customerId}/carrito/items`
    : '/api/carrito/items'
  return request(path, {
    method: 'POST',
    body: JSON.stringify({ productoId: productId, cantidad }),
  })
}

export function updateCartItem(customerId, productId, cantidad, request = apiRequest) {
  const path = customerId
    ? `/api/clientes/${customerId}/carrito/items/${productId}`
    : `/api/carrito/items/${productId}`
  return request(path, {
    method: 'PUT',
    body: JSON.stringify({ productoId: productId, cantidad }),
  })
}

export function removeCartItem(customerId, productId, request = apiRequest) {
  const path = customerId
    ? `/api/clientes/${customerId}/carrito/items/${productId}`
    : `/api/carrito/items/${productId}`
  return request(path, { method: 'DELETE' })
}

export function clearCart(customerId, request = apiRequest) {
  return request(customerId ? `/api/clientes/${customerId}/carrito` : '/api/carrito', {
    method: 'DELETE',
  })
}

export function createReceipt(customerId, payload, request = apiRequest) {
  return request(`/api/clientes/${customerId}/boletas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeReceipt)
}

export function listReceipts(customerId, request = apiRequest) {
  return request(`/api/clientes/${customerId}/boletas`)
    .then(value => collection(value).map(normalizeReceipt))
}

export async function getReceipt(customerId, receiptId, request = apiRequest) {
  const response = await request(`/api/clientes/${customerId}/boletas/${receiptId}`)
  const receipt = response?.boleta || response
  return receipt ? normalizeReceipt(receipt) : null
}

export function listBlogPosts(request = apiRequest) {
  return request('/api/blogs').then(value => collection(value).map(normalizeBlogPost))
}

export async function getBlogPost(postId, request = apiRequest) {
  const post = await request(`/api/blogs/${postId}`)
  return post ? normalizeBlogPost(post) : null
}

export function saveBlogPost(post, postId, request = apiRequest) {
  const payload = {
    titulo: post.title,
    categoria: post.category,
    imagen: post.image,
    resumen: post.summary,
    contenido: post.content,
  }
  return request(postId ? `/api/blogs/${postId}` : '/api/blogs', {
    method: postId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeBlogPost)
}

export function deleteBlogPost(postId, request = apiRequest) {
  return request(`/api/blogs/${postId}`, { method: 'DELETE' })
}
