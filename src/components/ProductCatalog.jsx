import { useState } from 'react'

export default function ProductCatalog({ products, renderProduct, initialCategory = '' }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const categories = [...new Set(products.map(product => product.categoria))]
  const filtered = products.filter(product => {
    const searchMatches = `${product.codigo} ${product.nombre}`.toLowerCase().includes(search.toLowerCase())
    return searchMatches && (!category || product.categoria === category)
  })

  return (
    <>
      <div className="row align-items-center mb-4">
        <div className="col-md-6"><div className="d-flex gap-2">
          <input className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por código o nombre..." aria-label="Buscar productos" />
          <select className="form-select" value={category} onChange={event => setCategory(event.target.value)} aria-label="Filtrar productos por categoría">
            <option value="">Todas las categorías</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div></div>
      </div>
      <div className="row">{filtered.length
        ? filtered.map(renderProduct)
        : <p className="col-12 text-center py-5 text-muted">No hay productos disponibles.</p>}</div>
    </>
  )
}
