import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import regions from '../data/regiones.json'
import productsSeed from '../data/productos.json'
import { apiEnabled } from './api.js'
import { createProduct, deleteProduct, updateProduct } from './data/productRepository.js'
import { getAvailableCategories } from './data/categoryRepository.js'
import { addProductQuantityToCart } from './data/cart.js'
import { getOfferCartProduct, getOfferProducts } from './data/offers.js'
import { CRITICAL_STOCK_THRESHOLD, getCriticalProducts, getProductReport } from './data/productReports.js'
import { getGeneralReport } from './data/generalReports.js'
import { mockDatabase } from './data/mockDatabase.js'
import { listCatalogProducts, removeCatalogProduct, saveCatalogProduct } from './services/catalogApi.js'
import {
  addCartItem,
  clearCart as clearRemoteCart,
  createReceipt,
  deleteBlogPost,
  deleteCustomer,
  getBlogPost,
  getCart,
  getCustomer,
  getProduct,
  getReceipt,
  listBlogPosts,
  listCustomers,
  listReceipts,
  loginCustomer,
  removeCartItem,
  saveBlogPost,
  saveCustomer,
  updateCartItem,
} from './services/prostockApi.js'
import BrandLogo from './components/BrandLogo.jsx'
import ProductImage from './components/ProductImage.jsx'

