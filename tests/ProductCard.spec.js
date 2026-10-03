import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../src/components/ProductCard.jsx'
import { StoreContext } from '../src/store/StoreContext.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('tarjeta de producto', () => {
  let container
  let root
  let setCart
  const product = {
    id: 8,
    codigo: 'PRI-108',
    nombre: 'Estuche Escolar',
    categoria: 'Escolar',
    precio: 4590,
    stock: 3,
    imagen: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    setCart = jasmine.createSpy('setCart')
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function renderCard(cart = []) {
    act(() => {
      root.render(
        <MemoryRouter>
          <StoreContext.Provider value={{ cart, setCart }}>
            <ProductCard product={product} />
          </StoreContext.Provider>
        </MemoryRouter>,
      )
    })
  }

  it('usa props del producto para renderizar sus datos', () => {
    renderCard()

    expect(container.textContent).toContain('PRI-108')
    expect(container.textContent).toContain('Estuche Escolar')
    expect(container.querySelector('img').getAttribute('alt')).toBe('Estuche Escolar')
  })

  it('al hacer clic solicita actualizar el estado del carrito', () => {
    renderCard()

    act(() => container.querySelector('button').click())

    expect(setCart).toHaveBeenCalledTimes(1)
    const update = setCart.calls.mostRecent().args[0]
    expect(update([])).toEqual([{ ...product, cantidad: 1 }])
  })

  it('deshabilita agregar el producto cuando no hay stock', () => {
    renderCard([])

    act(() => root.render(
      <MemoryRouter>
        <StoreContext.Provider value={{ cart: [], setCart }}>
          <ProductCard product={{ ...product, stock: 0 }} />
        </StoreContext.Provider>
      </MemoryRouter>,
    ))

    expect(container.querySelector('button').disabled).toBeTrue()
  })
})
