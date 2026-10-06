import { addProductQuantityToCart, addProductToCart } from '../src/data/cart.js'

describe('acciones del carrito', () => {
  const product = { id: 1, nombre: 'Cuaderno', precio: 1000, stock: 4 }

  it('agrega un producto nuevo con cantidad uno', () => {
    expect(addProductToCart([], product)).toEqual([{ ...product, cantidad: 1 }])
  })

  it('incrementa la cantidad de un producto que ya está en el carrito', () => {
    const cart = [{ ...product, cantidad: 1 }]

    expect(addProductToCart(cart, product)).toEqual([{ ...product, cantidad: 2 }])
  })

  it('permite agregar varias unidades sin exceder el stock', () => {
    expect(addProductQuantityToCart([], product, 3)).toEqual([{ ...product, cantidad: 3 }])
  })

  it('rechaza cantidades inválidas o superiores al stock', () => {
    expect(addProductQuantityToCart([], product, 0)).toBeNull()
    expect(addProductQuantityToCart([], product, 5)).toBeNull()
    expect(addProductQuantityToCart([{ ...product, cantidad: 3 }], product, 2)).toBeNull()
  })
})
