## Project Routes

Base path: `/api/projects`

### Auth
- Supports either: `Authorization: Bearer <JWT>` OR header `x-api-key: <API_KEY>`
- All requests are tenant-scoped via middleware
- Role requirements:
  - Read (GET): Any authenticated user or valid API key
  - Write (POST/PUT/DELETE): Org `ADMIN` or `MANAGER`, or valid API key

### Endpoints

#### GET `/`
- Purpose: List all projects for the authenticated organization
- Auth: JWT or x-api-key
- Response: Array of projects

#### GET `/:projectId`
- Purpose: Get project by id within the same organization
- Auth: JWT or x-api-key

#### POST `/`
- Purpose: Create a project
- Auth: Admin/Manager or API key
- Body:
```json
{ "name": "Website Redesign" }
```

#### PUT `/:projectId`
- Purpose: Update a project
- Auth: Admin/Manager or API key
- Body:
```json
{ "name": "New Name" }
```

#### DELETE `/:projectId`
- Purpose: Delete a project
- Auth: Admin/Manager or API key

### Notes
- All project operations are restricted to the caller's organization
- Validation is applied on IDs and payloads; errors return HTTP 400 with details
