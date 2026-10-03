import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiEnabled, apiRequest } from '../api.js'
import { readProducts } from '../data/productRepository.js'
import { listCatalogProducts } from '../services/catalogApi.js'
import { StoreContext } from './StoreContext.jsx'

const readStored = (key, fallback, persist) => {
  if (!persist) return fallback
  const stored = localStorage.getItem(key)
  if (stored === null) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  return JSON.parse(stored)
}

function useStoredValue(key, fallback, persist, initialize = () => readStored(key, fallback, persist)) {
  const [value, setValue] = useState(initialize)
  const update = useCallback(nextValue => {
    setValue(current => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue
      if (persist) localStorage.setItem(key, JSON.stringify(resolved))
      return resolved
    })
  }, [key, persist])
  return [value, update]
}

export default function StoreProvider({ children }) {
  const [products, setProducts] = useStoredValue('productos_db', apiEnabled ? [] : readProducts(), !apiEnabled)
  const [cart, setCart] = useStoredValue('carrito', [], true)
  const [users, setUsers] = useStoredValue('usuarios_db', apiEnabled ? [] : [
    { id: 999, nombre: 'Administrador Prostock', email: 'admin@duoc.cl', password: 'admin123', rol: 'ADMIN' },
  ], !apiEnabled)
  const [orders, setOrders] = useStoredValue('pedidos_db', [], !apiEnabled)
  const [messages, setMessages] = useStoredValue('mensajes_contacto_db', [], !apiEnabled)
  const [activeUser, setActiveUser] = useStoredValue('usuarioActivo', null, true, () => {
    if (apiEnabled && !localStorage.getItem('prostock_access_token')) return null
    return readStored('usuarioActivo', null, true)
  })
  const [apiError, setApiError] = useState('')

  const refreshBackend = useCallback(async (user = activeUser) => {
    const remoteProducts = await listCatalogProducts()
    setProducts(remoteProducts)
    if (!user) return
    const [remoteUsers, remoteOrders, remoteMessages] = await Promise.all([
      user.rol === 'ADMIN' ? apiRequest('/api/users') : Promise.resolve([]),
      apiRequest(user.rol === 'ADMIN' ? '/api/orders' : `/api/orders?usuarioId=${user.id}`),
      user.rol === 'ADMIN' ? apiRequest('/api/messages') : Promise.resolve([]),
    ])
    if (user.rol === 'ADMIN') setUsers(remoteUsers)
    setOrders(remoteOrders.map(order => ({
      ...order,
      fecha: order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL') : '',
    })))
    if (user.rol === 'ADMIN') setMessages(remoteMessages.map(message => ({
      ...message,
      fecha: message.fecha ? new Date(message.fecha).toLocaleDateString('es-CL') : '',
    })))
    setApiError('')
  }, [activeUser, setProducts, setUsers, setOrders, setMessages])

  useEffect(() => {
    if (!apiEnabled) return
    const hasToken = Boolean(localStorage.getItem('prostock_access_token'))
    let active = true
    const initialLoad = hasToken && activeUser
      ? Promise.resolve().then(() => refreshBackend(activeUser))
      : listCatalogProducts().then(remoteProducts => {
        if (active) setProducts(remoteProducts)
      })
    initialLoad
      .catch(error => {
        console.error('No fue posible cargar datos desde los microservicios.', error)
        if (active) setApiError(`No fue posible conectar con el backend: ${error.message}`)
      })
    return () => { active = false }
  }, [activeUser, refreshBackend, setProducts])

  useEffect(() => {
    if (!apiEnabled && !users.some(user => user.email === 'admin@duoc.cl')) {
      setUsers(current => current.some(user => user.email === 'admin@duoc.cl')
        ? current
        : [...current, {
          id: 999, nombre: 'Administrador Prostock', email: 'admin@duoc.cl',
          password: 'admin123', rol: 'ADMIN',
        }])
    }
  }, [users, setUsers])

  const value = useMemo(() => ({
    products, setProducts, cart, setCart, users, setUsers, orders, setOrders,
    messages, setMessages, activeUser, setActiveUser, apiEnabled, apiError,
    setApiError, refreshBackend,
  }), [products, setProducts, cart, setCart, users, setUsers, orders, setOrders, messages, setMessages, activeUser, setActiveUser, apiError, setApiError, refreshBackend])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