const StoreContext = createContext(null)
const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`
const withTax = value => Math.round(Number(value) * 1.19)
const createId = () => Date.now()
const formatToday = () => new Date().toLocaleDateString('es-CL')
const identity = value => value
const pageTitles = {
  '/': 'Inicio', '/productos': 'Catálogo de Productos', '/categorias': 'Categorías',
  '/ofertas': 'Ofertas', '/carrito': 'Carrito de Compras',
  '/nosotros': 'Nosotros', '/blogs': 'Blog y Noticias', '/contacto': 'Contacto',
  '/login': 'Iniciar Sesión', '/registro': 'Crear una Cuenta', '/perfil': 'Mi Perfil',
}
const readStored = (key, fallback) => {
  const stored = localStorage.getItem(key)
  if (stored === null) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  return JSON.parse(stored)
}

function useStoredValue(key, fallback, normalize = identity, persist = true) {
  const [value, setValue] = useState(() => {
    const stored = persist ? readStored(key, fallback) : fallback
    const normalized = normalize(stored)
    if (persist && normalized !== stored) localStorage.setItem(key, JSON.stringify(normalized))
    return normalized
  })
  const update = useCallback(nextValue => {
    setValue(current => {
      const next = typeof nextValue === 'function' ? nextValue(current) : nextValue
      const normalized = normalize(next)
      if (persist) localStorage.setItem(key, JSON.stringify(normalized))
      return normalized
    })
  }, [key, normalize, persist])
  return [value, update]
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return []
  return categories.map((category, index) => typeof category === 'string'
    ? { id: index + 1, nombre: category }
    : category).filter(category => category?.nombre)
}

function StoreProvider({ children }) {
  const [products, setProducts] = useStoredValue('productos_db', apiEnabled ? [] : productsSeed, identity, !apiEnabled)
  const [categories, setCategories] = useStoredValue('categorias_db', apiEnabled ? [] : mockDatabase.categories.list(), normalizeCategories, !apiEnabled)
  const [offers, setOffers] = useStoredValue('ofertas_db', apiEnabled ? [] : mockDatabase.offers.list(), identity, !apiEnabled)
  const [cart, setCart] = useStoredValue('carrito', [], identity, !apiEnabled)
  const [users, setUsers] = useStoredValue('usuarios_db', apiEnabled ? [] : [
    { id: 999, nombre: 'Administrador Prostock', email: 'admin@duoc.cl', password: 'admin123', rol: 'ADMIN' },
  ], identity, !apiEnabled)
  const [orders, setOrders] = useStoredValue('pedidos_db', [], identity, !apiEnabled)
  const [messages, setMessages] = useStoredValue('mensajes_contacto_db', [], identity, !apiEnabled)
  const [posts, setPosts] = useStoredValue('blogs_db', apiEnabled ? [] : blogSeed, identity, !apiEnabled)
  const [activeUser, setActiveUser] = useStoredValue(apiEnabled ? 'prostock_cliente_sesion' : 'usuarioActivo', null)
  const [apiError, setApiError] = useState('')
  const [backendReady, setBackendReady] = useState(!apiEnabled)

  const refreshBackend = useCallback(async (user = activeUser) => {
    const [remoteProducts, remotePosts] = await Promise.all([
      listCatalogProducts(),
      listBlogPosts(),
    ])
    setProducts(remoteProducts)
    setPosts(remotePosts)
    const remoteCart = await getCart(user?.id)
    setCart(remoteCart)
    if (user) {
      const [remoteReceipts, remoteUsers] = await Promise.all([
        listReceipts(user.id),
        user.rol === 'ADMIN' ? listCustomers() : Promise.resolve(users),
      ])
      setOrders(remoteReceipts)
      if (user.rol === 'ADMIN') setUsers(remoteUsers)
    } else {
      setOrders([])
    }
    setApiError('')
  }, [activeUser, users, setProducts, setCart, setUsers, setOrders, setPosts])

  const reloadCart = useCallback(async (user = activeUser) => {
    const remoteCart = await getCart(user?.id)
    setCart(remoteCart)
    return remoteCart
  }, [activeUser, setCart])

  const addCartProduct = useCallback(async (product, quantity) => {
    if (apiEnabled) {
      await addCartItem(activeUser?.id, product.id, quantity)
      return reloadCart()
    }
    setCart(current => addProductQuantityToCart(current, product, quantity) || current)
    return null
  }, [activeUser, reloadCart, setCart])

  const changeCartProductQuantity = useCallback(async (productId, quantity) => {
    if (apiEnabled) {
      if (quantity <= 0) await removeCartItem(activeUser?.id, productId)
      else await updateCartItem(activeUser?.id, productId, quantity)
      return reloadCart()
    }
    setCart(current => current.flatMap(item => item.id === productId
      ? (quantity > 0 ? [{ ...item, cantidad: quantity }] : [])
      : [item]))
    return null
  }, [activeUser, reloadCart, setCart])

  const removeCartProduct = useCallback(async productId => {
    if (apiEnabled) {
      await removeCartItem(activeUser?.id, productId)
      return reloadCart()
    }
    setCart(current => current.filter(item => item.id !== productId))
    return null
  }, [activeUser, reloadCart, setCart])

  const emptyCart = useCallback(async () => {
    if (apiEnabled) {
      await clearRemoteCart(activeUser?.id)
      return reloadCart()
    }
    setCart([])
    return null
  }, [activeUser, reloadCart, setCart])

  useEffect(() => {
    if (!apiEnabled) return
    let active = true
    Promise.resolve()
      .then(() => refreshBackend())
      .catch(error => {
        if (!active) return
        console.error('No fue posible cargar datos desde el microservicio.', error)
        setApiError(`No fue posible conectar con el backend: ${error.message}`)
      })
      .finally(() => {
        if (active) setBackendReady(true)
      })
    return () => { active = false }
  }, [refreshBackend])

  useEffect(() => {
    if (!apiEnabled && !users.some(user => user.email === 'admin@duoc.cl')) {
      setUsers(current => current.some(user => user.email === 'admin@duoc.cl')
        ? current
        : [...current, {
          id: 999, nombre: 'Administrador Prostock', email: 'admin@duoc.cl',
          password: 'admin123', rol: 'ADMIN',
        }])
    }
  }, [users, setUsers])
  const value = useMemo(() => ({
    products, setProducts, categories, setCategories, offers, setOffers, cart, setCart, users, setUsers, orders, setOrders,
    messages, setMessages, posts, setPosts, activeUser, setActiveUser, apiEnabled, apiError,
    setApiError, backendReady, refreshBackend, reloadCart, addCartProduct,
    changeCartProductQuantity, removeCartProduct, emptyCart,
  }), [products, setProducts, categories, setCategories, offers, setOffers, cart, setCart, users, setUsers, orders, setOrders, messages, setMessages, posts, setPosts, activeUser, setActiveUser, apiError, setApiError, backendReady, refreshBackend, reloadCart, addCartProduct, changeCartProductQuantity, removeCartProduct, emptyCart])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore debe usarse dentro de StoreProvider')
  return store
}

function Header() {
  const { cart, activeUser, setActiveUser, refreshBackend, setApiError, apiEnabled } = useStore()
  const logout = async () => {
    setActiveUser(null)
    if (apiEnabled) {
      try {
        await refreshBackend(null)
      } catch (error) {
        setApiError(`No se pudo cargar el carrito de invitado: ${error.message}`)
      }
    }
  }
  const count = cart.reduce((total, item) => total + item.cantidad, 0)
  const links = [
    ['/', 'Inicio'],
    ['/productos', 'Productos'],
    ['/nosotros', 'Nosotros'],
    ['/blogs', 'Blog'],
    ['/contacto', 'Contacto'],
  ]

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="/img/logo-prostock.svg" className="brand-logo" alt="Prostock" />
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Abrir navegación">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {links.map(([to, label]) => (
              <li className="nav-item" key={to}>
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to={to} end={to === '/'}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-3">
            <Link to="/carrito" className="btn btn-outline-light position-relative" aria-label="Carrito de compras">
              <i className="bi bi-cart3" />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{count}</span>
            </Link>
            {activeUser ? (
              <div className="text-white small d-flex align-items-center gap-2">
                <Link className="text-white text-decoration-none" to="/perfil">{activeUser.nombre}</Link>
                <button className="btn btn-sm btn-outline-light" onClick={logout}>Salir</button>
              </div>
            ) : <Link className="btn btn-sm btn-outline-light" to="/login">Ingresar</Link>}
          </div>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-dark text-white text-center py-4 mt-auto">
      <div className="container"><p className="mb-0 small">&copy; 2026 Prostock Inc. Todos los derechos reservados.</p></div>
    </footer>
  )
}

function SiteLayout() {
  return <div className="site-layout"><Header /><BackendNotice /><Outlet /><Footer /></div>
}

function BackendNotice() {
  const { apiError, apiEnabled } = useStore()
  if (!apiEnabled || !apiError) return null
  return <div className="container mt-3"><div className="alert alert-danger mb-0" role="alert">{apiError}</div></div>
}

function ProductCard({ product }) {
  const { cart, setCart } = useStore()
  const addToCart = () => {
    const found = cart.find(item => item.id === product.id)
    if (found && found.cantidad >= product.stock) {
      window.alert(`Solo hay ${product.stock} unidades disponibles.`)
      return
    }
    setCart(current => {
      const item = current.find(entry => entry.id === product.id)
      return item
        ? current.map(entry => entry.id === product.id ? { ...entry, cantidad: entry.cantidad + 1 } : entry)
        : [...current, { ...product, cantidad: 1 }]
    })
  }

  return (
    <article className="col-sm-6 col-lg-4 col-xl-3 mb-4">
      <div className="card h-100 shadow-sm border-0 product-card">
        <Link to={`/producto/${product.id}`} aria-label={`Ver ${product.nombre}`}>
          <img src={product.imagen} className="card-img-top" alt={product.nombre} style={{ height: 180, objectFit: 'cover' }} />
        </Link>
        <div className="card-body d-flex flex-column">
          <small className="text-muted fw-bold">ID: {product.id}</small>
          <h2 className="h6 fw-bold mt-2"><Link className="text-decoration-none text-dark" to={`/producto/${product.id}`}>{product.nombre}</Link></h2>
          <span className="text-muted small">{product.categoria}</span>
          <strong className="text-primary mt-2">{money(withTax(product.precio))} IVA incl.</strong>
          <button className="btn btn-primary mt-auto mt-3" onClick={addToCart} disabled={product.stock <= 0}>
            <i className="bi bi-cart-plus me-1" />Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  )
}

function HomePage() {
  const { products } = useStore()
  const categories = [...new Set(products.map(product => product.categoria))]
  const [category, setCategory] = useState('')
  const shownProducts = products.filter(product => !category || product.categoria === category).slice(0, 8)

  return (
    <>
      <div className="home-notice"><div className="container"><span><i className="bi bi-truck" /> Despacho a todo Chile · Insumos para tu oficina</span></div></div>
      <section className="home-hero">
        <div className="container"><div className="home-hero-content">
          <p className="home-hero-kicker">PROSTOCK · PAPELERÍA Y OFICINA</p>
          <h1>Todo lo que tu oficina necesita</h1>
          <p className="home-hero-copy">Encuentra insumos de calidad para trabajar mejor. Compra fácil, rápido y con despacho a todo Chile.</p>
          <Link to="/productos" className="btn btn-warning btn-lg fw-bold mt-3">Explorar productos <i className="bi bi-arrow-right ms-2" /></Link>
        </div></div>
      </section>
      <section className="home-categories container">
        <h2 className="home-category-title">Compra por categoría</h2>
        <p className="home-category-intro text-muted">Encuentra rápidamente los productos que buscas.</p>
        <div className="home-category-tabs" role="tablist" aria-label="Categorías de productos">
          <button className={`home-category-tab${category === '' ? ' active' : ''}`} onClick={() => setCategory('')}>Todos</button>
          {categories.map(item => <button className={`home-category-tab${category === item ? ' active' : ''}`} key={item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </section>
      <section className="container pb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h3 fw-bold mb-0">Productos destacados</h2>
          <Link to="/productos">Ver catálogo <i className="bi bi-arrow-right" /></Link>
        </div>
        <div className="row">{shownProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <section className="bg-light py-5">
        <div className="container row g-4 mx-auto text-center">
          <div className="col-md-4"><i className="bi bi-truck fs-2 text-primary" /><h3 className="h5 mt-2">Despacho confiable</h3><p className="text-muted">Llevamos tus compras hasta tu puerta.</p></div>
          <div className="col-md-4"><i className="bi bi-box-seam fs-2 text-primary" /><h3 className="h5 mt-2">Amplio catálogo</h3><p className="text-muted">Insumos para empresas, estudio y hogar.</p></div>
          <div className="col-md-4"><i className="bi bi-headset fs-2 text-primary" /><h3 className="h5 mt-2">Atención cercana</h3><p className="text-muted">Estamos para ayudarte con tus compras.</p></div>
        </div>
      </section>
    </>
  )
}

function ProductsPage() {
  const { products, apiEnabled } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const category = new URLSearchParams(location.search).get('categoria') || ''
  const [categoryResult, setCategoryResult] = useState({ category: '', products: [] })
  const [categoryError, setCategoryError] = useState({ category: '', message: '' })
  const categories = [...new Set(products.map(product => product.categoria))]
  const productsToFilter = apiEnabled && category
    ? (categoryResult.category === category ? categoryResult.products : [])
    : products
  const filtered = productsToFilter.filter(product => {
    const searchMatches = `${product.id} ${product.codigo} ${product.nombre}`.toLowerCase().includes(search.toLowerCase())
    return searchMatches && (!category || product.categoria === category)
  })
  useEffect(() => {
    if (!apiEnabled || !category) return
    let active = true
    listCatalogProducts()
      .then(result => {
        if (active) setCategoryResult({
          category,
          products: result.filter(product => product.categoria === category),
        })
      })
      .catch(error => {
        if (active) setCategoryError({ category, message: error.message })
      })
    return () => { active = false }
  }, [apiEnabled, category])
  const currentCategoryError = categoryError.category === category ? categoryError.message : ''
  return (
    <main className="container my-5">
      <div className="row align-items-center mb-4">
        <div className="col-md-6"><h1 className="h2">Catálogo de Productos</h1></div>
        <div className="col-md-6"><div className="d-flex gap-2">
          <input className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por código o nombre..." aria-label="Buscar productos" />
          <select className="form-select" value={category} onChange={event => navigate(event.target.value ? `/productos?categoria=${encodeURIComponent(event.target.value)}` : '/productos')} aria-label="Filtrar productos por categoría">
            <option value="">Todas las categorías</option>{categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </div></div>
      </div>
      {currentCategoryError && <div className="alert alert-danger" role="alert">No se pudieron cargar los productos de esta categoría: {currentCategoryError}</div>}
      <div className="row">{filtered.length ? filtered.map(product => <ProductCard key={product.id} product={product} />) : <p className="col-12 text-center py-5 text-muted">No hay productos disponibles.</p>}</div>
    </main>
  )
}

function CategoriesPage() {
  const { products } = useStore()
  const categories = [...new Set(products.map(product => product.categoria).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'es'))

  return <main className="container my-5">
    <h1 className="h2 mb-4">Categorías</h1>
    <div className="row g-3">
      {categories.map(category => <div className="col-sm-6 col-lg-4" key={category}>
        <Link className="card h-100 text-decoration-none shadow-sm" to={`/productos?categoria=${encodeURIComponent(category)}`}>
          <div className="card-body">
            <h2 className="h5 text-dark">{category}</h2>
            <p className="text-muted mb-0">{products.filter(product => product.categoria === category).length} productos</p>
          </div>
        </Link>
      </div>)}
      {!categories.length && <p className="text-muted">No hay categorías disponibles.</p>}
    </div>
  </main>
}

function OffersPage() {
  const { products } = useStore()
  const offers = getOfferProducts(products)

  return <main className="container my-5">
    <h1 className="h2 mb-4">Ofertas</h1>
    {offers.length
      ? <div className="row">{offers.map(product => <ProductCard key={product.id} product={product} />)}</div>
      : <div className="alert alert-info" role="status">No hay ofertas vigentes en este momento.</div>}
  </main>
}

function ProductDetailPage() {
  const { id } = useParams()
  const { products, cart, apiEnabled, backendReady, apiError, addCartProduct } = useStore()
  const [productResult, setProductResult] = useState({ id: '', product: null, error: '' })
  const [quantity, setQuantity] = useState(1)
  const [imageSelection, setImageSelection] = useState({ productId: id, index: 0 })
  useEffect(() => {
    if (!apiEnabled) return
    let active = true
    getProduct(id)
      .then(result => {
        if (active) setProductResult({ id, product: result, error: '' })
      })
      .catch(error => {
        if (active) setProductResult({ id, product: null, error: error.message })
      })
    return () => { active = false }
  }, [apiEnabled, id])
  const product = apiEnabled
    ? (productResult.id === id ? productResult.product : null)
    : products.find(item => String(item.id) === id)
  const loadError = apiEnabled && productResult.id === id ? productResult.error : ''
  if (apiEnabled && (!backendReady || productResult.id !== id) && !product && !loadError) {
    return <main className="container my-5 text-center" role="status">Cargando producto...</main>
  }
  if (!product) return <main className="container my-5 text-center"><h1 className="h3">{loadError ? 'No se pudo cargar el producto' : 'Producto no encontrado'}</h1>{loadError && <p role="alert">{loadError}</p>}<Link to="/productos" className="btn btn-primary mt-3">Volver al catálogo</Link></main>
  const images = product.imagenes?.length ? product.imagenes : [product.imagen]
  const normalizedImages = images.map(image => image || '/img/product-placeholder.svg')
  const activeImage = imageSelection.productId === id
    ? Math.min(imageSelection.index, normalizedImages.length - 1)
    : 0
  const changeImage = direction => setImageSelection({
    productId: id,
    index: (activeImage + direction + normalizedImages.length) % normalizedImages.length,
  })
  const addToCart = async () => {
    const cartProduct = getOfferCartProduct(product)
    if (!apiEnabled && !addProductQuantityToCart(cart, cartProduct, quantity)) {
      window.alert(`Solo hay ${product.stock} unidades disponibles.`)
      return
    }
    try {
      await addCartProduct(cartProduct, quantity)
    } catch (error) {
      window.alert(`No se pudo actualizar el carrito: ${error.message}`)
    }
  }
  return <main className="container my-5"><div className="row bg-white p-4 rounded shadow-sm border">
    <div className="col-md-6 text-center">
      <div className="product-carousel">
        <ProductImage src={normalizedImages[activeImage]} className="img-fluid product-detail-image" alt={`${product.nombre}, imagen ${activeImage + 1}`} />
        {normalizedImages.length > 1 && <div className="d-flex justify-content-between px-3 pb-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => changeImage(-1)} aria-label="Imagen anterior">
            <i className="bi bi-chevron-left" /> Anterior
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => changeImage(1)} aria-label="Imagen siguiente">
            Siguiente <i className="bi bi-chevron-right" />
          </button>
        </div>}
      </div>
      {normalizedImages.length > 1 && <div className="d-flex gap-2 justify-content-center mt-3" aria-label="Seleccionar imagen del producto">
        {normalizedImages.map((image, index) => <button
          key={`${image}-${index}`}
          type="button"
          className={`p-0 rounded border${index === activeImage ? ' border-primary border-2' : ''}`}
          onClick={() => setImageSelection({ productId: id, index })}
          aria-label={`Mostrar imagen ${index + 1}`}
          aria-pressed={index === activeImage}
        >
          <ProductImage src={image} alt="" className="rounded" style={{ width: 64, height: 64, objectFit: 'cover' }} />
        </button>)}
      </div>}
    </div>
    <div className="col-md-6 d-flex flex-column justify-content-center">
      <span className="badge bg-secondary mb-2 align-self-start">{product.categoria}</span>
      <h1 className="h2">{product.nombre}</h1><p className="text-muted">ID: <strong>{product.id}</strong></p>
      <h2 className="text-primary fw-bold my-3">{money(withTax(product.precio))}</h2>
      <p className="text-muted small">Precio con IVA incluido</p><p>Stock disponible: <strong>{product.stock} unidades</strong></p>
      <div className="d-flex gap-2 mt-3">
        <input className="form-control" type="number" min="1" max={product.stock} value={quantity} onChange={event => setQuantity(Math.max(1, Number(event.target.value)))} aria-label="Cantidad" style={{ maxWidth: 90 }} />
        <button className="btn btn-danger btn-lg" onClick={addToCart} disabled={product.stock < 1 || (apiEnabled && (!backendReady || Boolean(apiError)))}><i className="bi bi-cart-plus" /> Agregar al Carrito</button>
        <Link to="/productos" className="btn btn-outline-secondary btn-lg">Volver</Link>
      </div>
    </div>
  </div></main>
}

function CartPage() {
  const {
    cart, setCart, products, setProducts, activeUser, orders, setOrders, apiEnabled,
    backendReady, apiError, changeCartProductQuantity, removeCartProduct, emptyCart,
    setApiError,
  } = useStore()
  const navigate = useNavigate()
  const [checkout, setCheckout] = useState(false)
  const [notice, setNotice] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('Despacho estándar')
  const [paymentMethod, setPaymentMethod] = useState('tarjeta')
  const [shipping, setShipping] = useState(() => ({
    nombre: activeUser?.nombre || '', telefono: activeUser?.telefono || '',
    direccion: activeUser?.direccion || '', comuna: activeUser?.comuna || '',
    region: activeUser?.region || '', observaciones: '',
  }))
  const total = cart.reduce((sum, item) => sum + withTax(item.precio) * item.cantidad, 0)
  const subtotal = Math.round(total / 1.19)
  const setQuantity = async (id, change) => {
    const item = cart.find(entry => entry.id === id)
    if (!item) return
    const next = item.cantidad + change
    const product = products.find(entry => entry.id === id)
    if (next > (product?.stock || 0)) {
      window.alert(`Solo hay ${product?.stock || 0} unidades disponibles.`)
      return
    }
    try {
      await changeCartProductQuantity(id, next)
    } catch (error) {
      setNotice(`No se pudo actualizar el carrito: ${error.message}`)
    }
  }
  const removeItem = async id => {
    try {
      await removeCartProduct(id)
    } catch (error) {
      setNotice(`No se pudo quitar el producto: ${error.message}`)
    }
  }
  const clearShoppingCart = async () => {
    try {
      await emptyCart()
    } catch (error) {
      setNotice(`No se pudo vaciar el carrito: ${error.message}`)
    }
  }
  const checkoutOrder = async event => {
    event.preventDefault()
    if (apiEnabled && (!backendReady || apiError)) {
      setNotice('No se puede confirmar la compra hasta recuperar la conexión con el catálogo.')
      return
    }
    if (!activeUser) {
      navigate('/login', { state: { from: '/carrito', notice: 'Inicia sesión para emitir la boleta.' } })
      return
    }
    const unavailable = cart.find(item => !products.some(product => product.id === item.id && product.stock >= item.cantidad))
    if (unavailable) {
      setNotice(`No hay stock suficiente para "${unavailable.nombre}".`)
      return
    }
    if (apiEnabled) {
      try {
        const receipt = await createReceipt(activeUser.id, {
          metodoPago: paymentMethod,
          direccion: shipping.direccion,
        })
        setOrders(current => [...current, receipt])
        setCart([])
        setCheckout(false)
        emptyCart().catch(error => setApiError(`La boleta se emitió, pero no se pudo limpiar el carrito: ${error.message}`))
        navigate('/compra/resultado', { state: { receipt } })
      } catch (error) {
        navigate('/compra/fallo', { state: { message: error.message } })
      }
      return
    }
    const updatedProducts = products.map(product => {
      const item = cart.find(entry => entry.id === product.id)
      return item ? { ...product, stock: product.stock - item.cantidad } : product
    })
    const order = {
      id: createId(), usuarioId: activeUser.id, fecha: formatToday(),
      subtotal, iva: total - subtotal, total, estado: 'Confirmado', items: cart,
      despacho: { ...shipping, observaciones: [shipping.observaciones, `Modalidad: ${deliveryMethod}`].filter(Boolean).join(' | ') },
    }
    setProducts(updatedProducts)
    setOrders([...orders, order])
    setCart([])
    setCheckout(false)
    navigate('/compra/resultado', { state: { receipt: order } })
  }
  return <main className="container my-5">
    <h1 className="h2 mb-4"><i className="bi bi-cart3" /> Carrito de Compras</h1>
    {notice && <div className="alert alert-info" role="status">{notice}</div>}
    <div className="row">
      <div className="col-lg-8 mb-4"><div className="table-responsive shadow-sm border rounded">
        <table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th>Acción</th></tr></thead>
          <tbody>{cart.length ? cart.map(item => <tr key={item.id}>
            <td><img src={item.imagen} width="50" height="50" className="rounded object-fit-cover me-2" alt="" /><span className="fw-bold">{item.nombre}</span></td>
            <td>{item.precioOriginal && item.precioOriginal > item.precio && <div className="small text-muted text-decoration-line-through">{money(withTax(item.precioOriginal))}</div>}{money(withTax(item.precio))}</td><td><div className="input-group input-group-sm" style={{ width: 110 }}>
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(item.id, -1)} aria-label="Restar una unidad">-</button><span className="form-control text-center">{item.cantidad}</span>
              <button className="btn btn-outline-secondary" onClick={() => setQuantity(item.id, 1)} aria-label="Agregar una unidad">+</button></div></td>
            <td className="fw-bold">{money(withTax(item.precio) * item.cantidad)}</td>
            <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.id)} aria-label={`Eliminar ${item.nombre}`}><i className="bi bi-trash" /></button></td>
          </tr>) : <tr><td colSpan="5" className="text-center py-4 text-muted">El carrito está vacío. <Link to="/productos">Ver productos</Link></td></tr>}</tbody>
        </table></div>
        {cart.length > 0 && <button className="btn btn-outline-secondary btn-sm mt-3" onClick={() => window.confirm('¿Deseas vaciar todo el carrito?') && clearShoppingCart()}><i className="bi bi-trash" /> Vaciar Carrito</button>}
      </div>
      <div className="col-lg-4"><div className="card shadow-sm border-0"><div className="card-body">
        <h2 className="h5 fw-bold border-bottom pb-2">Resumen de Orden</h2>
        <div className="d-flex justify-content-between my-2"><span>Subtotal neto:</span><span>{money(subtotal)}</span></div>
        <div className="d-flex justify-content-between my-2"><span>IVA incluido (19%):</span><span>{money(total - subtotal)}</span></div><hr />
        <div className="d-flex justify-content-between fs-5 fw-bold mb-3"><span>Total a pagar:</span><span className="text-primary">{money(total)}</span></div>
        <button className="btn btn-success w-100 py-2 fw-bold" disabled={!cart.length || (apiEnabled && (!backendReady || Boolean(apiError)))} onClick={() => {
          if (!activeUser) {
            setNotice('Debes iniciar sesión para finalizar tu compra.')
            navigate('/login', { state: { from: '/carrito', notice: 'Inicia sesión para finalizar tu compra.' } })
          } else setCheckout(!checkout)
        }}>Pagar Pedido</button>
        <Link to="/productos" className="btn btn-link w-100 mt-2 text-decoration-none">Seguir comprando</Link>
      </div></div></div>
    </div>
    {checkout && <section className="card mt-4"><div className="card-body"><h2 className="h4">Datos de despacho</h2>
      <form className="row g-3" onSubmit={checkoutOrder}>
        <div className="col-12"><label className="form-label" htmlFor="delivery-method">Modalidad de entrega</label>
          <select id="delivery-method" className="form-select" value={deliveryMethod} onChange={event => setDeliveryMethod(event.target.value)} required>
            <option>Despacho estándar</option><option>Despacho programado</option>
          </select>
        </div>
        <div className="col-12"><label className="form-label" htmlFor="payment-method">Método de pago</label>
          <select id="payment-method" className="form-select" value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)} required>
            <option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option>
          </select>
        </div>
        {['nombre', 'telefono', 'direccion', 'comuna', 'region'].map(field => <div className="col-md-6" key={field}>
          <label className="form-label" htmlFor={`shipping-${field}`}>{field[0].toUpperCase() + field.slice(1)}</label>
          <input id={`shipping-${field}`} className="form-control" required value={shipping[field]} onChange={event => setShipping({ ...shipping, [field]: event.target.value })} />
        </div>)}
        <div className="col-12"><label className="form-label" htmlFor="shipping-notes">Observaciones</label><textarea id="shipping-notes" className="form-control" rows="3" value={shipping.observaciones} onChange={event => setShipping({ ...shipping, observaciones: event.target.value })} /></div>
        <div className="col-12 d-flex gap-2"><button className="btn btn-success" type="submit">Confirmar Pedido</button><button className="btn btn-secondary" type="button" onClick={() => setCheckout(false)}>Cancelar</button></div>
      </form>
    </div></section>}
  </main>
}

function CheckoutResultPage({ success }) {
  const { state } = useLocation()
  const order = state?.receipt
  if (!success) return <main className="container my-5">
    <div className="alert alert-danger" role="alert"><h1 className="h3">No se pudo completar la compra</h1><p className="mb-0">{state?.message || 'Vuelve al carrito para intentar confirmar el pedido nuevamente.'}</p></div>
    <Link className="btn btn-primary" to="/carrito">Volver al carrito</Link>
  </main>
  if (!order) return <main className="container my-5">
    <div className="alert alert-success" role="status"><h1 className="h3">Compra confirmada</h1><p className="mb-0">Tu pedido fue registrado. Inicia sesión para revisar su detalle.</p></div>
    <Link className="btn btn-primary" to="/perfil">Ver mi perfil</Link>
  </main>
  return <main className="container my-5">
    <div className="alert alert-success" role="status"><h1 className="h3">¡Compra exitosa!</h1><p className="mb-0">Tu boleta #{order.id} fue emitida.</p></div>
    <section className="card shadow-sm border-0">
      <div className="card-body"><h2 className="h5">Resumen de compra</h2>
        <p className="mb-2">Fecha: {order.fecha ? new Date(order.fecha).toLocaleDateString('es-CL') : formatToday()}</p>
        <p className="mb-3">Estado: {order.estado}</p>
        <ul className="list-group list-group-flush mb-3">{order.items?.map((item, index) =>
          <li className="list-group-item d-flex justify-content-between" key={item.id || item.productoId || index}>
            <span>{item.nombre} × {item.cantidad}</span><span>{money(item.totalLinea || withTax(item.precio) * item.cantidad)}</span>
          </li>)}
        </ul>
        <div className="d-flex justify-content-between fw-bold"><span>Total</span><span>{money(order.total)}</span></div>
      </div>
    </section>
    <Link className="btn btn-primary mt-3" to="/productos">Seguir comprando</Link>
  </main>
}

const blogSeed = [
  { slug: 'inventario', title: '5 Tips para Organizar el Inventario de tu Oficina', category: 'Consejos', date: '12 de Mayo, 2026', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&q=80', summary: 'Un inventario ordenado reduce quiebres de stock, compras urgentes y pérdidas de materiales. Estas prácticas permiten mantener el control sin complejidad.', sections: [
    ['1. Clasifica los insumos', 'Ordena los productos según su frecuencia de uso y define responsables para los artículos críticos.'],
    ['2. Registra entradas y salidas', 'Actualiza el inventario cada vez que recibas o entregues materiales. El registro oportuno evita diferencias con el stock físico.'],
    ['3. Define un stock mínimo', 'Establece un límite de reposición por producto para anticipar las compras antes de quedarte sin unidades.'],
    ['4. Asigna una ubicación', 'Etiqueta estantes y zonas de almacenamiento. Un lugar fijo facilita el recuento y reduce el tiempo de búsqueda.'],
    ['5. Realiza revisiones periódicas', 'Contrasta el inventario registrado con el físico de forma mensual para detectar diferencias a tiempo.'],
  ] },
  { slug: 'insumos', title: 'Cómo Elegir los Insumos Correctos para tu Empresa', category: 'Gestión', date: '3 de Junio, 2026', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=80', summary: 'Una compra bien planificada ayuda a mantener el trabajo diario sin exceder el presupuesto. Para elegir los insumos adecuados es importante considerar las necesidades reales de cada equipo.', sections: [
    ['1. Identifica las necesidades del equipo', 'Revisa qué materiales se utilizan con mayor frecuencia y separa los insumos esenciales de aquellos que pueden comprarse de manera ocasional.'],
    ['2. Compara calidad y duración', 'El precio más bajo no siempre representa el mejor ahorro. Prefiere productos confiables que reduzcan reemplazos y compras repetidas.'],
    ['3. Planifica las compras', 'Define fechas de revisión y cantidades aproximadas para aprovechar mejor el presupuesto y evitar compras urgentes.'],
    ['4. Mantén proveedores confiables', 'Trabajar con proveedores estables facilita la reposición y permite mantener una calidad constante en los materiales.'],
  ] },
]

function BlogPage() {
  const { posts, apiEnabled } = useStore()
  const visiblePosts = apiEnabled ? posts : blogSeed
  return <main className="container my-5"><header className="text-center mb-5"><h1 className="fw-bold display-5">Blog</h1><p className="text-muted">Consejos para gestionar mejor los insumos de tu oficina.</p></header>
    <section className="row justify-content-center g-4">{visiblePosts.map((post, index) => <article className="col-md-8 col-lg-7 blog-item" key={post.id || post.slug}>
      <div className="card blog-card h-100 border-0 shadow-sm">{post.image && <img src={post.image.replace('900', '500')} className="card-img-top object-fit-cover" height="200" alt={post.title} />}
        <div className="card-body d-flex flex-column"><div className="mb-2"><span className={`badge ${index ? 'bg-success' : 'bg-primary'}`}>{post.category}</span></div>
          <h2 className="card-title h4 fw-bold">{post.title}</h2><p className="card-text text-muted small flex-grow-1">{post.summary}</p>
          <Link to={`/blogs/${apiEnabled ? post.id : post.slug}`} className="btn btn-primary align-self-start">Leer noticia <i className="bi bi-arrow-right ms-1" /></Link>
          <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top text-muted small"><i className="bi bi-calendar3" /><time>{post.date}</time></div>
        </div>
      </div>
    </article>)}{!visiblePosts.length && <p className="text-center text-muted">No hay publicaciones disponibles.</p>}</section>
  </main>
}

function BlogDetailPage() {
  const { slug } = useParams()
  const { posts, apiEnabled } = useStore()
  const [remotePost, setRemotePost] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!apiEnabled) return
    let active = true
    getBlogPost(slug)
      .then(result => {
        if (active) setRemotePost(result)
      })
      .catch(requestError => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [apiEnabled, slug])
  const post = apiEnabled
    ? remotePost || posts.find(item => String(item.id) === slug || item.slug === slug)
    : blogSeed.find(item => item.slug === slug)
  if (!post) return <main className="container my-5"><h1 className="h3">Artículo no encontrado</h1><Link to="/blogs">Volver al blog</Link></main>
  const sections = post.sections || (post.content ? [[post.title, post.content]] : [])
  return <main className="container my-5 flex-grow-1"><article className="mx-auto" style={{ maxWidth: 850 }}>
    <Link to="/blogs" className="text-decoration-none"><i className="bi bi-arrow-left" /> Volver al blog</Link>
    <h1 className="fw-bold my-3">{post.title}</h1><p className="text-muted"><span className="badge bg-primary me-2">{post.category}</span>{post.date}</p>
    {post.image && <img src={post.image} className="img-fluid rounded shadow-sm w-100 mb-4" alt={post.title} />}
    <p>{post.summary}</p>{sections.map(([heading, paragraph]) => <section key={heading}><h2 className="h4 mt-4">{heading}</h2><p>{paragraph}</p></section>)}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
  </article></main>
}

function AdminBlogsPage() {
  const { posts, setPosts, apiEnabled } = useStore()
  if (!apiEnabled) return <div className="alert alert-info" role="status">La gestión de publicaciones requiere habilitar la conexión con la API.</div>
  const remove = async id => {
    if (!window.confirm('¿Seguro de eliminar esta publicación?')) return
    try {
      await deleteBlogPost(id)
      setPosts(current => current.filter(post => String(post.id) !== String(id)))
    } catch (error) {
      window.alert(`No se pudo eliminar la publicación: ${error.message}`)
    }
  }
  return <>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h1 className="h3">Gestión del Blog</h1>
      <Link className="btn btn-primary" to="/admin/blogs/nuevo">Nueva publicación</Link>
    </div>
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0">
      <thead className="table-dark"><tr><th>Título</th><th>Categoría</th><th>Fecha</th><th>Acciones</th></tr></thead>
      <tbody>{posts.map(post => <tr key={post.id}><td>{post.title}</td><td>{post.category}</td><td>{post.date}</td><td>
        <Link className="btn btn-sm btn-warning me-1" to={`/admin/blogs/${post.id}`}>Editar</Link>
        <button className="btn btn-sm btn-danger" onClick={() => remove(post.id)}>Eliminar</button>
      </td></tr>)}{!posts.length && <tr><td colSpan="4" className="text-center py-4">No hay publicaciones.</td></tr>}</tbody>
    </table></div></div>
  </>
}

function AdminBlogForm() {
  const { id } = useParams()
  const { posts, setPosts, apiEnabled } = useStore()
  const navigate = useNavigate()
  const current = posts.find(post => String(post.id) === id)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id && !current))
  useEffect(() => {
    if (!apiEnabled || !id || current) return
    let active = true
    getBlogPost(id)
      .then(post => {
        if (active && post) setPosts(items => [...items, post])
      })
      .catch(requestError => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [apiEnabled, current, id, setPosts])
  const submit = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const post = {
      title: String(form.get('title')).trim(),
      category: String(form.get('category')).trim(),
      image: String(form.get('image')).trim(),
      summary: String(form.get('summary')).trim(),
      content: String(form.get('content')).trim(),
    }
    try {
      const saved = await saveBlogPost(post, current?.id)
      setPosts(items => current
        ? items.map(item => String(item.id) === String(current.id) ? saved : item)
        : [...items, saved])
      navigate('/admin/blogs')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  if (!apiEnabled) return <div className="alert alert-info" role="status">La gestión de publicaciones requiere habilitar la conexión con la API.</div>
  if (loading) return <p role="status">Cargando publicación...</p>
  if (id && !current) return <><h1 className="h3">Publicación no encontrada.</h1><Link to="/admin/blogs">Volver al blog</Link>{error && <p role="alert">{error}</p>}</>
  return <div className="card border-0 shadow-sm"><div className="card-body p-4">
    <h1 className="h4">{current ? 'Editar publicación' : 'Nueva publicación'}</h1>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}>
      <Field name="title" label="Título" defaultValue={current?.title} />
      <Field name="category" label="Categoría" defaultValue={current?.category} />
      <Field name="image" label="URL de imagen" required={false} defaultValue={current?.image} />
      <div className="mb-3"><label className="form-label" htmlFor="blog-summary">Resumen</label><textarea id="blog-summary" name="summary" className="form-control" required defaultValue={current?.summary || ''} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="blog-content">Contenido</label><textarea id="blog-content" name="content" className="form-control" rows="8" required defaultValue={current?.content || ''} /></div>
      <div className="d-flex justify-content-between"><Link className="btn btn-outline-secondary" to="/admin/blogs">Cancelar</Link><button className="btn btn-success">Guardar publicación</button></div>
    </form>
  </div></div>
}

function AboutPage() {
  return <>
    <header className="bg-dark text-white text-center py-5 mb-5 shadow-sm"><div className="container py-3"><h1 className="display-5 fw-bold">Sobre Prostock</h1><p className="lead text-light mb-0">Líderes en distribución de papelería, útiles e insumos de oficina.</p></div></header>
    <main className="container my-4">
      <div className="row align-items-center mb-5 g-4"><div className="col-md-6"><img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" className="img-fluid rounded shadow-sm object-fit-cover w-100" alt="Oficina Prostock" style={{ maxHeight: 350 }} /></div>
        <div className="col-md-6"><h2 className="fw-bold">Nuestra Historia</h2><p className="text-muted">Prostock nació bajo el liderazgo de <strong>Valentina</strong> y <strong>Javiera</strong> con el compromiso firme de entregar un servicio ágil, transparente y eficiente para empresas, instituciones educativas y clientes particulares.</p><p className="text-muted">Nos especializamos en garantizar el abastecimiento continuo de productos esenciales para la operación diaria, combinando calidad en cada despacho con una atención cercana y personalizada.</p></div>
      </div>
      <div className="row text-center g-4 my-5">{[
        ['bullseye', 'Misión', 'Proveer soluciones integrales de oficina y estudio con rapidez, entregando productos de alta calidad a precios competitivos.'],
        ['eye', 'Visión', 'Ser el distribuidor líder en insumos de oficina a nivel nacional, reconocidos por la excelencia de servicio y constante innovación digital.'],
        ['award', 'Valores', 'Puntualidad, transparencia en inventarios, compromiso con el cliente y responsabilidad en cada entrega.'],
      ].map(([icon, title, copy]) => <div className="col-md-4" key={title}><div className="card h-100 border-0 shadow-sm p-4"><div className="fs-1 text-primary mb-3"><i className={`bi bi-${icon}`} /></div><h2 className="h4 fw-bold">{title}</h2><p className="text-muted mb-0">{copy}</p></div></div>)}</div>
      <section className="my-5 pt-4"><div className="text-center mb-5"><h2 className="fw-bold">Liderazgo &amp; Equipo</h2><p className="text-muted">Las mentes detrás de la gestión y crecimiento de Prostock.</p></div>
        <div className="row justify-content-center g-4">{[['Valentina', 'Co-Fundadora & Gestión Operativa', 'Encargada de la supervisión de inventario, logística y aseguramiento de calidad en cada uno de los envíos.'], ['Javiera', 'Co-Fundadora & Experiencia de Cliente', 'Especialista en relaciones con clientes, alianzas estratégicas y optimización de la plataforma digital.']].map(([name, role, bio]) => <div className="col-md-5 col-lg-4" key={name}><div className="card border-0 shadow-sm text-center h-100 p-3"><div className="card-body"><i className="bi bi-person-circle display-1 text-primary" /><h3 className="h4 card-title fw-bold">{name}</h3><span className="badge bg-primary mb-3">{role}</span><p className="card-text text-muted small">{bio}</p></div></div></div>)}</div>
      </section>
    </main>
  </>
}

function ContactPage() {
  const { setMessages, activeUser, apiEnabled } = useStore()
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('success')
  const [preparedEmailUrl, setPreparedEmailUrl] = useState('')
  const submit = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const request = {
      nombre: String(form.get('nombre')).trim(),
      email: String(form.get('email')).trim().toLowerCase(),
      asunto: String(form.get('asunto')).trim(),
      mensaje: String(form.get('mensaje')).trim(),
    }
    const cuerpo = [`Nombre: ${request.nombre}`, `Correo: ${request.email}`, '', request.mensaje].join('\n')
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('contacto@prostock.cl')}&su=${encodeURIComponent(request.asunto)}&body=${encodeURIComponent(cuerpo)}`
    const gmailWindow = window.open('about:blank', '_blank')
    if (gmailWindow) gmailWindow.opener = null
    try {
      if (!apiEnabled) {
        const message = { ...request, id: createId(), fecha: formatToday(), atendido: false }
        setMessages(current => [...current, message])
      }
      form.reset()
      if (gmailWindow) gmailWindow.location.href = gmailUrl
      setNoticeType(apiEnabled ? 'warning' : 'success')
      setPreparedEmailUrl(gmailWindow ? '' : gmailUrl)
      setNotice(apiEnabled
        ? `La API conectada no incluye recepción de mensajes. ${gmailWindow ? 'Gmail se abrió con el correo preparado; debes enviarlo desde allí.' : 'Abre el correo preparado para enviar tu consulta.'}`
        : `El mensaje quedó guardado localmente. ${gmailWindow ? 'Gmail se abrió con el correo preparado; debes enviarlo desde allí.' : 'No se pudo abrir Gmail automáticamente.'}`)
    } catch (error) {
      gmailWindow?.close()
      setPreparedEmailUrl('')
      setNoticeType('danger')
      setNotice(`No se pudo enviar el mensaje: ${error.message}`)
    }
  }
  return <main className="container my-5"><h1 className="h2 mb-4 text-center">Formulario de Contacto</h1>
    {notice && <div className={`alert alert-${noticeType}`} role={noticeType === 'danger' ? 'alert' : 'status'}>
      {notice}{preparedEmailUrl && <> Puedes <a href={preparedEmailUrl} target="_blank" rel="noreferrer">abrir el correo preparado</a>.</>}
    </div>}
    <div className="row g-4"><div className="col-md-7"><div className="card shadow-sm border-0 p-4">
      <form onSubmit={submit}>{[['nombre', 'Nombre Completo', 'text', activeUser?.nombre || 'Ej: Ana López'], ['email', 'Correo Electrónico', 'email', activeUser?.email || 'correo@ejemplo.com'], ['asunto', 'Asunto', 'text', 'Consulta sobre cotización / stock']].map(([name, label, type, placeholder]) => <div className="mb-3" key={name}><label className="form-label" htmlFor={`contact-${name}`}>{label}</label><input id={`contact-${name}`} name={name} type={type} className="form-control" required defaultValue={name === 'nombre' || name === 'email' ? placeholder : undefined} placeholder={name === 'asunto' ? placeholder : undefined} /></div>)}
        <div className="mb-3"><label className="form-label" htmlFor="contact-mensaje">Mensaje</label><textarea id="contact-mensaje" name="mensaje" className="form-control" rows="4" required placeholder="Escribe tu mensaje aquí..." /></div>
        <button className="btn btn-primary w-100 fw-bold">Enviar Mensaje</button>
      </form>
    </div></div><div className="col-md-5"><div className="card shadow-sm border-0 p-4 h-100 bg-light"><h2 className="h4 mb-4">Información de Atención</h2>
      <p className="mb-3"><i className="bi bi-geo-alt-fill text-primary me-2" /><strong>Dirección:</strong> Av. Providencia 1234, Santiago, Chile</p>
      <p className="mb-3"><i className="bi bi-telephone-fill text-primary me-2" /><strong>Teléfono:</strong> +56 2 2987 6543</p>
      <p className="mb-3"><i className="bi bi-envelope-fill text-primary me-2" /><strong>Email:</strong> contacto@prostock.cl</p>
      <p className="mb-3"><i className="bi bi-clock-fill text-primary me-2" /><strong>Horario:</strong> Lunes a Viernes de 09:00 a 18:00 hrs</p>
    </div></div></div>
  </main>
}

