# Especificación de Requisitos de Software (ERS) — Prostock V2

## 1. Propósito y alcance

Prostock es una tienda web responsive para la venta de artículos de oficina.
La versión 2 migra la experiencia a React y permite operar en modo de
demostración con persistencia local o conectarse al microservicio de tienda
HTTP descrito en este documento. En el repositorio también se conserva una
implementación Spring Boot anterior con un contrato API distinto.

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

React/Vite consume el microservicio de tienda cuando `VITE_USE_API=true`, con
rutas `/api/productos`, `/api/clientes`, `/api/carrito`, `/api/clientes/{id}/boletas`
y `/api/blogs`. La sesión autenticada y el carrito de invitado se mantienen
mediante cookies HTTP; la interfaz no envía JWT. Sin la variable, el modo
demostración usa repositorios JavaScript con `localStorage`; el seed inicial del
catálogo es sólo soporte de demostración y no reemplaza la base de datos del
servicio.

El código Spring Boot descrito en `backend/` conserva un contrato anterior
(rutas en inglés con JWT) y no implementa estos endpoints españoles. No debe
confundirse con el microservicio que consume el modo API del frontend.

La API de tienda no expone CRUD de categorías/promociones, mensajes de contacto,
listado global de boletas, reportes administrativos ni una ruta de cierre de
sesión. En modo API, las categorías se derivan del catálogo y las pantallas
dependientes de esos endpoints se informan como no disponibles.

El modelo de entidades y relaciones está en [MER.md](./MER.md), y la separación
de responsabilidades está en [microservices.md](./microservices.md).

## 6. Restricciones y supuestos

- En desarrollo, Vite reenvía `/api` a `http://localhost:8080`; en producción se
  requiere un proxy same-origin o CORS con credenciales habilitadas.
- El modo local es de demostración y no debe usarse para datos sensibles ni
  operación comercial real.
- El frontend requiere Node.js y npm. El backend Spring Boot anterior requiere
  Java 17 y Docker Compose, pero no implementa el contrato de tienda conectado.
- Los reportes se calculan a partir de los pedidos disponibles en el modo activo.
