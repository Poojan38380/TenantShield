## Admin User Management Routes

Base path: `/api/manage`

### Auth
- Requires header `Authorization: Bearer <JWT>`
- Caller must be org `ADMIN`
- Tenant context is enforced by middleware

### Endpoints

#### GET `/users`
- Purpose: List all users in the admin's organization

#### PATCH `/users/:userId/role`
- Purpose: Change a user's role within the organization
- Body:
```json
{ "newRole": "MANAGER" }
```
- Allowed values: `MANAGER`, `EMPLOYEE`

#### DELETE `/users/:userId`
- Purpose: Remove a user from the organization

### Notes
- All operations are restricted to the admin's organization
- Input validation errors return HTTP 400; forbidden actions return 403
