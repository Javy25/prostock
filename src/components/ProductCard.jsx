import { Link } from 'react-router-dom'
import { addProductToCart } from '../data/cart.js'
import { useStore } from '../store/StoreContext.jsx'

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`
const withTax = value => Math.round(Number(value) * 1.19)

export default function ProductCard({ product }) {
  const { cart, setCart } = useStore()
  const addToCart = () => {
    const item = cart.find(entry => entry.id === product.id)
    if ((item?.cantidad || 0) >= product.stock) {
      window.alert(`Solo hay ${product.stock} unidades disponibles.`)
      return
    }
    setCart(current => addProductToCart(current, product))
  }

  return (
    <article className="col-sm-6 col-lg-4 col-xl-3 mb-4">
      <div className="card h-100 shadow-sm border-0 product-card">
        <Link to={`/producto/${product.id}`} aria-label={`Ver ${product.nombre}`}>
          <img src={product.imagen} className="card-img-top" alt={product.nombre} style={{ height: 180, objectFit: 'cover' }} />
        </Link>
        <div className="card-body d-flex flex-column">
          <small className="text-muted fw-bold">CÓD: {product.codigo}</small>
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