function LoginPage() {
  const { users, setActiveUser, apiEnabled, refreshBackend, setApiError } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const submit = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    let user
    try {
      if (apiEnabled) {
        user = await loginCustomer(
          String(form.get('email')).trim().toLowerCase(),
          String(form.get('password')),
        )
      } else {
        user = users.find(item => item.email.toLowerCase() === String(form.get('email')).toLowerCase() && item.password === form.get('password'))
      }
    } catch (requestError) {
      setError(requestError.message)
      return
    }
    if (!user) {
      setError('Correo electrónico o contraseña incorrectos.')
      return
    }
    setActiveUser(user)
    if (apiEnabled) {
      try {
        await refreshBackend(user)
      } catch (requestError) {
        setApiError(`No se pudieron cargar los datos del usuario: ${requestError.message}`)
      }
    }
    navigate(location.state?.from || (user.rol === 'ADMIN' ? '/admin' : '/'), { replace: true })
  }
  return <AuthLayout title="Iniciar Sesión">
    {location.state?.notice && <div className="alert alert-success" role="status">{location.state.notice}</div>}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}><div className="mb-3"><label className="form-label" htmlFor="login-email">Correo Electrónico</label><input id="login-email" name="email" type="email" className="form-control" required placeholder="correo@duoc.cl" /></div>
      <div className="mb-3"><label className="form-label" htmlFor="login-password">Contraseña</label><input id="login-password" name="password" type="password" className="form-control" required /></div>
      <button className="btn btn-primary w-100 fw-bold py-2">Ingresar</button>
    </form><div className="text-center mt-3"><small>¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></small></div>
    {!apiEnabled && <p className="form-text mt-3 mb-0">Administrador de demostración: admin@duoc.cl / admin123</p>}
  </AuthLayout>
}

