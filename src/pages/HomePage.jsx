import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { useStore } from '../store/StoreContext.jsx'
import { money, withTax } from '../utils/storeFormatters.js'

export default function HomePage() {
  const { products } = useStore()
  const categories = [...new Set(products.map(product => product.categoria))]
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const sponsoredTrack = useRef(null)
  const shownProducts = products.filter(product => {
    const matchesSearch = `${product.nombre} ${product.codigo}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (!category || product.categoria === category)
  })
  const sponsoredProducts = products.slice(0, 8)
  const scrollSponsored = direction => sponsoredTrack.current?.scrollBy({ left: direction * 300, behavior: 'smooth' })

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
          <button type="button" role="tab" aria-selected={category === ''} className={`home-category-tab${category === '' ? ' active' : ''}`} onClick={() => setCategory('')}>Todos</button>
          {categories.map(item => <button type="button" role="tab" aria-selected={category === item} className={`home-category-tab${category === item ? ' active' : ''}`} key={item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </section>
      <section className="container pb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h3 fw-bold mb-0">Productos destacados</h2>
          <Link to="/productos">Ver catálogo <i className="bi bi-arrow-right" /></Link>
        </div>
        <div className="row g-2 mb-4">
          <div className="col-md-7">
            <input
              type="search"
              className="form-control"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por nombre o código..."
              aria-label="Buscar productos por nombre o código"
            />
          </div>
          <div className="col-md-5">
            <select
              className="form-select"
              value={category}
              onChange={event => setCategory(event.target.value)}
              aria-label="Filtrar productos por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="row">{shownProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <section className="sponsored-section mb-5" aria-label="Productos patrocinados">
        <div className="container">
          <div className="sponsored-heading">
            <div>
              <p className="text-primary text-uppercase small fw-bold mb-1">Recomendados para ti</p>
              <h2 className="h3 mb-0">Productos patrocinados</h2>
            </div>
            <div className="sponsored-controls">
              <button type="button" className="sponsored-arrow" aria-label="Productos anteriores" onClick={() => scrollSponsored(-1)}>
                <i className="bi bi-chevron-left" />
              </button>
              <button type="button" className="sponsored-arrow" aria-label="Productos siguientes" onClick={() => scrollSponsored(1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
          <div className="sponsored-track" ref={sponsoredTrack}>
            {sponsoredProducts.map(product => (
              <article className="sponsored-card" key={product.id}>
                <Link to={`/producto/${product.id}`} className="sponsored-image-link">
                  <ProductImage src={product.imagen} alt={product.nombre} />
                </Link>
                <div className="sponsored-card-body">
                  <span className="sponsored-category">{product.categoria}</span>
                  <h3><Link to={`/producto/${product.id}`}>{product.nombre}</Link></h3>
                  <strong>{money(withTax(product.precio))} IVA incl.</strong>
                  <span className="sponsored-provider">Prostock</span>
                </div>
              </article>
            ))}
          </div>
        </div>
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
