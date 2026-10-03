import { act } from 'react'
import { createRoot } from 'react-dom/client'
import ProductCatalog from '../src/components/ProductCatalog.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('catálogo de productos', () => {
  const products = [
    { id: 1, codigo: 'PRI-101', nombre: 'Cuaderno universitario', categoria: 'Escolar' },
    { id: 2, codigo: 'PRI-102', nombre: 'Resma de papel', categoria: 'Oficina' },
  ]
  const mounted = []

  afterEach(() => {
    mounted.forEach(({ root, container }) => {
      act(() => root.unmount())
      container.remove()
    })
    mounted.length = 0
  })

  function renderCatalog() {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    mounted.push({ root, container })
    act(() => {
      root.render(
        <ProductCatalog
          products={products}
          renderProduct={product => <article key={product.id}>{product.nombre}</article>}
        />,
      )
    })
    return container
  }

  function setSearchValue(input, value) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('renderiza la lista recibida por props en el DOM', () => {
    const container = renderCatalog()

    expect(container.querySelectorAll('article').length).toBe(2)
    expect(container.textContent).toContain('Cuaderno universitario')
    expect(container.textContent).toContain('Resma de papel')
  })

  it('actualiza la lista al filtrar por nombre', () => {
    const container = renderCatalog()
    const search = container.querySelector('[aria-label="Buscar productos"]')

    act(() => setSearchValue(search, 'cuaderno'))

    expect(container.querySelectorAll('article').length).toBe(1)
    expect(container.textContent).toContain('Cuaderno universitario')
    expect(container.textContent).not.toContain('Resma de papel')
  })

  it('actualiza la lista al cambiar la categoría', () => {
    const container = renderCatalog()
    const category = container.querySelector('[aria-label="Filtrar productos por categoría"]')

    act(() => {
      category.value = 'Oficina'
      category.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(container.querySelectorAll('article').length).toBe(1)
    expect(container.textContent).toContain('Resma de papel')
  })

  it('muestra el estado vacío cuando no hay coincidencias', () => {
    const container = renderCatalog()
    const search = container.querySelector('[aria-label="Buscar productos"]')

    act(() => setSearchValue(search, 'sin resultados'))

    expect(container.querySelectorAll('article').length).toBe(0)
    expect(container.textContent).toContain('No hay productos disponibles.')
  })
})