function AuthLayout({ title, children }) {
  return <><nav className="navbar navbar-dark bg-dark mb-4"><div className="container"><Link className="navbar-brand" to="/"><BrandLogo className="brand-logo" /></Link></div></nav>
    <main className="container my-5 col-md-8 col-lg-5"><div className="card shadow-sm border-0"><div className="card-body p-4"><h1 className="h3 card-title text-center mb-4">{title}</h1>{children}</div></div></main>
  </>
}

function RegisterPage() {
  const { users, setUsers, apiEnabled } = useStore()
  const [error, setError] = useState('')
  const [region, setRegion] = useState('')
  const navigate = useNavigate()
  const submit = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim().toLowerCase()
    const password = String(form.get('password'))
    if (!apiEnabled && !['duoc.cl', 'profesor.duoc.cl', 'gmail.com'].some(domain => email.endsWith(`@${domain}`))) {
      setError('Dominios aceptados: @duoc.cl, @profesor.duoc.cl, @gmail.com.')
      return
    }
    if (!apiEnabled && users.some(user => user.email.toLowerCase() === email)) {
      setError('Ya existe una cuenta con ese correo.')
      return
    }
    if (password !== form.get('confirmPassword')) {
      setError('Las contraseñas no coinciden.')
      return
    }
    const registration = {
      nombre: String(form.get('nombre')).trim(), email,
      run: String(form.get('run')).trim(), region,
      comuna: String(form.get('comuna')).trim(), direccion: String(form.get('direccion')).trim(),
      password, rol: 'CLIENTE',
    }
    if (apiEnabled) {
      try {
        await saveCustomer({
          nombre: registration.nombre,
          email: registration.email,
          run: registration.run,
          region: registration.region,
          comuna: registration.comuna,
          direccion: registration.direccion,
          contrasena: registration.password,
        })
      } catch (requestError) {
        setError(requestError.message)
        return
      }
    } else {
      setUsers([...users, { ...registration, id: createId() }])
    }
    navigate('/login', { state: { notice: '¡Cuenta creada con éxito! Inicia sesión para continuar.' } })
  }
  return <AuthLayout title="Crear una Cuenta">
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}>
      <Field name="nombre" label="Nombre Completo" placeholder="Juan Pérez" />
      <Field name="email" label="Correo Electrónico" type="email" placeholder="usuario@duoc.cl / gmail.com" />
      {!apiEnabled && <div className="form-text mb-3">Dominios aceptados: @duoc.cl, @profesor.duoc.cl, @gmail.com</div>}
      <Field name="run" label="RUN" placeholder="12.345.678-9" />
      <div className="row"><div className="col-md-6 mb-3"><label className="form-label" htmlFor="register-region">Región</label><select id="register-region" name="region" className="form-select" required value={region} onChange={event => setRegion(event.target.value)}><option value="">Seleccione una región...</option>{regions.map(item => <option key={item.region} value={item.region}>{item.region}</option>)}</select></div>
        <div className="col-md-6 mb-3"><label className="form-label" htmlFor="register-comuna">Comuna</label><select id="register-comuna" name="comuna" className="form-select" required disabled={!region} defaultValue=""><option value="">Seleccione una comuna...</option>{(regions.find(item => item.region === region)?.comunas || []).map(comuna => <option key={comuna} value={comuna}>{comuna}</option>)}</select></div></div>
      <Field name="direccion" label="Dirección de despacho" />
      <div className="row"><div className="col-md-6"><Field name="password" label="Contraseña" type="password" minLength={apiEnabled ? undefined : 4} maxLength={apiEnabled ? undefined : 10} /></div><div className="col-md-6"><Field name="confirmPassword" label="Confirmar Contraseña" type="password" /></div></div>
      <button className="btn btn-success w-100 fw-bold py-2 mt-3">Registrarse</button>
    </form><div className="text-center mt-3"><small>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></small></div>
  </AuthLayout>
}

