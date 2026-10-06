import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store/StoreContext.jsx'
import BrandLogo from './BrandLogo.jsx'

export function Header() {
  const { cart, activeUser, setActiveUser } = useStore()
  const count = cart.reduce((total, item) => total + (Number(item?.cantidad) || 0), 0)
  const links = [
    ['/', 'Inicio'],
    ['/productos', 'Productos'],
    ['/categorias', 'Categorías'],
    ['/ofertas', 'Ofertas'],
    ['/nosotros', 'Nosotros'],
    ['/blogs', 'Blog'],
    ['/contacto', 'Contacto'],
  ]

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <BrandLogo className="brand-logo" />
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Abrir navegación">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {links.map(([to, label]) => (
              <li className="nav-item" key={to}>
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to={to} end={to === '/'}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-3">
            <Link to="/carrito" className="btn btn-outline-light position-relative" aria-label="Carrito de compras">
              <i className="bi bi-cart3" />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{count}</span>
            </Link>
            {activeUser ? (
              <div className="text-white small d-flex align-items-center gap-2">
                <Link className="text-white text-decoration-none" to="/perfil">{activeUser.nombre}</Link>
                <button className="btn btn-sm btn-outline-light" onClick={() => {
                  localStorage.removeItem('prostock_access_token')
                  setActiveUser(null)
                }}>Salir</button>
              </div>
            ) : <Link className="btn btn-sm btn-outline-light" to="/login">Ingresar</Link>}
          </div>
        </div>
      </div>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="bg-dark text-white text-center py-4 mt-auto">
      <div className="container"><p className="mb-0 small">&copy; 2026 Prostock Inc. Todos los derechos reservados.</p></div>
    </footer>
  )
}

export function BackendNotice() {
  const { apiError, apiEnabled } = useStore()
  if (!apiEnabled || !apiError) return null
  return <div className="container mt-3"><div className="alert alert-danger mb-0" role="alert">{apiError}</div></div>
}

export function SiteLayout() {
  return <div className="site-layout"><Header /><BackendNotice /><Outlet /><Footer /></div>
}
