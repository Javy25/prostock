import { applySeedOffers, createProduct, deleteProduct, readProducts, updateProduct } from '../src/data/productRepository.js'

describe('repositorio de productos', () => {
  const products = [
    { id: 1, nombre: 'Cuaderno' },
    { id: 2, nombre: 'Lápices' },
  ]

  it('lee una copia de los productos entregados', () => {
    const result = readProducts(products)

    expect(result).toEqual(products)
    expect(result).not.toBe(products)
  })

  it('crea un producto sin modificar la lista original', () => {
    const product = { id: 3, nombre: 'Regla' }
    const result = createProduct(products, product)

    expect(result).toEqual([...products, product])
    expect(products.length).toBe(2)
  })

  it('actualiza el producto que coincide con el id', () => {
    const updated = { id: 2, nombre: 'Lápices de colores' }

    expect(updateProduct(products, 2, updated)).toEqual([products[0], updated])
    expect(products[1].nombre).toBe('Lápices')
  })

  it('elimina solo el producto que coincide con el id', () => {
    expect(deleteProduct(products, 1)).toEqual([products[1]])
    expect(products.length).toBe(2)
  })

  it('no cambia productos cuando el id no existe', () => {
    expect(updateProduct(products, 99, { id: 99, nombre: 'Nuevo' })).toEqual(products)
    expect(deleteProduct(products, 99)).toEqual(products)
  })

  it('aplica los precios de oferta del catálogo simulado a productos locales existentes', () => {
    const stored = [{ id: 1, nombre: 'Cuaderno', precio: 1000, stock: 7 }]
    const seed = [{ id: 1, precio: 1000, precioOferta: 900 }]

    expect(applySeedOffers(stored, seed)).toEqual([{ ...stored[0], precioOferta: 900 }])
    expect('precioOferta' in stored[0]).toBeFalse()
  })
})