export function Field({ name, label, type = 'text', placeholder, minLength, maxLength, required = true, defaultValue }) {
  return <div className="mb-3"><label className="form-label" htmlFor={`field-${name}`}>{label}</label><input id={`field-${name}`} name={name} type={type} className="form-control" required={required} placeholder={placeholder} minLength={minLength} maxLength={maxLength} defaultValue={defaultValue} /></div>
}

function ProfilePage() {
  const { activeUser, orders } = useStore()
  if (!activeUser) return <main className="container my-5 text-center"><h1 className="h3">Inicia sesión para ver tu perfil.</h1><Link className="btn btn-primary mt-3" to="/login">Ingresar</Link></main>
  const userOrders = orders
    .filter(order => String(order.usuarioId ?? activeUser.id) === String(activeUser.id))
    .sort((left, right) => new Date(right.fecha || 0).getTime() - new Date(left.fecha || 0).getTime())
  const initials = activeUser.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <main className="container my-5"><h1 className="h2 mb-4">Mi Perfil</h1><div className="card border-0 shadow-sm mb-4"><div className="card-body d-flex align-items-center gap-3">
    <div className="rounded-circle bg-primary text-white fs-3 fw-bold d-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>{initials}</div>
    <div><h2 className="h4 mb-1">{activeUser.nombre}</h2><span className="badge bg-secondary">{activeUser.rol === 'ADMIN' ? 'Administrador' : 'Cliente registrado'}</span></div>
  </div></div>
    <div className="card border-0 shadow-sm mb-4"><div className="card-body"><h2 className="h5">Datos de la cuenta</h2><dl className="row mb-0">
      {[
        ['Correo electrónico', activeUser.email], ['RUN', activeUser.run || 'No registrado'],
        ['Región', activeUser.region || 'No registrada'], ['Comuna', activeUser.comuna || 'No registrada'],
        ['Dirección', activeUser.direccion || 'No registrada'],
      ].map(([label, value]) => <div className="col-md-6 mb-2" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></div></div>
    <h2 className="h4">Mis boletas</h2><div className="table-responsive card border-0 shadow-sm"><table className="table table-hover mb-0"><thead className="table-light"><tr><th>Boleta</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead><tbody>
      {userOrders.length ? userOrders.map(order => <tr key={order.id}><td><Link to={`/boletas/${order.id}`}>#{order.id}</Link></td><td>{order.fecha ? new Date(order.fecha).toLocaleDateString('es-CL') : 'No disponible'}</td><td>{money(order.total)}</td><td><span className="badge bg-success">{order.estado}</span></td></tr>) : <tr><td colSpan="4" className="text-center text-muted py-4">Aún no tienes boletas registradas.</td></tr>}
    </tbody></table></div>
  </main>
}

function ReceiptDetailPage() {
  const { id } = useParams()
  const { activeUser, orders, apiEnabled } = useStore()
  const [remoteReceipt, setRemoteReceipt] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!apiEnabled || !activeUser) return
    let active = true
    getReceipt(activeUser.id, id)
      .then(receipt => {
        if (active) setRemoteReceipt(receipt)
      })
      .catch(requestError => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [activeUser, apiEnabled, id])
  if (!activeUser) return <main className="container my-5"><h1 className="h3">Inicia sesión para consultar esta boleta.</h1><Link to="/login">Ingresar</Link></main>
  const receipt = remoteReceipt || orders.find(item => String(item.id) === id)
  if (!receipt && error) return <main className="container my-5"><div className="alert alert-danger" role="alert">{error}</div><Link to="/perfil">Volver al perfil</Link></main>
  if (!receipt) return <main className="container my-5" role="status">Cargando boleta...</main>
  return <main className="container my-5">
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <h1 className="h2 mb-0">Boleta #{receipt.id}</h1>
      <Link className="btn btn-outline-secondary" to="/perfil">Volver al perfil</Link>
    </div>
    <div className="card border-0 shadow-sm"><div className="card-body">
      <p>Fecha: {receipt.fecha ? new Date(receipt.fecha).toLocaleDateString('es-CL') : 'No disponible'}</p>
      <p>Método de pago: {receipt.metodoPago || 'No informado'}</p>
      <p>Dirección: {receipt.direccion || receipt.despacho?.direccion || 'No informada'}</p>
      <div className="table-responsive"><table className="table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>
        {receipt.items.map((item, index) => <tr key={item.productoId || item.id || index}>
          <td>{item.nombre}</td><td>{item.cantidad}</td><td>{money(item.precio)}</td>
          <td>{money(item.totalLinea ?? item.precio * item.cantidad)}</td>
        </tr>)}
        {!receipt.items.length && <tr><td colSpan="4" className="text-center text-muted">La boleta no incluye detalle de productos.</td></tr>}
      </tbody></table></div>
      <p className="text-end fs-5 fw-bold mb-0">Total: {money(receipt.total)}</p>
    </div></div>
  </main>
}

function AdminLayout() {
  const { activeUser, apiEnabled } = useStore()
  const location = useLocation()
  if (activeUser?.rol !== 'ADMIN') return <main className="container my-5 text-center"><h1 className="h3">Acceso restringido a administradores.</h1><Link className="btn btn-primary mt-3" to="/login">Iniciar sesión como administrador</Link></main>
  const links = [
    ['/admin', 'Dashboard'],
    ['/admin/productos', 'Productos'],
    ['/admin/categorias', 'Categorías'],
    ['/admin/ofertas', 'Ofertas'],
    ['/admin/pedidos', 'Pedidos'],
    ['/admin/reportes', 'Reportes'],
    ['/admin/usuarios', 'Usuarios'],
    ['/admin/mensajes', 'Mensajes'],
    ['/admin/blogs', 'Blog'],
  ]
  return <><nav className="navbar navbar-expand navbar-dark bg-dark"><div className="container-fluid"><Link className="navbar-brand" to="/admin"><img src="/img/logo-prostock.svg" className="brand-logo" alt="Prostock" /> <span className="admin-label">ADMIN</span></Link><Link to="/" className="btn btn-outline-light btn-sm">Volver a la Tienda</Link></div></nav><BackendNotice />
    <div className="container-fluid my-4"><div className="row"><aside className="col-md-3 col-lg-2 mb-3"><div className="list-group shadow-sm">{links.filter(([to]) => to !== '/admin/blogs' || apiEnabled).map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `list-group-item list-group-item-action${isActive || (to !== '/admin' && location.pathname.startsWith(to)) ? ' active' : ''}`}>{label}</NavLink>)}</div></aside><section className="col-md-9 col-lg-10"><Outlet /></section></div></div>
  </>
}

function AdminCriticalProductsPage() {
  const { products } = useStore()
  const criticalProducts = getCriticalProducts(products)
  return <>
    <h1 className="h3 mb-2">Productos críticos</h1>
    <p className="text-muted mb-3">Se consideran críticos los productos con stock igual o inferior a {CRITICAL_STOCK_THRESHOLD} unidades.</p>
    <div className="card border-0 shadow-sm"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Producto</th><th>ID</th><th>Categoría</th><th>Stock actual</th></tr></thead>
        <tbody>
          {criticalProducts.map(product => <tr key={product.id}>
            <td>{product.nombre}</td><td>{product.id}</td>
            <td>{product.categoria || 'Sin categoría'}</td><td><span className="badge bg-warning text-dark">{product.stock}</span></td>
          </tr>)}
          {!criticalProducts.length && <tr><td colSpan="4" className="text-center text-muted py-4">No hay productos críticos según el umbral de stock actual.</td></tr>}
        </tbody>
      </table>
    </div></div>
  </>
}

function AdminProductReportsPage() {
  const { products, orders, apiEnabled } = useStore()
  const report = getProductReport(products, orders)
  return <>
    <h1 className="h3 mb-3">Reportes de productos</h1>
    <div className="row g-3 mb-4">
      <div className="col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><h2 className="h6 text-muted">Productos registrados</h2><p className="h3 mb-0">{report.productCount}</p></div></div></div>
      <div className="col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><h2 className="h6 text-muted">Stock disponible</h2><p className="h3 mb-0">{report.availableStock} unidades</p></div></div></div>
      <div className="col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><h2 className="h6 text-muted">Productos críticos</h2><p className="h3 mb-0">{report.criticalProducts.length}</p><Link to="/admin/productos/criticos">Ver listado</Link></div></div></div>
    </div>
    <h2 className="h5">Productos por categoría</h2>
    <div className="card border-0 shadow-sm mb-4"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Categoría</th><th>Productos</th><th>Stock disponible</th></tr></thead>
        <tbody>
          {report.categories.map(category => <tr key={category.name}><td>{category.name}</td><td>{category.products}</td><td>{category.stock}</td></tr>)}
          {!report.categories.length && <tr><td colSpan="3" className="text-center text-muted py-4">No hay productos para reportar.</td></tr>}
        </tbody>
      </table>
    </div></div>
    <h2 className="h5">Ventas por producto registradas en pedidos</h2>
    <p className="text-muted">Los importes se calculan exclusivamente desde las líneas de pedidos existentes.</p>
    {apiEnabled && <div className="alert alert-info" role="status">La API solo permite consultar boletas por cliente, no proporciona un reporte global de ventas.</div>}
    <div className="card border-0 shadow-sm"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Producto</th><th>Unidades vendidas</th><th>Total de líneas</th></tr></thead>
        <tbody>
          {report.salesByProduct.map(sale => <tr key={sale.key}><td>{sale.name}</td><td>{sale.units}</td><td>{money(sale.total)}</td></tr>)}
          {!report.salesByProduct.length && <tr><td colSpan="3" className="text-center text-muted py-4">No hay líneas de pedidos para calcular ventas por producto.</td></tr>}
        </tbody>
      </table>
    </div></div>
  </>
}

function AdminOrdersPage() {
  const { orders, users, apiEnabled } = useStore()
  if (apiEnabled) return <div className="alert alert-info" role="status">La API permite consultar las boletas del cliente autenticado, pero no incluye un listado administrativo global.</div>
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.fecha || 0).getTime()
    const dateB = new Date(b.createdAt || b.fecha || 0).getTime()
    return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA)
  })

  return <>
    <h1 className="h3 mb-3">Órdenes y Boletas</h1>
    <div className="card border-0 shadow-sm"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Detalle</th></tr></thead>
        <tbody>
          {sortedOrders.map(order => {
            const customer = users.find(user => String(user.id) === String(order.usuarioId))
            return <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{customer?.nombre || `Usuario #${order.usuarioId}`}</td>
              <td>{order.fecha || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL') : 'No disponible')}</td>
              <td><span className="badge bg-success">{order.estado || 'No disponible'}</span></td>
              <td>{money(order.total)}</td>
              <td><Link className="btn btn-sm btn-outline-primary" to={`/admin/pedidos/${order.id}`}>Ver pedido</Link></td>
            </tr>
          })}
          {!sortedOrders.length && <tr><td colSpan="6" className="text-center text-muted py-4">No hay pedidos registrados.</td></tr>}
        </tbody>
      </table>
    </div></div>
  </>
}

