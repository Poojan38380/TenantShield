## TenantShield

Secure multi-tenant REST API built with Express, TypeScript, Prisma (SQLite by default), JWT auth, and optional API keys.

### Features
- Multi-tenant org model with roles: Admin, Manager, Employee
- JWT authentication and rate limiting
- API key support for server-to-server access
- Project CRUD scoped to tenant
- Admin user management and API key management
- Centralized error handling and security hardening (Helmet, CORS, rate limits)

---

## Quick Start

1) Install dependencies
```bash
npm install
```

2) Create a .env file in the project root
```bash
# .env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=TenantShield
JWT_EXPIRES_IN=24h
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

3) Prepare database (Prisma)
```bash
npx prisma generate
npx prisma migrate deploy
# For local development, you can also use:
# npx prisma db push
```

4) Run the server (choose one)
```bash
# Development (TS, auto-reload)
npm run dev

# Build + start (production-like)
npm run build && npm start
```

Base URL: `http://localhost:3000`

---

## Environment Variables

Required variables are validated at startup. Example .env for local development:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=TenantShield
JWT_EXPIRES_IN=24h
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

Notes:
- `CORS_ORIGINS` supports comma-separated values, e.g. `http://localhost:3000,http://localhost:3001`.
- `DATABASE_URL` defaults to SQLite. Replace with another provider if needed and run new migrations.

---

## Running Tests

The test suite uses Vitest and Supertest.

```bash
# Run once
npm test

# Watch mode
npm run test:watch
```

Environment for tests:
- Tests load environment variables via `dotenv`. Ensure required variables are present in your `.env` before running tests.
- Optional: run tests with `NODE_ENV=test`.
  - Windows (cmd):
    ```bat
    set NODE_ENV=test&& npm test
    ```
  - macOS/Linux:
    ```bash
    NODE_ENV=test npm test
    ```

---

## API Usage Guide

### Authentication
Route prefix: `/api/auth`

- Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPass123!",
    "organizationName": "Acme Corp",
    "newOrg": true
  }'
```

- Login (returns JWT)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPass123!"
  }'
```

- Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <JWT>"
```

Use the returned token in the `Authorization: Bearer <JWT>` header for protected routes.

### Projects
Route prefix: `/api/projects`

Authentication: Either `Authorization: Bearer <JWT>` OR `Authorization: ApiKey <API_KEY>`.

- List projects
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer <JWT>"
```

- Get project by id
```bash
curl http://localhost:3000/api/projects/<projectId> \
  -H "Authorization: ApiKey <API_KEY>"
```

- Create project (Admin/Manager or valid API key)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Website Redesign" }'
```

- Update project (Admin/Manager or valid API key)
```bash
curl -X PUT http://localhost:3000/api/projects/<projectId> \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "New Name" }'
```

- Delete project (Admin/Manager or valid API key)
```bash
curl -X DELETE http://localhost:3000/api/projects/<projectId> \
  -H "Authorization: ApiKey <API_KEY>"
```

### API Keys (Admin only)
Route prefix: `/api/manage-keys`

Requires `Authorization: Bearer <JWT>` for an Admin user.

- Create API key
```bash
curl -X POST http://localhost:3000/api/manage-keys \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "label": "CI key", "expiresAt": null }'
```

- List API keys for your organization
```bash
curl http://localhost:3000/api/manage-keys \
  -H "Authorization: Bearer <JWT>"
```

- Revoke API key
```bash
curl -X PUT http://localhost:3000/api/manage-keys/<keyId>/revoke \
  -H "Authorization: Bearer <JWT>"
```

- Rotate API key
```bash
curl -X PUT http://localhost:3000/api/manage-keys/<keyId>/rotate \
  -H "Authorization: Bearer <JWT>"
```

- Delete API key
```bash
curl -X DELETE http://localhost:3000/api/manage-keys/<keyId> \
  -H "Authorization: Bearer <JWT>"
```

When calling project endpoints with an API key, supply it via header: `Authorization: ApiKey <API_KEY>`.

### Admin: User Management
Route prefix: `/api/manage`

- List users in your organization (Admin)
```bash
curl http://localhost:3000/api/manage/users \
  -H "Authorization: Bearer <JWT>"
```

- Change user role to MANAGER or EMPLOYEE (Admin)
```bash
curl -X PATCH http://localhost:3000/api/manage/users/<userId>/role \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "newRole": "MANAGER" }'
```

- Delete user from organization (Admin)
```bash
curl -X DELETE http://localhost:3000/api/manage/users/<userId> \
  -H "Authorization: Bearer <JWT>"
```

---

## Development Notes
- Default welcome route: `GET /` returns service metadata and route prefixes.
- Security: Helmet, CORS (configured via `CORS_ORIGINS`), global and per-route rate limiters.
- Source maps are enabled in production start to aid debugging.
