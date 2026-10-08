import {
  addCartItem,
  clearCart,
  createReceipt,
  deleteBlogPost,
  deleteCustomer,
  deleteProduct,
  getBlogPost,
  getCart,
  getCustomer,
  getProduct,
  getReceipt,
  listBlogPosts,
  listCustomers,
  listProducts,
  listReceipts,
  loginCustomer,
  removeCartItem,
  saveBlogPost,
  saveCustomer,
  saveProduct,
  updateCartItem,
} from '../src/services/prostockApi.js'

describe('API integrada de Prostock', () => {
  let request

  beforeEach(() => {
    request = jasmine.createSpy('apiRequest').and.resolveTo([])
  })

  it('lista productos y filtra por categoría con rutas codificadas', async () => {
    request.and.resolveTo([{ id: 1, nombre: 'Cuaderno', categoria: 'Útiles escolares' }])

    const all = await listProducts(request)
    const category = await listProducts(request, 'Útiles escolares')

    expect(all[0].nombre).toBe('Cuaderno')
    expect(category[0].categoria).toBe('Útiles escolares')
    expect(request.calls.argsFor(0)[0]).toBe('/api/productos')
    expect(request.calls.argsFor(1)[0]).toBe('/api/productos/categoria/%C3%9Atiles%20escolares')
  })

  it('adapta la entidad Java Producto al formato que representa la tienda', async () => {
    request.and.resolveTo([{
      id: 31,
      precio: 24990,
      nombreModelo: 'Sneaker modelo',
      descripcion: 'Descripción del producto',
      linkImagen: '/img/sneaker.jpg',
      tipoCategoria: { id: 4, nombreCategoria: 'Calzado' },
      stock: 8,
    }])

    const [product] = await listProducts(request)

    expect(product.id).toBe(31)
    expect(product.codigo).toBe('31')
    expect(product.nombre).toBe('Sneaker modelo')
    expect(product.descripcion).toBe('Descripción del producto')
    expect(product.categoria).toBe('Calzado')
    expect(product.precio).toBe(24990)
    expect(product.imagen).toBe('/img/sneaker.jpg')
    expect(product.imagenes).toEqual(['/img/sneaker.jpg'])
    expect(product.stock).toBe(8)
  })

  it('busca, crea, actualiza y elimina productos', async () => {
    await getProduct(7, request)
    await saveProduct({ nombre: 'Nuevo' }, null, request)
    await saveProduct({ nombre: 'Editado' }, 7, request)
    await deleteProduct(7, request)

    expect(request.calls.allArgs()).toEqual([
      ['/api/productos/7'],
      ['/api/productos', { method: 'POST', body: '{"nombre":"Nuevo"}' }],
      ['/api/productos/7', { method: 'PUT', body: '{"nombre":"Editado"}' }],
      ['/api/productos/7', { method: 'DELETE' }],
    ])
  })

  it('administra clientes y traduce password al campo contrasena', async () => {
    request.and.resolveTo([{ id: 9, nombre: 'Ana' }])
    const customers = await listCustomers(request)
    await getCustomer(9, request)
    await saveCustomer({ nombre: 'Ana', password: 'secreto' }, null, request)
    await saveCustomer({ nombre: 'Ana' }, 9, request)
    await deleteCustomer(9, request)

    expect(customers[0].rol).toBe('CLIENTE')
    expect(request.calls.argsFor(2)).toEqual([
      '/api/clientes',
      { method: 'POST', body: '{"nombre":"Ana","contrasena":"secreto"}' },
    ])
    expect(request.calls.argsFor(3)[0]).toBe('/api/clientes/9')
    expect(request.calls.argsFor(4)).toEqual(['/api/clientes/9', { method: 'DELETE' }])
  })

  it('autentica usando email y contrasena y conserva el cliente devuelto', async () => {
    request.and.resolveTo({
      cliente: { clienteId: 12, nombre: 'Ana', email: 'ana@example.com', contrasena: 'no-debe-guardarse' },
    })

    const customer = await loginCustomer('ana@example.com', 'secreto', request)

    expect(request).toHaveBeenCalledOnceWith('/api/clientes/login', {
      method: 'POST',
      body: '{"email":"ana@example.com","contrasena":"secreto"}',
    })
    expect(customer.id).toBe(12)
    expect(customer.nombre).toBe('Ana')
    expect(customer.contrasena).toBeUndefined()
  })

  it('usa carritos por cliente autenticado y por sesión de invitado', async () => {
    request.and.resolveTo({
      items: [{ productoId: 4, cantidad: 2, producto: { id: 4, nombre: 'Cuaderno', precio: 100 } }],
    })
    await getCart(null, request)
    await getCart(12, request)
    await addCartItem(null, 4, 2, request)
    await updateCartItem(12, 4, 3, request)
    await removeCartItem(null, 4, request)
    await clearCart(12, request)

    expect(request.calls.argsFor(0)[0]).toBe('/api/carrito')
    expect(request.calls.argsFor(1)[0]).toBe('/api/clientes/12/carrito')
    expect(request.calls.argsFor(2)).toEqual([
      '/api/carrito/items',
      { method: 'POST', body: '{"productoId":4,"cantidad":2}' },
    ])
    expect(request.calls.argsFor(3)).toEqual([
      '/api/clientes/12/carrito/items/4',
      { method: 'PUT', body: '{"productoId":4,"cantidad":3}' },
    ])
    expect(request.calls.argsFor(4)).toEqual(['/api/carrito/items/4', { method: 'DELETE' }])
    expect(request.calls.argsFor(5)).toEqual(['/api/clientes/12/carrito', { method: 'DELETE' }])
  })

  it('crea, lista y consulta boletas del cliente', async () => {
    await createReceipt(12, { metodoPago: 'tarjeta', direccion: 'Av. Siempre Viva 123' }, request)
    await listReceipts(12, request)
    await getReceipt(12, 80, request)

    expect(request.calls.argsFor(0)).toEqual([
      '/api/clientes/12/boletas',
      { method: 'POST', body: '{"metodoPago":"tarjeta","direccion":"Av. Siempre Viva 123"}' },
    ])
    expect(request.calls.argsFor(1)[0]).toBe('/api/clientes/12/boletas')
    expect(request.calls.argsFor(2)[0]).toBe('/api/clientes/12/boletas/80')
  })

  it('administra publicaciones del blog', async () => {
    await listBlogPosts(request)
    await getBlogPost(5, request)
    await saveBlogPost({ title: 'Nuevo' }, null, request)
    await saveBlogPost({ title: 'Editado' }, 5, request)
    await deleteBlogPost(5, request)

    expect(request.calls.argsFor(0)[0]).toBe('/api/blogs')
    expect(request.calls.argsFor(1)[0]).toBe('/api/blogs/5')
    expect(request.calls.argsFor(2)).toEqual([
      '/api/blogs',
      { method: 'POST', body: '{"titulo":"Nuevo"}' },
    ])
    expect(request.calls.argsFor(3)[0]).toBe('/api/blogs/5')
    expect(request.calls.argsFor(4)).toEqual(['/api/blogs/5', { method: 'DELETE' }])
  })
})
