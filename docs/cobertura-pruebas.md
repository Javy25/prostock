# Cobertura y análisis de pruebas

## Ejecución

Desde la raíz del proyecto:

```sh
npm test
```

El comando inicia Karma con jsdom y ejecuta las especificaciones Jasmine en una
sola corrida. No requiere instalar Chrome ni otro navegador.

## Casos cubiertos

| Área | Caso | Resultado esperado |
| --- | --- | --- |
| Repositorio JavaScript | Crear y buscar | El registro creado se puede recuperar por ID. |
| Repositorio JavaScript | Actualizar y eliminar | Los cambios quedan persistidos y el registro eliminado desaparece. |
| Repositorio JavaScript | Validación de errores | IDs duplicados y operaciones sobre IDs inexistentes lanzan errores explícitos. |
| Componente React | Renderizado y props | El texto inicial refleja la propiedad recibida. |
| Componente React | Estado y evento | El clic incrementa el estado y actualiza el DOM. |
| Adaptador de API | Productos | Lista, filtra por categoría, consulta por ID y prueba CRUD. |
| Adaptador de API | Clientes | Prueba CRUD y el contrato de login con `email`/`contrasena`. |
| Adaptador de API | Carrito | Verifica las rutas por cliente e invitado, cantidades y eliminación. |
| Adaptador de API | Boletas y blog | Verifica emisión/consulta de boletas y CRUD de publicaciones. |

## Pruebas backend

Desde `backend/`, ejecutar:

```sh
mvn test
```

La suite verifica las reglas de autorización del gateway y el bloqueo de
endpoints internos de stock; las reservas y liberaciones de inventario en H2;
y la autorización, validación de precios del catálogo y compensación de stock
ante fallos de persistencia en pedidos. Estas pruebas usan dobles locales y no
requieren Docker ni PostgreSQL.

## Análisis

Las pruebas frontend cubren repositorios y lógica de datos usados por la
aplicación activa, y algunos flujos de interfaz de administración. El build de
Vite verifica además el ensamblado de rutas y componentes. Los tests backend
no reemplazan pruebas end-to-end con PostgreSQL y servicios levantados con
Docker Compose.

## Limitaciones

La configuración no genera porcentaje de cobertura instrumentado. Los casos
no sustituyen pruebas de integración del gateway, autorización, transacciones
de pedidos ni pruebas manuales responsive. Para la entrega se debe adjuntar el
resultado de `npm test` y el de `npm run build`.