function AdminOrderDetailPage() {
  const { apiEnabled, orders, users } = useStore()
  const { id } = useParams()
  const order = orders.find(item => String(item.id) === id)
  if (apiEnabled) return <div className="alert alert-info" role="status">Las boletas de este microservicio se consultan desde el perfil del cliente autenticado.</div>
  if (!order) return <><h1 className="h3">Pedido no encontrado.</h1><Link to="/admin/pedidos">Volver a órdenes y boletas</Link></>
  const customer = users.find(user => String(user.id) === String(order.usuarioId))
  return <>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div><h1 className="h3 mb-1">Detalle del pedido #{order.id}</h1><p className="text-muted mb-0">Resumen del pedido con los datos disponibles.</p></div>
      <Link to="/admin/pedidos" className="btn btn-outline-secondary">Volver a órdenes</Link>
    </div>
    <OrderDetails order={order} customer={customer} />
  </>
}

function OrderDetails({ order, customer }) {
  const shipping = order.despacho || {}
  const address = [shipping.direccion, shipping.comuna, shipping.region].filter(Boolean).join(', ')
  return <section className="card border-0 shadow-sm">
    <div className="card-body">
      <h2 className="h5">Datos del cliente</h2>
      <p className="mb-1">{customer?.nombre || shipping.nombre || `Usuario #${order.usuarioId}`}</p>
      {shipping.telefono && <p className="mb-1">Teléfono: {shipping.telefono}</p>}
      {address && <p className="mb-4">Dirección: {address}</p>}
      <h2 className="h5">Productos</h2>
      <div className="table-responsive"><table className="table table-hover align-middle">
        <thead><tr><th>Producto</th><th>Código</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th></tr></thead>
        <tbody>
          {(order.items || []).map((item, index) => <tr key={item.id || item.productoId || index}>
            <td>{item.nombre || 'Producto sin nombre'}</td>
            <td>{item.codigo || '—'}</td>
            <td>{item.cantidad}</td>
            <td>{money(item.precioConIva ?? withTax(item.precio))}</td>
            <td>{money(item.totalLinea ?? withTax(item.precio) * item.cantidad)}</td>
          </tr>)}
          {!order.items?.length && <tr><td colSpan="5" className="text-center text-muted">El pedido no contiene productos.</td></tr>}
        </tbody>
      </table></div>
      {shipping.observaciones && <p><strong>Observaciones:</strong> {shipping.observaciones}</p>}
      <div className="ms-auto" style={{ maxWidth: 320 }}>
        <div className="d-flex justify-content-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div className="d-flex justify-content-between"><span>IVA</span><span>{money(order.iva)}</span></div>
        <div className="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>{money(order.total)}</span></div>
      </div>
    </div>
  </section>
}

function AdminDashboard() {
  const { products, users, orders, messages, apiEnabled } = useStore()
  const sales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const stats = [
    ['Productos Totales', products.length, 'primary', 'box-seam'],
    ['Usuarios Registrados', users.length, 'success', 'people'],
    ['Pedidos', orders.length, 'info', 'bag-check'],
    ['Mensajes pendientes', messages.filter(message => !message.atendido).length, 'secondary', 'envelope'],
    ['Ventas totales', money(sales), 'dark', 'cash-stack'],
  ]
  return <><div className="d-flex justify-content-between align-items-center mb-4"><h1 className="h3 mb-0">Panel de Control</h1><Link to="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo Producto</Link></div>
  {apiEnabled && <div className="alert alert-info" role="status">El microservicio no expone métricas globales de boletas ni de mensajes.</div>}
  <div className="row g-3">
    {stats.map(([label, value, color, icon]) => <div className="col-md-6 col-xl-4" key={label}><div className={`card border-0 shadow-sm bg-${color} ${color === 'info' ? 'text-dark' : 'text-white'} p-3`}><div className="d-flex justify-content-between align-items-center"><div><h2 className="h6 text-uppercase">{label}</h2><p className="h2 mb-0">{value}</p></div><i className={`bi bi-${icon} fs-1`} /></div></div></div>)}
  </div></>
}

function AdminProductsPage() {
  const { products, setProducts, apiEnabled } = useStore()
  const sorted = [...products].sort((a, b) => Number(a.id) - Number(b.id))
  const remove = async id => {
    if (!window.confirm('¿Seguro de eliminar este producto?')) return
    try {
      if (apiEnabled) await removeCatalogProduct(id)
      setProducts(current => deleteProduct(current, id))
    } catch (error) {
      window.alert(`No se pudo eliminar el producto: ${error.message}`)
    }
  }
  return <><div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3 m-0">Gestión de Productos</h1><Link to="/admin/productos/nuevo" className="btn btn-primary"><i className="bi bi-plus-circle me-1" />Nuevo Producto</Link></div>
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0">    <thead className="table-dark"><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>
      {sorted.map(product => <tr key={product.id}><td>{product.id}</td><td>{product.nombre}</td><td>{product.categoria}</td><td>{money(withTax(product.precio))} <small>IVA incl.</small></td><td>{product.stock}</td><td><Link to={`/admin/productos/${product.id}`} className="btn btn-sm btn-warning me-1" aria-label={`Editar ${product.nombre}`}><i className="bi bi-pencil" /></Link><button className="btn btn-sm btn-danger" onClick={() => remove(product.id)} aria-label={`Eliminar ${product.nombre}`}><i className="bi bi-trash" /></button></td></tr>)}
      {!sorted.length && <tr><td colSpan="6" className="text-center py-4">No hay productos.</td></tr>}
    </tbody></table></div></div>
  </>
}

