# Prostock

Prostock is a React single-page store with a Spring Boot microservice backend.
The entity-relationship model is in [docs/MER.md](./docs/MER.md), and the
service boundaries and purchase flow are described in
[docs/microservices.md](./docs/microservices.md).

## Repository layout

```text
prostock/
├── backend/                 # Spring Boot services and infrastructure scripts
├── data/                    # JSON seed data imported by the frontend
├── docs/                    # ERS, test coverage, data model, and architecture
├── public/                  # Static assets served by Vite
├── src/
│   ├── assets/              # Frontend styles
│   ├── components/          # Shared React components
│   ├── data/                # Demo repositories and store data helpers
│   ├── services/            # API clients
│   ├── utils/               # Shared formatting helpers
│   ├── App.jsx              # Application routes and screens
│   ├── api.js               # HTTP request helper
│   └── main.jsx             # React entry point
├── tests/                   # Jasmine/Karma frontend tests
├── index.html               # Vite SPA entry document
├── karma.conf.cjs
├── package.json
└── vite.config.js
```

The frontend currently lives at the repository root; there is no `frontend/`
wrapper. Screens are routed from `src/App.jsx`; empty `src/pages/`, `src/store/`,
`src/features/`, and `public/data/` directories are not part of the application
structure.

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

## Store microservice API

To connect React to the Spanish store API, copy `.env.backend.example` to the
repository root as `.env` and set:

```dotenv
VITE_USE_API=true
VITE_API_URL=
```

Restart Vite after changing `.env`. In development Vite proxies `/api` to
`http://localhost:8080`; keep `VITE_API_URL` empty so session cookies remain
same-origin in the browser. For production, set `VITE_API_URL` to a same-origin
reverse proxy or configure the API's CORS allow-origin for the frontend domain
with `Access-Control-Allow-Credentials: true`. The frontend calls
`/api/productos`, `/api/clientes`, `/api/carrito`,
`/api/clientes/{id}/boletas`, and `/api/blogs`. Login uses the API's
email/password session; no JWT is attached. Guest carts use the HTTP session,
while signed-in carts and receipts use the customer's ID.

The Spring Boot project under `backend/` is a separate, earlier API contract:
it exposes English resource paths and JWT authentication. It does not implement
the Spanish endpoints above, so it is not a substitute for the store
microservice when `VITE_USE_API=true`.

This API contract does not include categories or promotions as independent
resources, contact-message administration, global receipt/report endpoints, or
a logout endpoint. Categories are derived from products; the corresponding
administrative screens explain which operations are unavailable. The contact
page prepares an email instead of calling an unsupported endpoint.

## Separate Spring Boot backend (earlier contract)

`backend/` contains an earlier implementation that uses Java 17, Spring Boot,
PostgreSQL, English API paths, and JWT authentication. It is separate from the
Spanish session-based API connected by the frontend. Its services are:

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

Run the backend tests from `backend/` with:

```sh
mvn test
```

The gateway authorization tests use a local stub service, catalog stock tests
use an in-memory H2 database, and order API tests use mocked persistence and
catalog responses. These tests do not require Docker or PostgreSQL.

To run this backend independently for its own tests or development:

1. Copy `backend/.env.example` to `backend/.env` and replace the database,
   administrator, and JWT example values. Keep the JWT secret the same for the
   gateway, identity, and order services.
2. From `backend/`, run `docker compose up --build`. This does **not** provide
   the Spanish session-based API required by the frontend's API mode.

In this separate backend, the gateway is the only application service published to the host. The
identity, catalogue, order, and contact services communicate on Docker's
private network. The sample administrator email defaults to `admin@duoc.cl`; use the password
set in `backend/.env`.
Only the gateway is exposed on port `8080`; PostgreSQL and the domain services
remain on Docker's private network. Compose requires explicit database and
administrator passwords from `backend/.env`. Do not use the example values on a
public network.

## Earlier backend API routes through its gateway

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

## Frontend modes

Without `VITE_USE_API=true`, the frontend uses its localStorage demo mode.
With API mode enabled, catalog, customer, cart, receipt, and blog data are
loaded from the Spanish session-based API described above. Blog and company
content in demo mode use local seed data.
