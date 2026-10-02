# Modelo entidad-relación de Prostock

El siguiente modelo separa las entidades por servicio. Las relaciones entre
servicios son referencias por identificador, no claves foráneas compartidas:
cada microservicio es dueño de sus datos y de su base PostgreSQL.

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "realiza (referencia lógica)"
    ORDERS ||--|{ ORDER_ITEMS : contiene
    PRODUCTS ||--o{ PRODUCT_IMAGES : "tiene"
    PRODUCTS o|--o{ ORDER_ITEMS : "producto de origen (referencia lógica)"

    USERS {
        bigint id PK
        string name
        string email UK
        string password_hash
        string run
        string region
        string commune
        string address
        string phone
        string role
        timestamp created_at
    }

    PRODUCTS {
        bigint id PK
        string code UK
        string name
        string category
        decimal net_price
        integer stock
        string image_url
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_IMAGES {
        bigint product_id FK
        integer image_position
        string image_url
    }

    ORDERS {
        bigint id PK
        bigint user_id "identificador externo, sin FK"
        string status
        decimal subtotal
        decimal tax
        decimal total
        string shipping_name
        string shipping_phone
        string shipping_address
        string shipping_commune
        string shipping_region
        string shipping_notes
        timestamp created_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id "identificador externo, sin FK"
        string product_code
        string product_name
        string image_url
        integer quantity
        decimal net_unit_price
        decimal gross_unit_price
        decimal line_total
    }

    CONTACT_MESSAGES {
        bigint id PK
        string name
        string email
        string subject
        text message
        boolean attended
        timestamp created_at
    }
```

## Propiedad de los datos

| Servicio | Base de datos | Entidades |
| --- | --- | --- |
| `identity-service` | `prostock_identity` | usuarios y credenciales |
| `catalog-service` | `prostock_catalog` | productos e inventario |
| `order-service` | `prostock_orders` | pedidos y líneas de pedido |
| `contact-service` | `prostock_contact` | mensajes de contacto |

`user_id` y `product_id` en pedidos son referencias lógicas a otros servicios.
El pedido conserva además una copia del nombre, código, imagen y precios del
producto para que el historial no cambie cuando se edite el catálogo.
`orders.user_id` tampoco lleva una FK a usuarios: la base de identidad pertenece
a otro servicio.

El catálogo de artículos del blog y la página institucional son contenido
estático de la aplicación, por lo que no aparecen como tablas en este MER.
