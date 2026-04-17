# Feature 1: Quick Start Guide

Get the project up and running in 5 minutes!

---

## 📋 Prerequisites

- **Node.js** 18.x or higher
  - [Download](https://nodejs.org/)
  - Verify: `node --version`

- **PostgreSQL** 12+ running locally
  - [Download](https://www.postgresql.org/download/)
  - Verify: `psql --version`

- **npm** (comes with Node.js)
  - Verify: `npm --version`

---

## 🚀 Setup in 5 Steps

### Step 1: Navigate to Project
```bash
cd c:\Advanced_Soft_Project
```

### Step 2: Install Dependencies
```bash
npm install
```
This installs all packages including:
- NestJS framework
- Prisma ORM
- class-validator (DTO validation)
- class-transformer (type conversion)
- PostgreSQL driver

### Step 3: Verify Database Configuration
```bash
# Check .env file
cat .env

# Should contain:
# DATABASE_URL="postgresql://postgres:@localhost:5432/wasel_db"
```

**If you need to change the connection string:**
```bash
# Edit .env file
# Update DATABASE_URL with your PostgreSQL credentials
```

### Step 4: Initialize Database
```bash
# Push Prisma schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 5: Start Development Server
```bash
npm run start:dev
```

Expected output:
```
[Nest] 12345   - 01/15/2024, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345   - 01/15/2024, 10:30:01 AM     LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] 12345   - 01/15/2024, 10:30:01 AM     LOG [InstanceLoader] IncidentsModule dependencies initialized
[Nest] 12345   - 01/15/2024, 10:30:01 AM     LOG [NestApplication] Nest application successfully started
```

---

## ✅ Verify It's Working

### Test the API
```bash
# Create an incident
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "severity": 5,
    "description": "Test incident",
    "latitude": 31.9454,
    "longitude": 35.9284
  }'

# You should receive a response with your incident data including auto-generated id and status: "active"
```

### Check Database
```bash
# Connect to database
psql -U postgres -d wasel_db

# View incidents table
SELECT * FROM "Incident";

# Exit
\q
```

---

## 📁 Project Structure

```
c:/Advanced_Soft_Project/
├── src/
│   ├── incidents/                  # Incident feature
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   ├── create-incident.dto.ts
│   │   │   ├── update-incident.dto.ts
│   │   │   └── query-incident.dto.ts
│   │   ├── incidents.controller.ts # HTTP endpoints
│   │   ├── incidents.service.ts    # Business logic (100+ lines)
│   │   └── incidents.module.ts     # Feature module
│   ├── prisma/
│   │   ├── prisma.service.ts       # DB connection
│   │   └── prisma.module.ts        # Global DB module
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Root controller
│   ├── app.service.ts              # Root service
│   └── main.ts                     # Bootstrap (Entry point)
├── prisma/
│   └── schema.prisma               # Database schema
├── test/
│   └── app.e2e-spec.ts             # E2E tests
├── .env                            # Environment variables
├── package.json                    # Dependencies
└── README.md                       # Original docs
```

---

## 🧪 Running Tests

### Unit Tests
```bash
npm test
```

### Watch Mode (Re-run on file changes)
```bash
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:cov
```

---

## 🔨 Available Commands

```bash
# Development
npm run start           # Run once
npm run start:dev       # Run with watch (recommended)
npm run start:debug     # Debug mode

# Production
npm run build          # Compile TypeScript
npm run start:prod     # Run compiled code

# Testing
npm test               # Run unit tests
npm run test:watch     # Re-run on changes
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests

# Code Quality
npm run lint           # Lint and fix code
npm run format         # Format with Prettier

# Database
npx prisma db push     # Sync schema with database
npx prisma db pull     # Pull schema from database
npx prisma studio     # Open Prisma Studio GUI
npx prisma generate   # Generate Prisma client
```

---

## 📚 API Endpoints

All endpoints are under `/api/v1/incidents`

### CRUD Operations
```
POST   /api/v1/incidents              Create incident
GET    /api/v1/incidents              Get all incidents (with filtering)
GET    /api/v1/incidents/:id          Get single incident
PATCH  /api/v1/incidents/:id          Update incident
DELETE /api/v1/incidents/:id          Delete incident
```

### Example: Get with Filters
```bash
curl "http://localhost:3000/api/v1/incidents?type=accident&severity=5&status=active&page=1&limit=10&sort=createdAt&order=desc"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@nestjs/common'"
**Solution:**
```bash
npm install
npm list
```

### Issue: "Error: ECONNREFUSED - PostgreSQL connection failed"
**Check database is running:**
```bash
# Windows
pg_isready -h localhost -p 5432

# Or try connecting
psql -U postgres
```

**Check DATABASE_URL in .env:**
```bash
# Format: postgresql://user:password@host:port/database
DATABASE_URL="postgresql://postgres:@localhost:5432/wasel_db"
```

### Issue: "Database 'wasel_db' does not exist"
**Create it:**
```bash
psql -U postgres -c "CREATE DATABASE wasel_db;"
npx prisma db push
```

### Issue: "Port 3000 already in use"
**Either:**
```bash
# Option 1: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Option 2: Use different port
PORT=3001 npm run start:dev
```

