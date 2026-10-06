import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('vistas administrativas de pedidos, categorías y reportes generales', () => {
  let container
  let root
  const storageKeys = [
    'productos_db',
    'categorias_db',
    'carrito',
    'usuarios_db',
    'pedidos_db',
    'mensajes_contacto_db',
    'usuarioActivo',
  ]
  const customer = { id: 42, nombre: 'Ana Cliente', email: 'ana@example.com', rol: 'CLIENTE' }
  const order = {
    id: 501,
    usuarioId: customer.id,
    fecha: '03-10-2026',
    estado: 'Confirmado',
    subtotal: 2000,
    iva: 380,
    total: 2380,
    items: [{
      productoId: 7,
      codigo: 'PRI-107',
      nombre: 'Lápices de colores',
      cantidad: 2,
      precio: 1000,
      precioConIva: 1190,
      totalLinea: 2380,
    }],
    despacho: {
      nombre: customer.nombre,
      telefono: '123456789',
      direccion: 'Av. Central 123',
      comuna: 'Santiago',
      region: 'Metropolitana',
      observaciones: 'Dejar en recepción',
    },
  }

  function seedStore({ orders = [order], products = [], users = [customer], messages = [] } = {}) {
    localStorage.setItem('productos_db', JSON.stringify(products))
    localStorage.setItem('categorias_db', JSON.stringify(['Escolar']))
    localStorage.setItem('carrito', JSON.stringify([]))
    localStorage.setItem('usuarios_db', JSON.stringify([
      ...users,
      { id: 999, nombre: 'Administración', email: 'admin@duoc.cl', rol: 'ADMIN' },
    ]))
    localStorage.setItem('pedidos_db', JSON.stringify(orders))
    localStorage.setItem('mensajes_contacto_db', JSON.stringify(messages))
    localStorage.setItem('usuarioActivo', JSON.stringify({
      id: 999,
      nombre: 'Administración',
      email: 'admin@duoc.cl',
      rol: 'ADMIN',
    }))
  }

  function renderAt(path) {
    window.history.pushState({}, '', path)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root.render(<App />))
    return container
  }

  beforeEach(() => {
    seedStore()
  })

  afterEach(() => {
    if (root) act(() => root.unmount())
    if (container) container.remove()
    storageKeys.forEach(key => localStorage.removeItem(key))
    window.history.pushState({}, '', '/')
    root = null
    container = null
  })

  it('muestra pedidos administrativos relacionados con el cliente', () => {
    const page = renderAt('/admin/pedidos')

    expect(page.textContent).toContain('#501')
    expect(page.textContent).toContain('Ana Cliente')
    expect(page.textContent).toContain('Confirmado')
    expect(page.textContent).toContain('$2.380')
    expect(page.querySelector('a[href="/admin/pedidos/501"]').textContent).toContain('Ver pedido')
  })

  it('muestra líneas, cantidades, importes y despacho en el detalle del pedido', () => {
    const page = renderAt('/admin/pedidos/501')

    expect(page.textContent).toContain('Ana Cliente')
    expect(page.textContent).toContain('Lápices de colores')
    expect(page.textContent).toContain('PRI-107')
    expect(page.textContent).toContain('$1.190')
    expect(page.textContent).toContain('$2.380')
    expect(page.textContent).toContain('Av. Central 123, Santiago, Metropolitana')
    expect(page.textContent).toContain('Dejar en recepción')
  })

  it('filtra el historial administrativo por usuario y enlaza al pedido', () => {
    seedStore({ orders: [order, { ...order, id: 502, usuarioId: 77 }] })
    const page = renderAt('/admin/usuarios/42/compras')

    expect(page.textContent).toContain('Ana Cliente')
    expect(page.textContent).toContain('#501')
    expect(page.textContent).not.toContain('#502')
    expect(page.querySelector('a[href="/admin/pedidos/501"]')).not.toBeNull()
  })

  it('renderiza métricas y agregados del reporte general desde el store', () => {
    seedStore({
      products: [
        { id: 1, categoria: 'Escolar', stock: 5 },
        { id: 2, categoria: 'Escolar', stock: 20 },
      ],
      messages: [{ id: 1, atendido: false }],
    })
    const page = renderAt('/admin/reportes')

    expect(page.textContent).toContain('Reportes Generales')
    expect(page.textContent).toContain('Productos')
    expect(page.textContent).toContain('Usuarios')
    expect(page.textContent).toContain('Ventas registradas')
    expect(page.textContent).toContain('Productos críticos')
    expect(page.textContent).toContain('Mensajes registrados')
    expect(page.textContent).toContain('Confirmado')
    expect(page.textContent).toContain('Escolar')
    expect(page.textContent).toContain('Stock disponible')
  })

  it('crea una categoría persistente y la ofrece al crear un producto', () => {
    const page = renderAt('/admin/categorias')
    const createLink = page.querySelector('a[href="/admin/categorias/nueva"]')

    act(() => createLink.click())
    const input = container.querySelector('#field-nombre')
    const form = input.closest('form')

    act(() => {
      input.value = 'Tecnología'
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(page.textContent).toContain('Tecnología')
    expect(JSON.parse(localStorage.getItem('categorias_db')).some(category => category.nombre === 'Tecnología')).toBeTrue()

    act(() => {
      window.history.pushState({}, '', '/admin/productos/nuevo')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(container.querySelector('#product-category').textContent).toContain('Tecnología')
  })
})
