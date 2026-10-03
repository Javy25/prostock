import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ProductCard.jsx'
import ProductCatalog from '../../components/ProductCatalog.jsx'
import { getOfferProducts } from '../../data/offers.js'
import { useStore } from '../../store/StoreContext.jsx'

export function ProductsPage() {
  const { products } = useStore()
  const [searchParams] = useSearchParams()
  return <main className="container my-5">
    <h1 className="h2 mb-4">Catálogo de Productos</h1>
    <ProductCatalog
      products={products}
      initialCategory={searchParams.get('categoria') || ''}
      renderProduct={product => <ProductCard key={product.id} product={product} />}
    />
  </main>
}

export function CategoriesPage() {
  const { products } = useStore()
  const categories = [...new Set(products.map(product => product.categoria))].sort((a, b) => a.localeCompare(b, 'es'))
  return <main className="container my-5">
    <h1 className="h2 mb-4">Categorías</h1>
    <div className="row g-3">
      {categories.map(category => {
        const count = products.filter(product => product.categoria === category).length
        return <div className="col-sm-6 col-lg-4" key={category}>
          <Link className="card h-100 text-decoration-none shadow-sm" to={`/productos?categoria=${encodeURIComponent(category)}`}>
            <div className="card-body"><h2 className="h5 text-dark">{category}</h2><p className="text-muted mb-0">{count} productos</p></div>
          </Link>
        </div>
      })}
      {!categories.length && <p className="text-muted">No hay categorías disponibles.</p>}
    </div>
  </main>
}

export function OffersPage() {
  const { products } = useStore()
  const offers = getOfferProducts(products)
  return <main className="container my-5">
    <h1 className="h2 mb-2">Ofertas</h1>
    <p className="text-muted mb-4">Productos con un precio de oferta publicado en el catálogo.</p>
    {offers.length
      ? <div className="row">{offers.map(product => <ProductCard key={product.id} product={product} />)}</div>
      : <div className="alert alert-info" role="status">No hay ofertas vigentes en este momento.</div>}
  </main>
}
