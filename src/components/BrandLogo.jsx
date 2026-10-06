export default function BrandLogo({ className = '', ...props }) {
  return (
    <svg
      viewBox="0 0 220 44"
      role="img"
      aria-label="Prostock"
      className={className || 'brand-logo'}
      {...props}
    >
      <rect x="0" y="0" width="220" height="44" rx="8" fill="#111827" />
      <path d="M16 10h14v24H16zM18 12v20h10V12zm18 0h9l9 9v15h-9V23h-9v9h-9V12zm22 0h10l10 10v14h-10V24h-10v14H38z" fill="#f9b313" />
      <text x="70" y="29" fill="#ffffff" fontSize="20" fontWeight="700" fontFamily="Arial, sans-serif">PROSTOCK</text>
    </svg>
  )
}
