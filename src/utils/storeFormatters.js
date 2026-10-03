export const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`
export const withTax = value => Math.round(Number(value) * 1.19)
export const createId = () => Date.now()
export const formatToday = () => new Date().toLocaleDateString('es-CL')
