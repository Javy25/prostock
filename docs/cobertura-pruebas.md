# Cobertura y análisis de pruebas

## Ejecución

Desde la raíz del proyecto:

```sh
npm test
```

El comando inicia Karma en su entorno jsdom y ejecuta las especificaciones
Jasmine en una sola corrida.

## Casos cubiertos

| Área | Caso | Resultado esperado |
| --- | --- | --- |
| Repositorio JavaScript | Crear y buscar | El registro creado se puede recuperar por ID. |
| Repositorio JavaScript | Actualizar y eliminar | Los cambios quedan persistidos y el registro eliminado desaparece. |
| Repositorio JavaScript | Validación de errores | IDs duplicados y operaciones sobre IDs inexistentes lanzan errores explícitos. |
| Componente React | Renderizado y props | El texto inicial refleja la propiedad recibida. |
| Componente React | Estado y evento | El clic incrementa el estado y actualiza el DOM. |

## Análisis

Las pruebas comprueban operaciones CRUD y la integración básica de props,
estado y eventos React. El build de Vite verifica además el ensamblado de todas
las rutas y componentes. Los flujos de integración con PostgreSQL requieren
Java 17 y Docker Compose y deben ejecutarse en un entorno que disponga de esas
herramientas.

## Limitaciones

La configuración actual no genera porcentaje de cobertura instrumentado. Los
casos no sustituyen pruebas de integración del gateway, autorización,
transacciones de pedidos ni pruebas manuales responsive. Para la entrega se
debe adjuntar el resultado de `npm test` y el de `npm run build`.
