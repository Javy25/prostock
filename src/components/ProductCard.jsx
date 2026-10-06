import { Link } from 'react-router-dom'
import { addProductToCart } from '../data/cart.js'
import { getOfferCartProduct, getOfferPrice, isProductOnOffer } from '../data/offers.js'
import { useStore } from '../store/StoreContext.jsx'
import ProductImage from './ProductImage.jsx'
import { money, withTax } from '../utils/storeFormatters.js'

export default function ProductCard({ product }) {
  const { cart, setCart } = useStore()
  if (!product) return null

  const stock = Number(product.stock) || 0
  const itemInCart = cart.find(entry => entry.id === product.id)
  const addToCart = () => {
    if (stock <= 0) {
      window.alert('Este producto no tiene stock disponible.')
      return
    }
    if ((itemInCart?.cantidad || 0) >= stock) {
      window.alert(`Solo hay ${stock} unidades disponibles.`)
      return
    }
    setCart(current => addProductToCart(current, getOfferCartProduct(product)))
  }
  const onOffer = isProductOnOffer(product)
  const currentPrice = getOfferPrice(product)
  const imageSrc = product.imagen || '/img/product-placeholder.svg'

  return (
    <article className="col-sm-6 col-lg-4 col-xl-3 mb-4">
      <div className="card h-100 shadow-sm border-0 product-card">
        <Link to={`/producto/${product.id}`} aria-label={`Ver ${product.nombre}`}>
          <ProductImage src={imageSrc} className="card-img-top" alt={product.nombre} style={{ height: 180, objectFit: 'cover' }} />
        </Link>
        <div className="card-body d-flex flex-column">
          <small className="text-muted fw-bold">CÓD: {product.codigo || 'Sin código'}</small>
          <h2 className="h6 fw-bold mt-2"><Link className="text-decoration-none text-dark" to={`/producto/${product.id}`}>{product.nombre}</Link></h2>
          <span className="text-muted small">{product.categoria || 'Sin categoría'}</span>
          {onOffer && <span className="badge bg-danger align-self-start mt-2">En oferta</span>}
          <div className="mt-2">
            {onOffer && <div className="text-muted small text-decoration-line-through">{money(withTax(product.precio))} precio original</div>}
            <strong className={`${onOffer ? 'text-danger' : 'text-primary'}`}>{money(withTax(currentPrice))} IVA incl.</strong>
          </div>
          <button className="btn btn-primary mt-auto mt-3" onClick={addToCart} disabled={stock <= 0}>
            <i className="bi bi-cart-plus me-1" />Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  )
}
