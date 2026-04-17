# Incident Management API - Setup Instructions

## Prerequisites

Before running this project, ensure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - This will also install npm (Node Package Manager)

2. **PostgreSQL Database**
   - Install PostgreSQL on your system
   - Create a database for the project
   - Set up environment variables (see Environment Setup below)

## Environment Setup

1. Create a `.env` file in the root directory with the following content:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/incident_db?schema=public"
PORT=3000
```

Replace:
- `username` with your PostgreSQL username
- `password` with your PostgreSQL password
- `incident_db` with your database name

## Installation

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run start:prod
```

The API will be available at: `http://localhost:3000/api/v1`

## API Endpoints

### Incidents

- `POST /api/v1/incidents` - Create a new incident
- `GET /api/v1/incidents` - Get all incidents (with filtering, sorting, pagination)
- `GET /api/v1/incidents/:id` - Get incident by ID
- `PATCH /api/v1/incidents/:id` - Update incident
- `DELETE /api/v1/incidents/:id` - Delete incident

### Query Parameters for GET /incidents

- `type` - Filter by incident type
- `severity` - Filter by severity level (1-5)
- `status` - Filter by status (active, closed, verified)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (createdAt, severity)
- `order` - Sort order (asc, desc)

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## Project Structure

```
src/
├── app.module.ts          # Main application module
├── main.ts               # Application entry point
├── incidents/            # Incidents feature module
│   ├── incidents.controller.ts
│   ├── incidents.service.ts
│   ├── incidents.module.ts
│   └── dto/              # Data Transfer Objects
│       ├── create-incident.dto.ts
│       ├── update-incident.dto.ts
│       └── query-incident.dto.ts
└── prisma/               # Database module
    ├── prisma.module.ts
    └── prisma.service.ts
```

## Features Implemented

- ✅ Full CRUD operations for incidents
- ✅ Input validation with class-validator
- ✅ Database integration with Prisma ORM
- ✅ Filtering, sorting, and pagination
- ✅ Error handling
- ✅ TypeScript strict mode
- ✅ Modular architecture
- ✅ Raw SQL queries with safety measures</content>
<parameter name="filePath">c:\Advanced_Soft_Project\SETUP_INSTRUCTIONS.md