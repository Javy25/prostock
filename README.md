# Prostock

Prostock is a React single-page store with a Spring Boot microservice backend.
The entity-relationship model is in [docs/MER.md](./docs/MER.md), and the
service boundaries and purchase flow are described in
[docs/microservices.md](./docs/microservices.md).

## Frontend

Run the store against its local-browser demo data:

```sh
npm install
npm run dev
```

The Vite starter page has been replaced with React routes for the store,
categories, offers, checkout results, order history, accounts, and the
administration panel. The default demo uses JavaScript CRUD repositories backed
by `localStorage`.

Run the Jasmine/Karma tests in jsdom and the production build with:

```sh
npm test
npm run build
```

The test command runs without a browser installation. Use `npm run test:watch`
for continuous testing during development.

The updated requirements specification is in [docs/ERS-V2.md](./docs/ERS-V2.md),
and the test cases and current coverage limitations are in
[docs/cobertura-pruebas.md](./docs/cobertura-pruebas.md).

## Spring Boot microservices

The backend uses Java 17, Spring Boot, PostgreSQL, a JWT-secured API gateway,
and four domain services:

| Service | Responsibility | Database |
| --- | --- | --- |
| `api-gateway` | Public API entry point, routing, CORS, JWT and role checks | — |
| `identity-service` | Registration, login, hashed passwords, users and roles | `prostock_identity` |
| `catalog-service` | Product catalogue and stock reservations | `prostock_catalog` |
| `order-service` | Orders, shipping snapshots, order items and stock reservation orchestration | `prostock_orders` |
| `contact-service` | Contact messages and their administration state | `prostock_contact` |

Each service owns a separate database. Order items retain product snapshots;
IDs that refer to users and products are logical cross-service references,
not foreign keys shared between databases.

1. Copy `backend/.env.example` to `backend/.env` and replace the database,
   administrator, and JWT example values. Keep the JWT secret the same for the
   gateway, identity, and order services; Compose passes the configured value
   to all three.
2. From `backend/`, start the services:

   ```sh
   docker compose up --build
   ```

3. Copy `.env.backend.example` to `.env` at the repository root and start the
   frontend with `npm run dev`.
4. Open the Vite URL. The frontend calls the services through
   `http://localhost:8080`. Product seed data is loaded the first time the
   catalogue database is empty.

The gateway is the only application service published to the host. The
identity, catalogue, order, and contact services communicate on Docker's
private network. The sample administrator email defaults to `admin@duoc.cl`; use the password
set in `backend/.env`.
Only the gateway is exposed on port `8080`; PostgreSQL and the domain services
remain on Docker's private network. Compose requires explicit database and
administrator passwords from `backend/.env`. Do not use the example values on a
public network.

## API routes through the gateway

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register`, `/api/auth/login` | Public; registration always creates a customer |
| `GET` | `/api/products`, `/api/products/{id}` | Public |
| `POST`, `PUT`, `DELETE` | `/api/products/**` | Administrator JWT |
| `POST` | `/api/orders` | Authenticated user; order owner is checked against the JWT |
| `GET` | `/api/orders`, `/api/orders/{id}` | Authenticated; customers can only read their own orders |
| `POST` | `/api/messages` | Public |
| `GET`, `PATCH`, `DELETE` | `/api/messages/**` | Administrator JWT |
| `/**` | `/api/users/**` | Administrator JWT |

Stock reservation endpoints are internal and denied by the gateway. The order
service fetches canonical product prices and requests reservations before
persisting an order; it compensates completed reservations if a later step
fails. This is a small synchronous saga suitable for the project demo, not a
replacement for durable messaging/outbox and operational retry policies in
production.

## Local demo limitations

Use a unique `JWT_SECRET` and administrator password before deploying. The
defaults are only for local development. The implementation stores account and
commerce data in PostgreSQL when backend mode is enabled; without
`VITE_USE_API=true`, the frontend remains in its localStorage demo mode. The
blog articles and company information are static frontend content.
