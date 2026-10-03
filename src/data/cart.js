export function addProductQuantityToCart(cart, product, quantity = 1) {
  const current = cart.find(item => item.id === product.id)
  const nextQuantity = (current?.cantidad || 0) + quantity
  if (!Number.isInteger(quantity) || quantity < 1 || nextQuantity > product.stock) return null

  return current
    ? cart.map(item => item.id === product.id ? { ...item, cantidad: nextQuantity } : item)
    : [...cart, { ...product, cantidad: nextQuantity }]
}

export function addProductToCart(cart, product) {
  return addProductQuantityToCart(cart, product) || cart
}
