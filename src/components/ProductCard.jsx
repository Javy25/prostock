import { Link } from 'react-router-dom'
import { addProductToCart } from '../data/cart.js'
import { getOfferCartProduct, getOfferPrice, isProductOnOffer } from '../data/offers.js'
import { useStore } from '../store/StoreContext.jsx'
import { money, withTax } from '../utils/storeFormatters.js'

export default function ProductCard({ product }) {
  const { cart, setCart } = useStore()
  const addToCart = () => {
    const item = cart.find(entry => entry.id === product.id)
    if ((item?.cantidad || 0) >= product.stock) {
      window.alert(`Solo hay ${product.stock} unidades disponibles.`)
      return
    }
    setCart(current => addProductToCart(current, getOfferCartProduct(product)))
  }
  const onOffer = isProductOnOffer(product)
  const currentPrice = getOfferPrice(product)

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
          {onOffer && <span className="badge bg-danger align-self-start mt-2">En oferta</span>}
          <div className="mt-2">
            {onOffer && <div className="text-muted small text-decoration-line-through">{money(withTax(product.precio))} precio original</div>}
            <strong className={`${onOffer ? 'text-danger' : 'text-primary'}`}>{money(withTax(currentPrice))} IVA incl.</strong>
          </div>
          <button className="btn btn-primary mt-auto mt-3" onClick={addToCart} disabled={product.stock <= 0}>
            <i className="bi bi-cart-plus me-1" />Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  )
}