### Issue: ValidationPipe not working
**Check main.ts:**
```typescript
// main.ts should have this:
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

---

## 💡 Development Workflow

### 1. Make Code Changes
Edit files in `src/`
```bash
# Example: src/incidents/incidents.service.ts
vim src/incidents/incidents.service.ts
```

### 2. Auto-Reload (Already Happening)
The dev server watches files and reloads automatically:
```bash
npm run start:dev
# File changes detected... recompiling...
```

### 3. Test Your Changes
```bash
# Method 1: curl
curl http://localhost:3000/api/v1/incidents

# Method 2: Postman/Insomnia
# Import the provided Postman collection

# Method 3: Automated tests
npm test
```

### 4. Check for Errors
```bash
npm run lint
npm run build
```

### 5. Commit Changes
```bash
git add .
git commit -m "Feature: Add new endpoint"
git push
```

---

## 🎓 Next Steps

### Learning Resources

1. **NestJS Documentation**
   - https://docs.nestjs.com
   - Great for understanding the framework

2. **Prisma Documentation**
   - https://www.prisma.io/docs
   - Reference for ORM queries

3. **TypeScript Handbook**
   - https://www.typescriptlang.org/docs
   - Type system reference

### Looking at the Code

1. **Start with Controller**
   - `src/incidents/incidents.controller.ts`
   - Shows all available endpoints

2. **Then Service**
   - `src/incidents/incidents.service.ts`
   - Shows business logic and queries

3. **Then DTOs**
   - `src/incidents/dto/`
   - Shows validation rules

4. **Then Prisma**
   - `prisma/schema.prisma`
   - Shows database structure

### Making Changes

To add a new feature:
1. Update Prisma schema (if needed)
2. Add new DTO
3. Add service method
4. Add controller endpoint
5. Test it
6. Document it

---

## 📊 Project Health

### Check Status
```bash
# Build check
npm run build

# Lint check
npm run lint

# All tests
npm run test

# Health endpoint (if you add it)
curl http://localhost:3000/health
```

### Performance Monitoring
```bash
# Check Node.js process
node --version
npm --version

# Memory usage (while running)
# Ctrl + C to exit
while true; do top -bn1 | grep node; sleep 1; done
```

---

## 🔐 Security Checklist

- [x] SQL injection prevention (whitelist validation)
- [x] Input validation (DTOs with class-validator)
- [x] Error handling (no stack traces exposed)
- [x] Environment variables (.env file)
- [ ] HTTPS (add in production)
- [ ] Rate limiting (can add with @nestjs/throttler)
- [ ] CORS (can configure if needed)
- [ ] Authentication (not implemented yet)

---

## 📚 Documentation Files

This project includes comprehensive documentation:

- **FEATURE_1_COMPLETION.md** - Complete feature overview
- **API_VERIFICATION_GUIDE.md** - API endpoint examples
- **TECHNICAL_ARCHITECTURE.md** - Deep dive into implementation
- **BEFORE_AFTER_COMPARISON.md** - Improvements made
- **QUICK_START_GUIDE.md** - This file

Read them in this order:
1. This file (Quick Start)
2. API_VERIFICATION_GUIDE (Test the API)
3. TECHNICAL_ARCHITECTURE (Understand the code)
4. BEFORE_AFTER_COMPARISON (See the improvements)
5. FEATURE_1_COMPLETION (Full feature overview)

---

## 🎯 What's Next?

### Feature 1 Complete ✅
- Road Incidents Management
- CRUD operations
- Filtering & pagination
- Validation & error handling

### Feature 2 (Checkpoints) - Ready to Build
The architecture supports adding relationships:
```prisma
model Checkpoint {
  id Int @id @default(autoincrement())
  status String
  incident Incident @relation(fields: [incidentId], references: [id])
  incidentId Int
}
```

### Feature 3+ - Prepared
- Users & authentication
- Analytics & reporting
- Real-time updates
- Mobile API

---

## 📞 Support

### Common Questions

**Q: How do I add a new endpoint?**
A: Add method to service, add endpoint to controller, add DTO for validation.

**Q: How do I filter by a new field?**
A: Add to QueryIncidentDto, update filter builders, test it.

**Q: How do I change the database?**
A: Update .env DATABASE_URL and run `npx prisma db push`.

**Q: How do I add authentication?**
A: Use @nestjs/passport and add guards to controllers.

**Q: How do I deploy this?**
A: Build with `npm run build`, set environment variables, run `npm run start:prod`.

---

## ✨ Tips & Tricks

### Quick Database Inspection
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Reset Database
```bash
# ⚠️ WARNING: This deletes all data!
npx prisma db push --force-reset
```

### Generate Mock Data
```bash
# Add to prisma/seed.ts, then:
npx prisma db seed
```

### Type Safety
```typescript
// TypeScript catches type errors at compile time:
const incident: Incident = { ...wrongData };
// Error: Property 'type' is missing
```

### Debugging in VS Code
```json
// Add to .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug",
  "program": "${workspaceFolder}/node_modules/@nestjs/cli/bin/nest.js",
  "args": ["start", "--debug", "--watch"],
  "console": "integratedTerminal"
}
```

---

## 🎉 You're Ready!

1. ✅ Dependencies installed
2. ✅ Database configured
3. ✅ Server running
4. ✅ API working
5. ✅ Ready to develop

Happy coding! 🚀

For detailed API examples, see **API_VERIFICATION_GUIDE.md**
For architecture details, see **TECHNICAL_ARCHITECTURE.md**
