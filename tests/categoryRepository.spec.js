import { getAvailableCategories } from '../src/data/categoryRepository.js'

describe('repositorio de categorías', () => {
  it('hace disponibles las categorías creadas y las ya asociadas a productos', () => {
    expect(getAvailableCategories(['Nueva'], [{ categoria: 'Escolar' }, { categoria: 'Nueva' }]))
      .toEqual(['Escolar', 'Nueva'])
  })

  it('acepta registros categóricos y productos heredados al construir filtros', () => {
    expect(getAvailableCategories([{ id: 1, nombre: 'Oficina' }], [{ categoria: 'Escolar' }]))
      .toEqual(['Escolar', 'Oficina'])
  })
})