function AdminCategoriesPage() {
  const { categories, setCategories, products, offers, apiEnabled } = useStore()
  const [error, setError] = useState('')
  if (apiEnabled) return <div className="alert alert-info" role="status">La administración de categorías está disponible en el modo de demostración. El backend actual guarda la categoría como parte del producto y no expone un servicio CRUD de categorías.</div>
  const remove = id => {
    const category = categories.find(item => String(item.id) === String(id))
    if (products.some(product => product.categoria === category?.nombre) || offers.some(offer => offer.categoria === category?.nombre)) {
      setError('No se puede eliminar una categoría que todavía está en uso por productos u ofertas.')
      return
    }
    try {
      mockDatabase.categories.remove(id)
      setCategories(mockDatabase.categories.list())
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  return <><div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3">Gestión de Categorías</h1><Link to="/admin/categorias/nueva" className="btn btn-primary">+ Nueva categoría</Link></div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Categoría</th><th>Productos</th><th>Acciones</th></tr></thead><tbody>
      {categories.map(category => <tr key={category.id}><td>{category.nombre}</td><td>{products.filter(product => product.categoria === category.nombre).length}</td><td><Link className="btn btn-sm btn-warning me-1" to={`/admin/categorias/${category.id}`}>Editar</Link><button className="btn btn-sm btn-danger" onClick={() => remove(category.id)}>Eliminar</button></td></tr>)}
      {!categories.length && <tr><td colSpan="3" className="text-center py-4">No hay categorías.</td></tr>}
    </tbody></table></div></div>
  </>
}

function AdminCategoryForm() {
  const { id } = useParams()
  const { categories, setCategories, products, setProducts, offers, setOffers, apiEnabled } = useStore()
  const navigate = useNavigate()
  const current = categories.find(category => String(category.id) === id)
  const [error, setError] = useState('')
  if (apiEnabled) return <div className="alert alert-info" role="status">La administración de categorías está disponible solo en el modo de demostración; el backend no expone un servicio CRUD de categorías.</div>
  const submit = event => {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('nombre').trim()
    if (categories.some(category => category.nombre.toLowerCase() === name.toLowerCase() && String(category.id) !== id)) {
      setError('Ya existe una categoría con ese nombre.')
      return
    }
    try {
      const saved = current
        ? mockDatabase.categories.update(current.id, { nombre: name })
        : mockDatabase.categories.create({ nombre: name })
      if (current) setProducts(products.map(product => product.categoria === current.nombre ? { ...product, categoria: saved.nombre } : product))
      if (current) setOffers(offers.map(offer => offer.categoria === current.nombre ? { ...offer, categoria: saved.nombre } : offer))
      setCategories(mockDatabase.categories.list())
      navigate('/admin/categorias')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  if (id && !current) return <><h1 className="h3">Categoría no encontrada.</h1><Link to="/admin/categorias">Volver a categorías</Link></>
  return <div className="card border-0 shadow-sm"><div className="card-body p-4"><h1 className="h4">{current ? 'Editar categoría' : 'Nueva categoría'}</h1>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}><Field name="nombre" label="Nombre de categoría" defaultValue={current?.nombre} />
      <div className="d-flex justify-content-between"><Link className="btn btn-outline-secondary" to="/admin/categorias">Cancelar</Link><button className="btn btn-success">Guardar categoría</button></div>
    </form>
  </div></div>
}

function AdminOffersPage() {
  const { offers, setOffers, apiEnabled } = useStore()
  const [error, setError] = useState('')
  const remove = id => {
    if (!window.confirm('¿Eliminar esta oferta?')) return
    try {
      mockDatabase.offers.remove(id)
      setOffers(mockDatabase.offers.list())
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  if (apiEnabled) return <div className="alert alert-info" role="status">La gestión de ofertas está disponible en el modo de demostración. Los microservicios actuales no administran promociones ni aplican descuentos.</div>
  return <><div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3">Gestión de Ofertas</h1><Link to="/admin/ofertas/nueva" className="btn btn-primary">+ Nueva oferta</Link></div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Oferta</th><th>Categoría</th><th>Descuento</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {offers.map(offer => <tr key={offer.id}><td>{offer.titulo}</td><td>{offer.categoria}</td><td>{offer.descuento}%</td><td><span className={`badge ${offer.active ? 'bg-success' : 'bg-secondary'}`}>{offer.active ? 'Activa' : 'Inactiva'}</span></td><td><Link className="btn btn-sm btn-warning me-1" to={`/admin/ofertas/${offer.id}`}>Editar</Link><button className="btn btn-sm btn-danger" onClick={() => remove(offer.id)}>Eliminar</button></td></tr>)}
      {!offers.length && <tr><td colSpan="5" className="text-center py-4">No hay ofertas.</td></tr>}
    </tbody></table></div></div>
  </>
}

function AdminOfferForm() {
  const { id } = useParams()
  const { offers, setOffers, categories, apiEnabled } = useStore()
  const navigate = useNavigate()
  const current = offers.find(offer => String(offer.id) === id)
  const [error, setError] = useState('')
  if (apiEnabled) return <div className="alert alert-info" role="status">La gestión de ofertas está disponible únicamente en el modo de demostración.</div>
  const submit = event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      titulo: String(form.get('titulo')).trim(),
      categoria: String(form.get('categoria')),
      descuento: Number(form.get('descuento')),
      active: form.get('active') === 'true',
    }
    if (!payload.categoria || payload.descuento < 1 || payload.descuento > 90) {
      setError('Selecciona una categoría e ingresa un descuento entre 1 y 90%.')
      return
    }
    if (payload.active && offers.some(offer => offer.active && offer.categoria === payload.categoria && String(offer.id) !== id)) {
      setError('Ya existe una oferta activa para esta categoría.')
      return
    }
    try {
      if (current) mockDatabase.offers.update(current.id, payload)
      else mockDatabase.offers.create(payload)
      setOffers(mockDatabase.offers.list())
      navigate('/admin/ofertas')
    } catch (requestError) {
      setError(requestError.message)
    }
  }
  if (id && !current) return <><h1 className="h3">Oferta no encontrada.</h1><Link to="/admin/ofertas">Volver a ofertas</Link></>
  return <div className="card border-0 shadow-sm"><div className="card-body p-4"><h1 className="h4">{current ? 'Editar oferta' : 'Nueva oferta'}</h1>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}><Field name="titulo" label="Nombre de la oferta" defaultValue={current?.titulo} />
      <div className="mb-3"><label className="form-label" htmlFor="offer-category">Categoría</label><select id="offer-category" name="categoria" className="form-select" required defaultValue={current?.categoria || ''}><option value="">Selecciona una categoría</option>{categories.map(category => <option key={category.id} value={category.nombre}>{category.nombre}</option>)}</select></div>
      <Field name="descuento" label="Descuento (%)" type="number" min="1" max="90" defaultValue={current?.descuento || 10} />
      <div className="mb-3"><label className="form-label" htmlFor="offer-active">Estado</label><select id="offer-active" name="active" className="form-select" defaultValue={String(current?.active ?? true)}><option value="true">Activa</option><option value="false">Inactiva</option></select></div>
      <div className="d-flex justify-content-between"><Link className="btn btn-outline-secondary" to="/admin/ofertas">Cancelar</Link><button className="btn btn-success">Guardar oferta</button></div>
    </form>
  </div></div>
}

function AdminReportsPage() {
  const { products, orders, users, messages, categories, apiEnabled } = useStore()
  if (apiEnabled) return <div className="alert alert-info" role="status">La API no incluye endpoints de reportes administrativos globales.</div>
  const report = getGeneralReport({ products, users, orders, messages, categories })
  const stats = [
    ['Productos', report.productCount, 'primary'],
    ['Usuarios', report.userCount, 'success'],
    ['Pedidos', report.orderCount, 'info'],
    ['Ventas registradas', money(report.salesTotal), 'dark'],
    ['Productos críticos', report.criticalProductCount, 'warning'],
    ['Categorías', report.categoryCount, 'secondary'],
    ['Mensajes registrados', report.messageCount, 'primary'],
  ]
  return <>
    <h1 className="h3 mb-3">Reportes Generales</h1>
    <div className="row g-3 mb-4">
      {stats.map(([label, value, color]) => <div className="col-md-6 col-xl-4" key={label}>
        <div className={`card border-0 shadow-sm h-100 bg-${color} ${color === 'info' || color === 'warning' ? 'text-dark' : 'text-white'} p-3`}>
          <h2 className="h6 text-uppercase">{label}</h2><p className="h3 mb-0">{value}</p>
        </div>
      </div>)}
    </div>
    <h2 className="h5">Pedidos por estado</h2>
    <div className="card border-0 shadow-sm mb-4"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Estado</th><th>Pedidos</th></tr></thead>
        <tbody>
          {report.ordersByStatus.map(item => <tr key={item.status}><td>{item.status}</td><td>{item.count}</td></tr>)}
          {!report.ordersByStatus.length && <tr><td colSpan="2" className="text-center text-muted py-4">No hay pedidos registrados.</td></tr>}
        </tbody>
      </table>
    </div></div>
    <h2 className="h5">Productos por categoría</h2>
    <div className="card border-0 shadow-sm"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Categoría</th><th>Productos</th><th>Stock disponible</th></tr></thead>
        <tbody>
          {report.productsByCategory.map(item => <tr key={item.name}><td>{item.name}</td><td>{item.products}</td><td>{item.stock}</td></tr>)}
          {!report.productsByCategory.length && <tr><td colSpan="3" className="text-center text-muted py-4">No hay productos para resumir por categoría.</td></tr>}
        </tbody>
      </table>
    </div></div>
  </>
}

function AdminProductForm() {
  const { id } = useParams()
  const { products, categories, setProducts, apiEnabled } = useStore()
  const navigate = useNavigate()
  const product = products.find(item => String(item.id) === id)
  const availableCategories = getAvailableCategories(categories, products)
  const [error, setError] = useState('')
  const submit = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const code = String(form.get('codigo')).trim().toUpperCase()
    if (products.some(item => item.codigo.toUpperCase() === code && String(item.id) !== id)) {
      setError('Ya existe un producto con ese código.')
      return
    }
    const images = String(form.get('imagenes')).split('\n').map(image => image.trim()).filter(Boolean)
    if (!images.length) {
      setError('Debes ingresar al menos una imagen.')
      return
    }
    const payload = {
      codigo: code, nombre: String(form.get('nombre')).trim(),
      categoria: String(form.get('categoria')).trim(), precio: Number(form.get('precio')),
      stock: Number(form.get('stock')), imagenes: images, imagen: images[0],
    }
    const next = { ...payload, id: product?.id || createId() }
    if (apiEnabled) {
      try {
        const saved = await saveCatalogProduct(payload, product?.id)
        setProducts(current => product
          ? updateProduct(current, product.id, saved)
          : createProduct(current, saved))
        navigate('/admin/productos')
      } catch (requestError) {
        setError(requestError.message)
      }
      return
    }
    setProducts(product
      ? updateProduct(products, product.id, next)
      : createProduct(products, next))
    navigate('/admin/productos')
  }
  if (id && !product) return <><h1 className="h3">Producto no encontrado.</h1><Link to="/admin/productos">Volver a productos</Link></>
  return <div className="card shadow-sm border-0"><div className="card-body p-4"><h1 className="h4 mb-4">{product ? 'Editar Producto' : 'Nuevo Producto'}</h1>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}>
      <Field name="codigo" label="Código" defaultValue={product?.codigo} />
      <Field name="nombre" label="Nombre" defaultValue={product?.nombre} />
      <div className="mb-3"><label className="form-label" htmlFor="product-category">Categoría</label><select id="product-category" name="categoria" className="form-select" required defaultValue={product?.categoria || ''}>
        <option value="">Seleccione...</option>
        {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
      </select></div>
      <div className="row"><div className="col-md-6"><Field name="precio" label="Precio neto" type="number" min="1" defaultValue={product?.precio} /></div><div className="col-md-6"><Field name="stock" label="Stock" type="number" min="0" defaultValue={product?.stock} /></div></div>
      <div className="mb-3"><label className="form-label" htmlFor="product-images">Imágenes (una URL por línea)</label><textarea className="form-control" id="product-images" name="imagenes" required rows="3" defaultValue={product?.imagenes?.join('\n') || product?.imagen || ''} /></div>
      <div className="d-flex justify-content-between"><Link to="/admin/productos" className="btn btn-outline-secondary">Cancelar</Link><button className="btn btn-success">Guardar Producto</button></div>
    </form>
  </div></div>
}

function AdminUsersPage() {
  const { users, setUsers, activeUser, apiEnabled } = useStore()
  const remove = async id => {
    if (String(activeUser.id) === String(id)) {
      window.alert('No puedes eliminar la cuenta con la que iniciaste sesión.')
      return
    }
    if (!window.confirm('¿Seguro de eliminar este usuario?')) return
    try {
      if (apiEnabled) await deleteCustomer(id)
      setUsers(current => current.filter(user => user.id !== id))
    } catch (error) {
      window.alert(`No se pudo eliminar el usuario: ${error.message}`)
    }
  }
  return <><div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3">Gestión de Usuarios</h1><Link to="/admin/usuarios/nuevo" className="btn btn-primary">+ Nuevo Usuario</Link></div>
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>
      {users.map(user => <tr key={user.id}><td>{user.nombre}</td><td>{user.email}</td><td><span className={`badge ${user.rol === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}`}>{user.rol}</span></td><td className="text-nowrap"><Link to={`/admin/usuarios/${user.id}/compras`} className="btn btn-sm btn-outline-primary me-1">Compras</Link><Link to={`/admin/usuarios/${user.id}`} className="btn btn-sm btn-warning me-1" aria-label={`Editar ${user.nombre}`}><i className="bi bi-pencil" /></Link><button className="btn btn-sm btn-danger" onClick={() => remove(user.id)} aria-label={`Eliminar ${user.nombre}`}><i className="bi bi-trash" /></button></td></tr>)}
    </tbody></table></div></div>
  </>
}

function AdminUserPurchaseHistory() {
  const { id } = useParams()
  const { users, orders } = useStore()
  const user = users.find(item => String(item.id) === id)
  if (!user) return <><h1 className="h3">Usuario no encontrado.</h1><Link to="/admin/usuarios">Volver a usuarios</Link></>
  const userOrders = orders
    .filter(order => String(order.usuarioId) === String(user.id))
    .sort((a, b) => new Date(b.createdAt || b.fecha || 0).getTime() - new Date(a.createdAt || a.fecha || 0).getTime())

  return <>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div><h1 className="h3 mb-1">Historial de compras</h1><p className="text-muted mb-0">{user.nombre} · {user.email}</p></div>
      <Link to="/admin/usuarios" className="btn btn-outline-secondary">Volver a usuarios</Link>
    </div>
    <div className="card border-0 shadow-sm"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-dark"><tr><th>Pedido</th><th>Fecha</th><th>Estado</th><th>Productos</th><th>Total</th><th>Detalle</th></tr></thead>
        <tbody>
          {userOrders.map(order => <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{order.fecha || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL') : 'No disponible')}</td>
            <td><span className="badge bg-success">{order.estado || 'No disponible'}</span></td>
            <td>{order.items?.length || 0}</td>
            <td>{money(order.total)}</td>
            <td><Link className="btn btn-sm btn-outline-primary" to={`/admin/pedidos/${order.id}`}>Ver pedido</Link></td>
          </tr>)}
          {!userOrders.length && <tr><td colSpan="6" className="text-center text-muted py-4">Este usuario no tiene compras registradas.</td></tr>}
        </tbody>
      </table>
    </div></div>
  </>
}

function AdminUserForm() {
  const { id } = useParams()
  const { users, setUsers, activeUser, setActiveUser, apiEnabled } = useStore()
  const navigate = useNavigate()
  const listedUser = users.find(item => String(item.id) === id)
  const [customerLookup, setCustomerLookup] = useState({ id: '', user: null, error: '' })
  useEffect(() => {
    if (!apiEnabled || !id || listedUser) return
    let active = true
    getCustomer(id)
      .then(customer => {
        if (active) setCustomerLookup({ id, user: customer, error: '' })
      })
      .catch(error => {
        if (active) setCustomerLookup({ id, user: null, error: error.message })
      })
    return () => { active = false }
  }, [apiEnabled, id, listedUser])
  const user = listedUser || (customerLookup.id === id ? customerLookup.user : null)
  const [error, setError] = useState('')
  const submit = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim().toLowerCase()
    const password = String(form.get('password'))
    if (users.some(item => item.email.toLowerCase() === email && String(item.id) !== id)) {
      setError('Ya existe un usuario con ese correo.')
      return
    }
    if (!user && !password) {
      setError('Debes definir una contraseña para el nuevo usuario.')
      return
    }
    if (password && password !== form.get('confirmPassword')) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!apiEnabled && !['duoc.cl', 'profesor.duoc.cl', 'gmail.com'].some(domain => email.endsWith(`@${domain}`))) {
      setError('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com.')
      return
    }
    const userPayload = {
      nombre: String(form.get('nombre')).trim(),
      email, rol: String(form.get('rol')),
    }
    if (password) userPayload.password = password
    if (apiEnabled) {
      try {
        const saved = await saveCustomer(userPayload, user?.id)
        setUsers(current => user
          ? current.map(item => item.id === user.id ? saved : item)
          : [...current, saved])
        if (String(activeUser.id) === String(saved.id)) setActiveUser(saved)
        navigate('/admin/usuarios')
      } catch (requestError) {
        setError(requestError.message)
      }
      return
    }
    const updatedUser = { ...user, ...userPayload, id: user?.id || createId() }
    setUsers(user ? users.map(item => item.id === user.id ? updatedUser : item) : [...users, updatedUser])
    if (activeUser.id === updatedUser.id) setActiveUser(updatedUser)
    navigate('/admin/usuarios')
  }
  if (id && !user && apiEnabled && customerLookup.id !== id) return <p role="status">Buscando cliente...</p>
  if (id && !user) return <><h1 className="h3">Cliente no encontrado.</h1>{customerLookup.error && <p role="alert">{customerLookup.error}</p>}<Link to="/admin/usuarios">Volver a clientes</Link></>
  return <div className="card shadow-sm border-0"><div className="card-body p-4"><h1 className="h4 mb-4">Administrar Usuario</h1>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}><Field name="nombre" label="Nombre Completo" defaultValue={user?.nombre} /><Field name="email" label="Correo Electrónico" type="email" defaultValue={user?.email} />
      <div className="row"><div className="col-md-6"><Field name="password" label="Contraseña" type="password" minLength={apiEnabled ? undefined : 4} maxLength={apiEnabled ? undefined : 10} required={!user} /></div><div className="col-md-6"><Field name="confirmPassword" label="Confirmar contraseña" type="password" required={!user} /></div></div>
      <div className="mb-3"><label className="form-label" htmlFor="user-role">Rol del Sistema</label><select id="user-role" name="rol" className="form-select" defaultValue={user?.rol || 'CLIENTE'}><option value="CLIENTE">CLIENTE</option><option value="ADMIN">ADMIN</option></select></div>
      <div className="d-flex justify-content-between"><Link to="/admin/usuarios" className="btn btn-outline-secondary">Cancelar</Link><button className="btn btn-success">Guardar Usuario</button></div>
    </form>
  </div></div>
}

