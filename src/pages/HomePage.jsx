import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { useStore } from '../store/StoreContext.jsx'

export default function HomePage() {
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
