# Especificación de Requisitos de Software (ERS) — Prostock V2

## 1. Propósito y alcance

Prostock es una tienda web responsive para la venta de artículos de oficina.
La versión 2 migra la experiencia a React, permite operar en modo demostración
con persistencia local y ofrece una arquitectura alternativa de microservicios
Spring Boot con PostgreSQL.

## 2. Perfiles de usuario

- **Visitante:** navega catálogo, categorías, ofertas y contenido; puede enviar
  un mensaje de contacto.
- **Cliente:** se registra e inicia sesión, mantiene un carrito, realiza compras,
  consulta sus pedidos y administra sus datos de entrega.
- **Administrador:** administra productos, categorías, ofertas, usuarios,
  mensajes y pedidos; consulta indicadores y alertas de inventario.

## 3. Requisitos funcionales

| ID | Requisito |
| --- | --- |
| RF-01 | El sistema debe presentar catálogo, detalle de producto y filtros por categoría. |
| RF-02 | El usuario debe poder navegar por categorías y consultar ofertas vigentes en el modo demostración. |
| RF-03 | El carrito debe permitir agregar, quitar y ajustar cantidades sin exceder el stock. |
| RF-04 | El checkout debe requerir sesión, dirección de entrega y disponibilidad de stock. |
| RF-05 | El sistema debe confirmar o informar el fallo de una compra y mantener el historial de pedidos. |
| RF-06 | El cliente debe consultar su perfil y únicamente sus propios pedidos. |
| RF-07 | El administrador debe crear, editar y eliminar productos, categorías y ofertas en el modo demostración. |
| RF-08 | El administrador debe consultar usuarios y administrar sus roles. |
| RF-09 | El administrador debe atender/eliminar mensajes de contacto y revisar pedidos. |
| RF-10 | El sistema debe presentar reportes de ventas, pedidos, unidades vendidas, usuarios, mensajes y stock bajo. |
| RF-11 | El modo demostración debe ofrecer repositorios JavaScript CRUD y persistir datos en `localStorage`. |
| RF-12 | El modo backend debe consumir la API del gateway y persistir datos de dominio en PostgreSQL. |

## 4. Requisitos no funcionales

- **RNF-01 Responsive:** las vistas deben adaptarse a móvil, tableta y escritorio.
- **RNF-02 Seguridad:** las operaciones administrativas requieren autorización
  en el gateway; contraseñas del backend se almacenan con hash.
- **RNF-03 Integridad:** el pedido debe validar precios y reservar stock en el
  backend; los pedidos conservan snapshots de productos y despacho.
- **RNF-04 Usabilidad:** las acciones muestran estados vacíos, confirmaciones o
  mensajes de error comprensibles.
- **RNF-05 Mantenibilidad:** la interfaz usa componentes React, rutas separadas
  y repositorios de datos; los servicios mantienen bases de datos aisladas.
- **RNF-06 Pruebas:** CRUD simulado y comportamiento React esencial se validan
  mediante Jasmine/Karma.

## 5. Arquitectura y datos

React/Vite consume el gateway cuando `VITE_USE_API=true`. Los servicios de
identidad, catálogo, pedidos y contacto mantienen sus propios límites y
persistencia PostgreSQL. Sin la variable, el modo demostración usa repositorios
JavaScript con `localStorage`; el seed inicial del catálogo es sólo soporte de
demostración y no reemplaza la base de datos del backend.

El modelo de entidades y relaciones está en [MER.md](./MER.md), y la separación
de responsabilidades está en [microservices.md](./microservices.md).

## 6. Restricciones y supuestos

- La API se expone por el gateway en `http://localhost:8080`.
- El modo local es de demostración y no debe usarse para datos sensibles ni
  operación comercial real.
- El backend actual no tiene un servicio dedicado a categorías ni promociones;
  su administración y aplicación de descuentos se limita al modo demostración.
- Para ejecutar los servicios se requiere Java 17 y Docker Compose; el frontend
  requiere Node.js y npm.
- Los reportes se calculan a partir de los pedidos disponibles en el modo activo.