function AdminMessagesPage() {
  const { messages, setMessages, apiEnabled } = useStore()
  if (apiEnabled) return <div className="alert alert-info" role="status">La API del microservicio no incluye administración de mensajes de contacto.</div>
  const changeAttended = async message => {
    const attended = !message.atendido
    try {
      const updated = { ...message, atendido: attended }
      setMessages(current => current.map(item => item.id === message.id ? updated : item))
    } catch (error) {
      window.alert(`No se pudo actualizar el mensaje: ${error.message}`)
    }
  }
  const removeMessage = async id => {
    if (!window.confirm('¿Seguro de eliminar este mensaje?')) return
    try {
      setMessages(current => current.filter(item => item.id !== id))
    } catch (error) {
      window.alert(`No se pudo eliminar el mensaje: ${error.message}`)
    }
  }
  return <><h1 className="h3 mb-3">Mensajes de Contacto</h1><div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Nombre</th><th>Correo</th><th>Asunto / Mensaje</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
    {messages.map(message => <tr key={message.id}><td>{message.nombre}</td><td>{message.email}</td><td><strong>{message.asunto}</strong><p className="mb-0 small text-muted">{message.mensaje}</p><small className="text-muted">{message.fecha}</small></td><td><span className={`badge ${message.atendido ? 'bg-success' : 'bg-warning text-dark'}`}>{message.atendido ? 'Atendido' : 'Pendiente'}</span></td><td className="text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => changeAttended(message)}>{message.atendido ? 'Reabrir' : 'Atendido'}</button><button className="btn btn-sm btn-outline-danger" onClick={() => removeMessage(message.id)} aria-label="Eliminar mensaje"><i className="bi bi-trash" /></button></td></tr>)}
    {!messages.length && <tr><td colSpan="5" className="text-center py-4 text-muted">No hay mensajes.</td></tr>}
  </tbody></table></div></div>
  </>
}

function NotFoundPage() {
  return <main className="container my-5 text-center"><h1 className="h2">Página no encontrada</h1><p className="text-muted">La dirección solicitada no existe.</p><Link to="/" className="btn btn-primary">Ir al inicio</Link></main>
}

function PageTitle() {
  const location = useLocation()
  useEffect(() => {
    const title = pageTitles[location.pathname]
      || (location.pathname.startsWith('/admin') ? 'Administración' : null)
      || (location.pathname.startsWith('/producto/') ? 'Detalle de Producto' : null)
      || (location.pathname.startsWith('/categorias/') ? 'Productos por categoría' : null)
      || (location.pathname.startsWith('/pedidos/') ? 'Detalle del pedido' : null)
      || (location.pathname.startsWith('/blogs/') ? 'Artículo del Blog' : null)
      || 'Prostock'
    document.title = `${title} | Prostock`
  }, [location.pathname])
  return null
}

function LegacyPathRedirects() {
  const location = useLocation()
  const oldPaths = {
    '/productos.html': '/productos', '/carrito.html': '/carrito', '/nosotros.html': '/nosotros',
    '/blogs.html': '/blogs', '/contacto.html': '/contacto', '/login.html': '/login',
    '/registro.html': '/registro', '/perfil.html': '/perfil',
    '/detalle-producto.html': `/producto/${new URLSearchParams(location.search).get('id') || ''}`,
    '/detalle-blog.html': '/blogs/insumos', '/detalle-blog-2.html': '/blogs/inventario',
    '/admin/index.html': '/admin', '/admin/productos-listar.html': '/admin/productos',
    '/admin/producto-form.html': `/admin/productos/${new URLSearchParams(location.search).get('id') || 'nuevo'}`,
    '/admin/usuarios-listar.html': '/admin/usuarios',
    '/admin/usuario-form.html': `/admin/usuarios/${new URLSearchParams(location.search).get('id') || 'nuevo'}`,
    '/admin/mensajes-listar.html': '/admin/mensajes',
  }
  const redirect = oldPaths[location.pathname]
  return redirect ? <Navigate to={redirect} replace /> : null
}

export default function App() {
  return <StoreProvider><BrowserRouter><LegacyPathRedirects /><PageTitle /><Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="productos" element={<ProductsPage />} />
      <Route path="categorias" element={<CategoriesPage />} />
      <Route path="ofertas" element={<OffersPage />} />
      <Route path="producto/:id" element={<ProductDetailPage />} />
      <Route path="carrito" element={<CartPage />} />
      <Route path="nosotros" element={<AboutPage />} />
      <Route path="blogs" element={<BlogPage />} />
      <Route path="blogs/:slug" element={<BlogDetailPage />} />
      <Route path="contacto" element={<ContactPage />} />
      <Route path="perfil" element={<ProfilePage />} />
    </Route>
    <Route path="login" element={<LoginPage />} />
    <Route path="registro" element={<RegisterPage />} />
    <Route path="compra/resultado" element={<CheckoutResultPage success />} />
    <Route path="compra/fallo" element={<CheckoutResultPage success={false} />} />
    <Route path="boletas/:id" element={<ReceiptDetailPage />} />
    <Route path="admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="pedidos" element={<AdminOrdersPage />} />
      <Route path="pedidos/:id" element={<AdminOrderDetailPage />} />
      <Route path="productos" element={<AdminProductsPage />} />
      <Route path="productos/criticos" element={<AdminCriticalProductsPage />} />
      <Route path="productos/reportes" element={<AdminProductReportsPage />} />
      <Route path="productos/nuevo" element={<AdminProductForm />} />
      <Route path="productos/:id" element={<AdminProductForm />} />
      <Route path="categorias" element={<AdminCategoriesPage />} />
      <Route path="categorias/nueva" element={<AdminCategoryForm />} />
      <Route path="categorias/:id" element={<AdminCategoryForm />} />
      <Route path="ofertas" element={<AdminOffersPage />} />
      <Route path="ofertas/nueva" element={<AdminOfferForm />} />
      <Route path="ofertas/:id" element={<AdminOfferForm />} />
      <Route path="reportes" element={<AdminReportsPage />} />
      <Route path="usuarios" element={<AdminUsersPage />} />
      <Route path="usuarios/nuevo" element={<AdminUserForm />} />
      <Route path="usuarios/:id/compras" element={<AdminUserPurchaseHistory />} />
      <Route path="usuarios/:id" element={<AdminUserForm />} />
      <Route path="mensajes" element={<AdminMessagesPage />} />
      <Route path="blogs" element={<AdminBlogsPage />} />
      <Route path="blogs/nuevo" element={<AdminBlogForm />} />
      <Route path="blogs/:id" element={<AdminBlogForm />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></BrowserRouter></StoreProvider>
}
