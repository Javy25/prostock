import productSeed from '../../data/productos.json'

const clone = value => JSON.parse(JSON.stringify(value))

export function createRepository(storageKey, initialRecords = [], storage = localStorage) {
  const load = () => {
    const raw = storage.getItem(storageKey)
    if (raw === null) return clone(initialRecords)
    const records = JSON.parse(raw)
    if (!Array.isArray(records)) throw new TypeError(`${storageKey} debe contener una lista de registros.`)
    return records
  }

  const save = records => {
    if (!Array.isArray(records)) throw new TypeError('Solo se pueden guardar listas de registros.')
    storage.setItem(storageKey, JSON.stringify(records))
    return clone(records)
  }

  return {
    list: () => clone(load()),
    findById: id => clone(load().find(record => String(record.id) === String(id)) ?? null),
    replace: records => save(records),
    create: record => {
      const records = load()
      const newRecord = { ...clone(record), id: record.id ?? Date.now() }
      if (records.some(item => String(item.id) === String(newRecord.id))) {
        throw new Error(`Ya existe un registro con id ${newRecord.id}.`)
      }
      save([...records, newRecord])
      return clone(newRecord)
    },
    update: (id, changes) => {
      const records = load()
      const index = records.findIndex(record => String(record.id) === String(id))
      if (index < 0) throw new Error(`No existe el registro con id ${id}.`)
      records[index] = { ...records[index], ...clone(changes), id: records[index].id }
      save(records)
      return clone(records[index])
    },
    remove: id => {
      const records = load()
      const remaining = records.filter(record => String(record.id) !== String(id))
      if (remaining.length === records.length) throw new Error(`No existe el registro con id ${id}.`)
      save(remaining)
    },
  }
}

const categoriesSeed = [...new Set(productSeed.map(product => product.categoria))]
  .map((nombre, index) => ({ id: index + 1, nombre }))

export const mockDatabase = {
  products: createRepository('productos_db', productSeed),
  cart: createRepository('carrito', []),
  categories: createRepository('categorias_db', categoriesSeed),
  offers: createRepository('ofertas_db', [
    { id: 1, titulo: 'Ofertas de oficina', categoria: categoriesSeed[0]?.nombre || '', descuento: 10, active: true },
    { id: 2, titulo: 'Especial vuelta a clases', categoria: categoriesSeed[1]?.nombre || categoriesSeed[0]?.nombre || '', descuento: 15, active: true },
  ]),
  users: createRepository('usuarios_db', [
    { id: 999, nombre: 'Administrador Prostock', email: 'admin@duoc.cl', password: 'admin123', rol: 'ADMIN' },
  ]),
  orders: createRepository('pedidos_db', []),
  messages: createRepository('mensajes_contacto_db', []),
}
