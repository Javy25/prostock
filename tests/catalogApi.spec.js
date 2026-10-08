import { listCatalogProducts, removeCatalogProduct, saveCatalogProduct } from '../src/services/catalogApi.js'

describe('servicio de catálogo con API simulada', () => {
  let request

  beforeEach(() => {
    request = jasmine.createSpy('apiRequest').and.resolveTo([{ id: 1, nombre: 'Cuaderno' }])
  })

  it('consulta los productos en el endpoint del catálogo', async () => {
    const result = await listCatalogProducts(request)

    expect(request).toHaveBeenCalledOnceWith('/api/productos')
    expect(result[0].nombre).toBe('Cuaderno')
  })

  it('crea un producto y entrega el cuerpo JSON esperado', async () => {
    const product = { codigo: 'PRI-101', nombre: 'Cuaderno' }
    await saveCatalogProduct(product, null, request)

    expect(request).toHaveBeenCalledOnceWith('/api/productos', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  })

  it('actualiza un producto en la ruta de su identificador', async () => {
    const product = { codigo: 'PRI-101', nombre: 'Cuaderno actualizado' }
    await saveCatalogProduct(product, 17, request)

    expect(request).toHaveBeenCalledOnceWith('/api/productos/17', {
      method: 'PUT',
      body: JSON.stringify(product),
    })
  })

  it('elimina un producto mediante DELETE', async () => {
    await removeCatalogProduct(17, request)

    expect(request).toHaveBeenCalledOnceWith('/api/productos/17', { method: 'DELETE' })
  })

  it('propaga los errores recibidos desde el mock de API', async () => {
    request.and.rejectWith(new Error('Catálogo no disponible'))

    await expectAsync(listCatalogProducts(request)).toBeRejectedWithError('Catálogo no disponible')
  })
})
