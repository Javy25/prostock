import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const legacyPaths = {
  '/productos.html': '/productos',
  '/carrito.html': '/carrito',
  '/nosotros.html': '/nosotros',
  '/blogs.html': '/blogs',
  '/contacto.html': '/contacto',
  '/login.html': '/login',
  '/registro.html': '/registro',
  '/perfil.html': '/perfil',
  '/detalle-blog.html': '/blogs/inventario',
  '/detalle-blog-2.html': '/blogs/insumos',
  '/admin/index.html': '/admin',
  '/admin/productos-listar.html': '/admin/productos',
  '/admin/usuarios-listar.html': '/admin/usuarios',
  '/admin/mensajes-listar.html': '/admin/mensajes',
}

function routeToReact(request, response, next) {
  if (!request.url) return next()
  const url = new URL(request.url, 'http://localhost')
  let target = legacyPaths[url.pathname]
  if (url.pathname === '/detalle-producto.html') {
    target = `/producto/${url.searchParams.get('id') || ''}`
  } else if (url.pathname === '/admin/producto-form.html') {
    target = `/admin/productos/${url.searchParams.get('id') || 'nuevo'}`
  } else if (url.pathname === '/admin/usuario-form.html') {
    target = `/admin/usuarios/${url.searchParams.get('id') || 'nuevo'}`
  }
  if (target) {
    response.writeHead(302, { Location: target })
    response.end()
    return
  }

  const isReactRoute = /^\/(productos|carrito|nosotros|blogs|contacto|login|registro|perfil|producto|admin)(\/|$)/.test(url.pathname)
  if (!isReactRoute) return next()

  request.url = `/index.html${url.search}`
  next()
}

function reactPageRoutes() {
  return {
    name: 'react-page-routes',
    configureServer(server) {
      server.middlewares.use(routeToReact)
    },
    configurePreviewServer(server) {
      server.middlewares.use(routeToReact)
    },
  }
}

export default defineConfig({
  plugins: [react(), reactPageRoutes()],
})
