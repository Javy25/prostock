import { addCategory, getAvailableCategories, readCategories } from '../src/data/categoryRepository.js'

describe('repositorio de categorías', () => {
  it('obtiene las categorías originales de los productos', () => {
    expect(readCategories()).toEqual([
      'Aseo y Limpieza',
      'Escolar',
      'Insumos',
      'Papelería y Oficina',
    ])
  })

  it('crea una categoría nueva sin quitar las existentes', () => {
    const current = ['Escolar', 'Oficina']

    expect(addCategory(current, '  Tecnología  ')).toEqual(['Escolar', 'Oficina', 'Tecnología'])
    expect(current).toEqual(['Escolar', 'Oficina'])
  })

  it('no agrega categorías vacías o duplicadas ignorando mayúsculas', () => {
    const current = ['Escolar']

    expect(addCategory(current, '   ')).toBe(current)
    expect(addCategory(current, 'escolar')).toBe(current)
  })

  it('hace disponibles las categorías creadas y las ya asociadas a productos', () => {
    expect(getAvailableCategories(['Nueva'], [{ categoria: 'Escolar' }, { categoria: 'Nueva' }]))
      .toEqual(['Escolar', 'Nueva'])
  })
})
