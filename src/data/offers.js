export function isProductOnOffer(product) {
  const offerPrice = Number(product.precioOferta)
  const regularPrice = Number(product.precio)
  return offerPrice > 0 && offerPrice < regularPrice
}

export function getOfferProducts(products) {
  return products.filter(isProductOnOffer)
}

export function getOfferPrice(product) {
  return isProductOnOffer(product) ? Number(product.precioOferta) : Number(product.precio)
}

export function getOfferCartProduct(product) {
  if (!isProductOnOffer(product)) return product
  return {
    ...product,
    precioOriginal: Number(product.precio),
    precio: getOfferPrice(product),
  }
}
