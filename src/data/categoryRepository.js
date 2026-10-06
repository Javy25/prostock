export function getAvailableCategories(categories, products) {
  const categoryNames = categories.map(category => typeof category === 'string' ? category : category?.nombre)
  return [...new Set([...categoryNames, ...products.map(product => product.categoria).filter(Boolean)])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es'))
}
