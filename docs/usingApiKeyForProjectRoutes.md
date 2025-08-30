## Using API Keys with Project Routes

This guide shows how to call `/api/projects` using an API key instead of a JWT.

### 1) Create an API key (Admin only)
- Endpoint: `POST /api/manage-keys`
- Auth: `Authorization: Bearer <JWT>` (Admin)
- Body example:
```json
{ "name": "CI key", "expiresInHours": 72 }
```
- Response includes `data.apiKey` once. Store it securely.

### 2) Send requests with the API key
Project routes support flexible auth: either JWT or API key.

- Header format for API key:
```
Authorization: ApiKey <YOUR_API_KEY>
```

- Do NOT use `x-api-key`. The server expects `Authorization: ApiKey <...>`.

#### Examples

- List projects
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: ApiKey <YOUR_API_KEY>"
```

- Get a project by id
```bash
curl -X GET http://localhost:3000/api/projects/<projectId> \
  -H "Authorization: ApiKey <YOUR_API_KEY>"
```

- Create a project (API key allowed)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: ApiKey <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Website Redesign" }'
```

- Update a project
```bash
curl -X PUT http://localhost:3000/api/projects/<projectId> \
  -H "Authorization: ApiKey <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "New Name" }'
```

- Delete a project
```bash
curl -X DELETE http://localhost:3000/api/projects/<projectId> \
  -H "Authorization: ApiKey <YOUR_API_KEY>"
```

### 3) Postman usage
- Add an environment variable `apiKey` with your key value.
- At the collection or folder level, add a Pre-request Script:
```js
const key = pm.environment.get('apiKey');
if (key) {
  pm.request.headers.upsert({ key: 'Authorization', value: `ApiKey ${key}` });
}
```

### Behavior and errors
- Missing header → `401` with message: `Authorization header required. Use Bearer <jwt-token> or ApiKey <api-key>`
- Wrong header format → `401` with message: `Invalid authorization format. Use Bearer <jwt-token> or ApiKey <api-key>`
- Invalid/expired key → `401` with message: `Invalid or expired API key`

### Security notes
- API keys are tenant-scoped; they cannot access data outside your organization.
- Rotate or revoke keys with `/api/manage-keys/:keyId/rotate` and `/api/manage-keys/:keyId/revoke`.
- Treat keys like passwords: store securely and avoid committing to source control.
