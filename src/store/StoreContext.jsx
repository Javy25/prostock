import { createContext, useContext } from 'react'

export const StoreContext = createContext(null)

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore debe usarse dentro de StoreProvider')
  return store
}
