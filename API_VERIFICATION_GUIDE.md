# Feature 1: API Verification Guide

This document provides comprehensive examples for testing all endpoints of Feature 1.

## Base URL
```
http://localhost:3000/api/v1
```

---

## 1️⃣ CREATE INCIDENT

### Request
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accident",
    "severity": 5,
    "description": "Traffic accident at Main Street intersection",
    "latitude": 31.9454,
    "longitude": 35.9284,
    "status": "active"
  }'
```

### Expected Response (200 OK)
```json
{
  "id": 1,
  "type": "accident",
  "severity": 5,
  "description": "Traffic accident at Main Street intersection",
  "latitude": 31.9454,
  "longitude": 35.9284,
  "status": "active",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Cases

**Missing Required Field**
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{ "type": "accident" }'
```
Response (400 Bad Request):
```json
{
  "message": ["severity should not be empty", "description should not be empty", ...],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Invalid Status**
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accident",
    "severity": 5,
    "description": "Test",
    "latitude": 31.9454,
    "longitude": 35.9284,
    "status": "invalid_status"
  }'
```
Response (400 Bad Request):
```json
{
  "message": ["status must be one of: active, closed, verified"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 2️⃣ GET ALL INCIDENTS

### Basic Request (No Filters)
```bash
curl http://localhost:3000/api/v1/incidents
```

### Response (200 OK)
```json
{
  "data": [
    {
      "id": 1,
      "type": "accident",
      "severity": 5,
      "description": "Traffic accident at Main Street intersection",
      "latitude": 31.9454,
      "longitude": 35.9284,
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "type": "congestion",
      "severity": 3,
      "description": "Heavy traffic on Highway 1",
      "latitude": 31.9500,
      "longitude": 35.9300,
      "status": "active",
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

## 🔍 FILTERING EXAMPLES

### Filter by Type
```bash
curl "http://localhost:3000/api/v1/incidents?type=accident"
```

### Filter by Severity
```bash
curl "http://localhost:3000/api/v1/incidents?severity=5"
```

### Filter by Status
```bash
curl "http://localhost:3000/api/v1/incidents?status=active"
```

### Combined Filters
```bash
curl "http://localhost:3000/api/v1/incidents?type=accident&severity=5&status=active"
```

---

## 📄 PAGINATION EXAMPLES

### Page 1, 10 per page
```bash
curl "http://localhost:3000/api/v1/incidents?page=1&limit=10"
```

### Page 2, 20 per page
```bash
curl "http://localhost:3000/api/v1/incidents?page=2&limit=20"
```

### Response with Pagination
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "pages": 8
  }
}
```

---

## 🔤 SORTING EXAMPLES

### Sort by Creation Date (Descending - Default)
```bash
curl "http://localhost:3000/api/v1/incidents?sort=createdAt&order=desc"
```

### Sort by Creation Date (Ascending)
```bash
curl "http://localhost:3000/api/v1/incidents?sort=createdAt&order=asc"
```

### Sort by Severity (Descending)
```bash
curl "http://localhost:3000/api/v1/incidents?sort=severity&order=desc"
```

### Sort by Severity (Ascending)
```bash
curl "http://localhost:3000/api/v1/incidents?sort=severity&order=asc"
```

### Invalid Sort Field
```bash
curl "http://localhost:3000/api/v1/incidents?sort=invalid_field"
```
Response (400 Bad Request):
```json
{
  "message": "Invalid sort field. Allowed fields: createdAt, severity",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🧩 COMPLEX QUERY EXAMPLE

### All Parameters Combined
```bash
curl "http://localhost:3000/api/v1/incidents?type=accident&severity=5&status=active&page=1&limit=10&sort=createdAt&order=desc"
```

This fetches:
- Incidents of type "accident"
- With severity 5
- With status "active"
- First 10 results
- Sorted by creation date (newest first)

---

## 🔍 GET SINGLE INCIDENT

### Request
```bash
curl http://localhost:3000/api/v1/incidents/1
```

### Success Response (200 OK)
```json
{
  "id": 1,
  "type": "accident",
  "severity": 5,
  "description": "Traffic accident at Main Street intersection",
  "latitude": 31.9454,
  "longitude": 35.9284,
  "status": "active",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Not Found Response (404)
```bash
curl http://localhost:3000/api/v1/incidents/999
```
Response:
```json
{
  "message": "Incident with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## ✏️ UPDATE INCIDENT

### Update All Fields
```bash
curl -X PATCH http://localhost:3000/api/v1/incidents/1 \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accident",
    "severity": 8,
    "description": "Updated: Major accident with multiple vehicles",
    "latitude": 31.9460,
    "longitude": 35.9290,
    "status": "verified"
  }'
```

### Partial Update (Some Fields)
```bash
curl -X PATCH http://localhost:3000/api/v1/incidents/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed",
    "severity": 3
  }'
```

### Response (200 OK)
```json
{
  "id": 1,
  "type": "accident",
  "severity": 3,
  "description": "Traffic accident at Main Street intersection",
  "latitude": 31.9454,
  "longitude": 35.9284,
  "status": "closed",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Error: No Fields Provided
```bash
curl -X PATCH http://localhost:3000/api/v1/incidents/1 \
  -H "Content-Type: application/json" \
  -d '{}'
```
Response (400 Bad Request):
```json
{
  "message": "No fields provided to update",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error: Record Not Found
```bash
curl -X PATCH http://localhost:3000/api/v1/incidents/999 \
  -H "Content-Type: application/json" \
  -d '{ "status": "closed" }'
```
Response (404 Not Found):
```json
{
  "message": "Incident with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 🗑️ DELETE INCIDENT

### Request
```bash
curl -X DELETE http://localhost:3000/api/v1/incidents/1
```

### Success Response (200 OK)
```json
{
  "id": 1,
  "type": "accident",
  "severity": 5,
  "description": "Traffic accident at Main Street intersection",
  "latitude": 31.9454,
  "longitude": 35.9284,
  "status": "active",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Not Found Response (404)
```bash
curl -X DELETE http://localhost:3000/api/v1/incidents/999
```
Response:
```json
{
  "message": "Incident with ID 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 🧪 POSTMAN COLLECTION

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Feature 1: Incidents API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Incident",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/incidents",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"type\": \"accident\",\n  \"severity\": 5,\n  \"description\": \"Test incident\",\n  \"latitude\": 31.9454,\n  \"longitude\": 35.9284,\n  \"status\": \"active\"\n}"
        }
      }
    },
    {
      "name": "Get All Incidents",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/incidents"
      }
    },
    {
      "name": "Get Single Incident",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/incidents/1"
      }
    },
    {
      "name": "Update Incident",
      "request": {
        "method": "PATCH",
        "url": "{{base_url}}/incidents/1",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"closed\"\n}"
        }
      }
    },
    {
      "name": "Delete Incident",
      "request": {
        "method": "DELETE",
        "url": "{{base_url}}/incidents/1"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1"
    }
  ]
}
```

---

## 🚀 RUNNING THE TESTS

### Start Development Server
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

### Create Sample Data
```bash
# Create multiple incidents for testing
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/incidents \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"incident_type_$i\",
      \"severity\": $((RANDOM % 10 + 1)),
      \"description\": \"Test incident $i\",
      \"latitude\": 31.945$i,
      \"longitude\": 35.928$i,
      \"status\": \"active\"
    }"
