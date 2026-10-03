import { getOfferCartProduct, getOfferPrice, getOfferProducts, isProductOnOffer } from '../src/data/offers.js'

describe('ofertas de productos', () => {
  it('incluye solo productos con un precioOferta válido menor al precio normal', () => {
    const products = [
      { id: 1, precio: 1000, precioOferta: 900 },
      { id: 2, precio: 1000 },
      { id: 3, precio: 1000, precioOferta: 1200 },
    ]

    expect(getOfferProducts(products)).toEqual([products[0]])
    expect(isProductOnOffer(products[0])).toBeTrue()
    expect(isProductOnOffer(products[2])).toBeFalse()
  })

  it('utiliza el precio rebajado como precio vigente del producto', () => {
    expect(getOfferPrice({ precio: 1000, precioOferta: 850 })).toBe(850)
    expect(getOfferPrice({ precio: 1000, precioOferta: 1200 })).toBe(1000)
  })

  it('conserva el precio original y añade al carrito el precio de oferta', () => {
    const product = { id: 7, precio: 1000, precioOferta: 850 }

    expect(getOfferCartProduct(product)).toEqual({
      ...product,
      precioOriginal: 1000,
      precio: 850,
    })
  })
})
