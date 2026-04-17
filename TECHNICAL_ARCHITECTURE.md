# Feature 1: Technical Architecture & Implementation Details

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Module Structure](#module-structure)
3. [Service Layer Deep Dive](#service-layer-deep-dive)
4. [DTO Validation](#dto-validation)
5. [Error Handling Strategy](#error-handling-strategy)
6. [Database Queries](#database-queries)
7. [Security Considerations](#security-considerations)
8. [Performance Optimizations](#performance-optimizations)
9. [Extending the Feature](#extending-the-feature)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request (REST API)                  │
│                    GET /api/v1/incidents                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                IncidentsController                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Handles routing                                    │   │
│  │ - Validates DTOs (ValidationPipe)                   │   │
│  │ - Delegates to service                              │   │
│  │ - Returns response to client                         │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              IncidentsService (Business Logic)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Public Methods:                                      │   │
│  │ - create(dto) → Incident                            │   │
│  │ - findAll(query) → { data, meta }                   │   │
│  │ - findOne(id) → Incident                            │   │
│  │ - update(id, dto) → Incident                        │   │
│  │ - remove(id) → Incident                             │   │
│  │ - findAllWithORM(query) → { data, meta } [ORM ALT]  │   │
│  │                                                      │   │
│  │ Private Helper Methods:                              │   │
│  │ - parsePaginationParams()                            │   │
│  │ - validateSortParams() [Security: Whitelist]        │   │
│  │ - buildFilterConditions() [Raw SQL]                 │   │
│  │ - buildWhereConditions() [ORM]                       │   │
│  │ - executeRawQuery() [Raw SQL Execution]             │   │
│  │ - countIncidents() [Unified Count Logic]            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PrismaService                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Extends PrismaClient                              │   │
│  │ - Connection Management (onModuleInit/Destroy)      │   │
│  │ - Query Execution                                    │   │
│  │ - Error Handling                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Table: Incident                                      │   │
│  │ - id (PK, auto-increment)                            │   │
│  │ - type (String)                                      │   │
│  │ - severity (Int)                                     │   │
│  │ - description (String)                               │   │
│  │ - latitude (Float)                                   │   │
│  │ - longitude (Float)                                  │   │
│  │ - status (Enum: active|closed|verified)              │   │
│  │ - createdAt (DateTime, auto-timestamp)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Structure

### File Organization
```
src/
├── incidents/
│   ├── dto/
│   │   ├── create-incident.dto.ts      # Request validation DTO
│   │   ├── update-incident.dto.ts      # Partial update DTO
│   │   └── query-incident.dto.ts       # Query params validation
│   ├── incidents.controller.ts         # HTTP request handling
│   ├── incidents.service.ts            # Business logic
│   └── incidents.module.ts             # Module definition
├── prisma/
│   ├── prisma.service.ts               # DB connection management
│   └── prisma.module.ts                # Global module export
├── app.module.ts                       # App root module
└── main.ts                             # Bootstrap

prisma/
└── schema.prisma                       # Database schema
```

### Module Dependency Graph
```
AppModule
├── PrismaModule (Global)
│   └── PrismaService
│       └── PostgreSQL Driver
└── IncidentsModule
    ├── PrismaService (from Global)
    ├── IncidentsController
    └── IncidentsService

```

---

## Service Layer Deep Dive

### Method Flow Diagrams

#### 1. CREATE Flow
```
create(DTO)
  ↓
Try:
  ├─ Spread DTO data
  ├─ Set default status = 'active' if not provided
  └─ Prisma.incident.create()
      └─ Return Incident
Catch:
  └─ Throw InternalServerErrorException
```

#### 2. FIND ALL (Raw SQL) Flow
```
findAll(QueryIncidentDto)
  ↓
Try:
  ├─ parsePaginationParams()
  │   ├─ Validate page ≥ 1
  │   ├─ Validate 1 ≤ limit ≤ 100
  │   └─ Calculate offset
  │
  ├─ validateSortParams() [SECURITY CRITICAL]
  │   ├─ Check sortField in ALLOWED_SORT_FIELDS
  │   ├─ Check sortOrder in ALLOWED_SORT_ORDERS
  │   └─ Throw BadRequestException if invalid
  │
  ├─ buildFilterConditions()
  │   ├─ If type → Add: "type" = ${type}
  │   ├─ If severity → Add: "severity" = ${severity}
  │   └─ If status → Add: "status" = ${status}
  │
  ├─ executeRawQuery()
  │   ├─ Build: SELECT * FROM "Incident"
  │   ├─ Add WHERE with conditions (if any)
  │   ├─ Add ORDER BY with validated sortField
  │   ├─ Add LIMIT and OFFSET
  │   └─ Execute with $queryRaw (parameterized)
  │
  ├─ countIncidents()
  │   ├─ buildWhereConditions() [Same logic as filters]
  │   └─ Prisma.incident.count()
  │
  ├─ Calculate pages = Math.ceil(total / limit)
  │
  └─ Return { data, meta: { total, page, limit, pages } }

Catch BadRequestException:
  └─ Re-throw (validation error)

Catch Other:
  └─ Throw InternalServerErrorException
```

#### 3. UPDATE (Optimized) Flow
```
update(id, DTO)
  ↓
Try:
  ├─ Check if DTO is empty
  │   └─ If empty → Throw BadRequestException
  │
  └─ Prisma.incident.update()
      ├─ where: { id }
      ├─ data: DTO
      └─ Return Incident

Catch Prisma.PrismaClientKnownRequestError:
  ├─ If error.code === 'P2025' (not found)
  │   └─ Throw NotFoundException
  └─ Otherwise → Throw InternalServerErrorException

Catch Other Exceptions:
  └─ Re-throw or Throw InternalServerErrorException
```

#### 4. DELETE (Optimized) Flow
```
remove(id)
  ↓
Try:
  └─ Prisma.incident.delete()
      ├─ where: { id }
      └─ Return Incident (for confirmation)

Catch Prisma.PrismaClientKnownRequestError:
  ├─ If error.code === 'P2025' (not found)
  │   └─ Throw NotFoundException
  └─ Otherwise → Throw InternalServerErrorException

Catch Other:
  └─ Throw InternalServerErrorException
```

---

## DTO Validation

### CreateIncidentDto
```typescript
export class CreateIncidentDto {
  @IsString()                              // Type check
  @IsNotEmpty()                            // Cannot be empty
  type: string;                            // Example: "accident"

  @Type(() => Number)                      // Convert to number
  @IsInt()                                 // Must be integer
  @Min(1)                                  // Minimum value
  severity: number;                        // Range: 1-100+

  @IsString()
  @IsNotEmpty()
  description: string;                     // Details of incident

  @Type(() => Number)
  @IsNumber()                              // Must be valid number
  latitude: number;                        // Geographic coordinate

  @Type(() => Number)
  @IsNumber()
  longitude: number;                       // Geographic coordinate

  @IsOptional()                            // Not required
  @IsString()
  @IsIn(['active', 'closed', 'verified'])  // Enum validation
  status?: string = 'active';              // Default value
}
```

### UpdateIncidentDto
```typescript
export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {}
// All fields become optional (except id, which isn't here)
```

### QueryIncidentDto
```typescript
export class QueryIncidentDto {
  // Filters
  @IsOptional()
  @IsString()
  type?: string;                           // Filter by type

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  severity?: number;                       // Filter by severity

  @IsOptional()
  @IsString()
  @IsIn(['active', 'closed', 'verified'])
  status?: string;                         // Filter by status

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;                       // Default: 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;                     // Default: 20, Max: 100

  // Sorting
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'severity'])
  sort?: 'createdAt' | 'severity' = 'createdAt';  // Default: createdAt

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';         // Default: desc
}
```

### Validation Execution
```
Request arrives with body/query
  ↓
ValidationPipe (main.ts) processes
  ├─ Check whitelist mode (remove unknown properties)
  ├─ Transform types (@Type decorators)
  ├─ Run validators (@IsString, @IsInt, etc.)
  └─ Run custom validators (@IsIn, @Min, etc.)
  
If validation passes:
  └─ Pass to controller method
  
If validation fails:
  └─ Return 400 Bad Request with error details
```

---

## Error Handling Strategy

### Exception Hierarchy
```
NotFoundException              → 404 Not Found
  Use: Record doesn't exist

BadRequestException            → 400 Bad Request
  Use: Invalid input, validation failure

InternalServerErrorException   → 500 Internal Server Error
  Use: Unexpected server error
```

### Error Handling Pattern
```typescript
try {
  // Attempt operation
  const result = await this.prisma.incident.findUnique({...});
  return result;
} catch (error) {
  // Handle specific Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {  // Record not found
      throw new NotFoundException('...');
    }
  }
  
  // Re-throw validation errors
  if (error instanceof BadRequestException) {
    throw error;
  }
  
  // Default error handling
  throw new InternalServerErrorException('...');
}
```

### Prisma Error Codes
- **P2025**: Record not found (for findUnique, update, delete on non-existent record)
- **P2002**: Unique constraint violation
- **P2003**: Foreign key constraint violation
- **P2014**: Required relation violation

---

## Database Queries

### 1. Raw SQL Query (Used in findAll)
```sql
-- Base query
SELECT * FROM "Incident"

-- With filters
WHERE "type" = $1 
  AND "severity" = $2 
  AND "status" = $3

-- With sorting and pagination
ORDER BY "createdAt" DESC
LIMIT 20 OFFSET 0
```

**Parameterization:** Prisma handles parameter substitution to prevent SQL injection.

### 2. ORM Queries (Used in findAllWithORM)
```typescript
// Parallel execution
const [incidents, total] = await Promise.all([
  // Find incidents
  this.prisma.incident.findMany({
    where: {
      type: 'accident',
      severity: 5,
      status: 'active'
    },
    orderBy: { createdAt: 'desc' },
    skip: 0,
    take: 20
  }),
  
  // Count total
  this.prisma.incident.count({
    where: {
      type: 'accident',
      severity: 5,
      status: 'active'
    }
  })
]);
```

### 3. Create Query
```typescript
await this.prisma.incident.create({
  data: {
    type: 'accident',
    severity: 5,
    description: '...',
    latitude: 31.9454,
    longitude: 35.9284,
    status: 'active'  // Default if not provided
    // createdAt auto-filled by default(now())
  }
});
```

### 4. Update Query
```typescript
await this.prisma.incident.update({
  where: { id: 1 },
  data: {
    status: 'closed'  // Only field being updated
    // Other fields remain unchanged
  }
});
```

### 5. Delete Query
```typescript
await this.prisma.incident.delete({
  where: { id: 1 }  // Returns the deleted record
});
```

---

## Security Considerations

### 1. SQL Injection Prevention ✅
**Problem:** Using raw strings in SQL allows injection attacks.
```typescript
// ❌ UNSAFE - Never do this
querySql = Prisma.sql`ORDER BY ${Prisma.raw(sortField)}`;
```

**Solution:** Whitelist validation + Prisma parameterization.
```typescript
// ✅ SAFE - What we do
private readonly ALLOWED_SORT_FIELDS = ['createdAt', 'severity'];

private validateSortParams(query: QueryIncidentDto) {
  if (!this.ALLOWED_SORT_FIELDS.includes(sortField)) {
    throw new BadRequestException('Invalid sort field');
  }
  return { sortField, sortOrder };
}
```

### 2. Input Validation ✅
- All inputs validated via DTOs
- Type checking enforced
- Enum values restricted
- Numeric ranges validated
- String lengths controllable

### 3. Error Information Disclosure ✅
- Stack traces never exposed to client
- Generic error messages for 500 errors
- Specific messages for validation errors
- Database errors caught and abstracted

### 4. Rate Limiting
**Not implemented yet, but can be added:**
```typescript
// In main.ts or middleware
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,           // 60 seconds
      limit: 10,         // 10 requests
    }),
  ],
})
export class AppModule {}
```

---

## Performance Optimizations

### 1. Pagination
Limits query results to prevent memory issues:
```typescript
// Without pagination: Could return 1M rows
// With pagination: Returns max 100 per request
SELECT * FROM "Incident" LIMIT 100 OFFSET 0;
```

### 2. Parallel Queries
When fetching list with count:
```typescript
// ❌ Sequential: 2 queries × time
const incidents = await find();
const total = await count();

// ✅ Parallel: Both at same time
const [incidents, total] = await Promise.all([
  find(),
  count()
]);
```

### 3. Optimized Update/Delete
Removed unnecessary lookup before update:
```typescript
// ❌ Old: 2 DB calls
await findUnique(id);      // Query 1
await update(id, data);    // Query 2

// ✅ New: 1 DB call
await update(id, data);    // Query 1 (handles not found)
```

### 4. Database Indexing (Prisma Schema)
```prisma
model Incident {
  // ...existing fields...
  
  @@index([type])        // Index for filtering
  @@index([status])      // Index for status filter
  @@index([severity])    // Index for severity filter
  @@index([createdAt])   // Index for sorting
}
```

---

## Extending the Feature

### Adding a New Filter
1. Add field to `QueryIncidentDto`:
```typescript
@IsOptional()
@IsString()
code?: string;
```

2. Update filter builders:
```typescript
private buildFilterConditions(query: QueryIncidentDto): Prisma.Sql[] {
  // ... existing conditions ...
  if (query.code) {
    conditions.push(Prisma.sql`"code" = ${query.code}`);
  }
}

private buildWhereConditions(query: QueryIncidentDto): Prisma.IncidentWhereInput {
  // ... existing conditions ...
  ...(query.code ? { code: query.code } : {}),
}
```

### Adding a New Sort Field
1. Add to whitelist:
```typescript
private readonly ALLOWED_SORT_FIELDS = ['createdAt', 'severity', 'latitude'];
```

2. Ensure field exists in model and database

### Adding a New Status Value
1. Update Prisma enum:
```prisma
enum IncidentStatus {
  active
  closed
  verified
  archived       // New value
}
```

2. Update DTO validators:
```typescript
@IsIn(['active', 'closed', 'verified', 'archived'])
status?: string;
```

3. Run migrations:
```bash
npx prisma db push
```

### Adding Related Data (e.g., Checkpoints)
```prisma
model Incident {
  // ... existing fields ...
  checkpoints    Checkpoint[]       // One-to-Many
}

model Checkpoint {
  id       Int      @id @default(autoincrement())
  status   String
  incident Incident @relation(fields: [incidentId], references: [id])
  incidentId Int
}
```

Then query with relations:
```typescript
const incident = await this.prisma.incident.findUnique({
  where: { id },
  include: { checkpoints: true }  // Include related checkpoints
});
```

---

## Testing Structure

### Unit Tests Example
```typescript
describe('IncidentsService', () => {
  describe('create', () => {
    it('should create incident with default status', async () => {
      const dto: CreateIncidentDto = {
        type: 'test',
        severity: 5,
        description: 'test',
        latitude: 0,
        longitude: 0
      };
      
      const result = await service.create(dto);
      expect(result.status).toBe('active');
    });
  });

  describe('findAll', () => {
    it('should validate sort field against whitelist', async () => {
      const query: QueryIncidentDto = {
        sort: 'invalid_field'
      };
      
      await expect(service.findAll(query))
        .rejects.toThrow(BadRequestException);
    });
  });
});
```

---

## Monitoring & Logging

### Add Logging (Future Enhancement)
```typescript
import { Logger } from '@nestjs/common';

export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  async create(createIncidentDto: CreateIncidentDto) {
    this.logger.log(`Creating incident of type: ${createIncidentDto.type}`);
    // ... implementation ...
  }
}
```

### Health Check (Future Enhancement)
```typescript
import { HealthCheckService, HealthIndicator } from '@nestjs/terminus';

@Get('health')
check() {
  return this.health.check([
    () => this.db.pingCheck('database'),
  ]);
}
```

---

## Summary

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Type safety with TypeScript
- ✅ Security through validation and parameterization
- ✅ Performance through optimization
- ✅ Scalability through modular design
- ✅ Maintainability through clear structure
- ✅ Extensibility for future features

The implementation follows NestJS best practices and is ready for production deployment.