done
```

### Run Unit Tests
```bash
npm test
```

### Run E2E Tests
```bash
npm run test:e2e
```

---

## 📊 PERFORMANCE EXPECTATIONS

- **Create:** < 50ms
- **Read (single):** < 10ms
- **Read (all, no filters):** < 100ms for 10,000 records
- **Read (all, with filters):** < 200ms for 10,000 records
- **Update:** < 50ms
- **Delete:** < 50ms

(Times may vary based on database performance and server resources)

---

## ✅ VERIFICATION CHECKLIST

After implementation, verify:

- [x] All endpoints respond with correct HTTP status codes
- [x] Validation errors are caught and reported properly
- [x] Filtering works for type, severity, and status
- [x] Pagination works with page and limit parameters
- [x] Sorting works for createdAt and severity
- [x] Default status is "active" for new incidents
- [x] Status can be updated to active, closed, verified
- [x] SQL injection attempts are blocked
- [x] Not found errors return 404
- [x] Invalid sort fields return 400 with helpful message
- [x] Response structure includes meta information
- [x] All fields are properly typed and validated

---

## 🔄 ALTERNATIVE ORM METHOD

The service also includes `findAllWithORM()` which provides the same functionality without raw SQL:

```typescript
// Internal use - can be exposed via separate endpoint if needed
const result = await this.incidentsService.findAllWithORM(query);
```

This demonstrates both raw SQL and ORM capabilities, allowing you to choose based on needs.

---

## 📝 NOTES

- All endpoints are versioned under `/api/v1/`
- DTOs automatically validate request data
- Global ValidationPipe is configured in main.ts
- All errors are caught and formatted consistently
- Timestamps are in UTC (ISO 8601 format)
- Database returns results in created date order by default
