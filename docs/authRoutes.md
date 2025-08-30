## Auth Routes

Base path: `/api/auth`

### Overview
- Public endpoints: `POST /register`, `POST /login`
- Protected endpoint: `POST /logout` (requires `Authorization: Bearer <JWT>`)
- Login and Register are rate-limited for abuse protection

### Endpoints

#### POST `/register`
- Purpose: Register a user and either create a new organization or join an existing one
- Body (JSON):
```json
{
  "email": "admin@example.com",
  "password": "StrongPass123!",
  "organizationName": "Acme Corp",
  "newOrg": true
}
```
- Success (201) returns a JWT and user info (shape abbreviated):
```json
{
  "success": true,
  "message": "User registered successfully and organization created",
  "data": {
    "token": "<JWT>",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "ADMIN",
      "organization": { "id": "...", "name": "Acme Corp", "slug": "acme-corp" }
    }
  }
}
```

#### POST `/login`
- Purpose: Authenticate and receive a JWT
- Body (JSON):
```json
{ "email": "admin@example.com", "password": "StrongPass123!" }
```
- Success (200) returns:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT>",
    "user": { "id": "...", "email": "admin@example.com", "role": "ADMIN", "organization": { "id": "...", "name": "Acme Corp", "slug": "acme-corp" } }
  }
}
```

#### POST `/logout`
- Purpose: Logical logout; instructs clients to remove stored token
- Auth: Header `Authorization: Bearer <JWT>`
- Success (200):
```json
{ "success": true, "message": "Logged out successfully. Please remove the token from client storage." }
```

### Notes
- Use header `Authorization: Bearer <JWT>` for protected routes
- Validation errors return HTTP 400 with field messages; auth failures return 401
