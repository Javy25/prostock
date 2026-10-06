export default function ProductImage({ src, alt, className = '', style = {}, ...props }) {
  const fallbackImage = '/img/product-placeholder.svg'
  const imageSource = src || fallbackImage

  return (
    <img
      src={imageSource}
      alt={alt || 'Producto'}
      className={className}
      style={style}
      onError={event => {
        event.currentTarget.onerror = null
        event.currentTarget.src = fallbackImage
      }}
      {...props}
    />
  )
}
