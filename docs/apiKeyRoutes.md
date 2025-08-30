## API Key Management Routes

Base path: `/api/manage-keys`

### Auth
- Requires header `Authorization: Bearer <JWT>`
- Caller must be org `ADMIN`
- Rate-limited for abuse protection

### Endpoints

#### POST `/`
- Purpose: Create a new API key for the organization
- Body:
```json
{ "name": "CI key", "expiresInHours": 72 }
```
- Success (201): Returns metadata and the full `apiKey` value only once
- Notes: The server stores a hash; save the raw key client-side securely

#### GET `/`
- Purpose: List API keys for the organization
- Returns masked key info and metadata (not the full raw key)

#### PUT `/:keyId/revoke`
- Purpose: Revoke (deactivate) an API key

#### PUT `/:keyId/rotate`
- Purpose: Rotate an API key; issues a new raw key value
- Success: Returns new key value; store securely

#### DELETE `/:keyId`
- Purpose: Permanently delete an API key record

### Using API keys
- Include header `x-api-key: <API_KEY>` when calling eligible endpoints (e.g., `/api/projects`)
- API keys are tenant-scoped and cannot access data outside the organization
