# Document Management Backend Service

A comprehensive NestJS backend service for managing documents with folders, tags, scoped actions, OCR webhook ingestion, RBAC, auditing, and metrics.

## Timeline

- **Start Date:** 05Nov 2025
- **Submit Date:** --

## Features

- **Document Management**: Upload documents with primary and secondary tags
- **Folder Organization**: Organize documents by primary tags (folders)
- **Full-Text Search**: Search across documents with scope validation
- **Scoped Actions**: Run actions on folders or specific files with credit tracking
- **OCR Webhook**: Classify content and create tasks with rate limiting
- **RBAC**: Role-based access control (admin, support, moderator, user)
- **Audit Logging**: Automatic logging of all actions
- **Metrics**: Aggregated statistics endpoint

## Prerequisites

- Node.js 20+
- MongoDB 7+
- Docker & Docker Compose (optional)

## Setup

### Option 1: Using Docker Compose (Recommended)

```bash
# Start MongoDB and API
docker-compose up -d

# Or use npm script
npm run docker:up
```

The API will be available at `http://localhost:3000`

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/skydoves
   JWT_SECRET=your-secret-key-change-in-production
   ```

3. **Start MongoDB:**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7

   # Or use your local MongoDB instance
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the development server:**
   ```bash
   npm run start:dev
   # Or
   npm run dev
   ```

## API Reference

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Authentication

The service uses JWT tokens. The JWT payload should include:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user|admin|support|moderator"
}
```

**Note:** For testing, you can use any valid JWT token with the required claims. The service validates the token format but doesn't require a specific secret (mocked authentication).

### Documents

#### Upload Document
```bash
curl -X POST http://localhost:3000/v1/docs \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "primaryTag=invoices-2025" \
  -F "secondaryTags[]=financial" \
  -F "secondaryTags[]=important"
```

#### List Documents
```bash
curl -X GET http://localhost:3000/v1/docs \
  -H "Authorization: Bearer <token>"
```

#### Get Document by ID
```bash
curl -X GET http://localhost:3000/v1/docs/<document-id> \
  -H "Authorization: Bearer <token>"
```

### Folders

#### List All Folders
```bash
curl -X GET http://localhost:3000/v1/folders \
  -H "Authorization: Bearer <token>"
```

Response:
```json
[
  {
    "name": "invoices-2025",
    "tagId": "tag-id",
    "documentCount": 5
  }
]
```

#### Get Documents by Folder
```bash
curl -X GET http://localhost:3000/v1/folders/invoices-2025/docs \
  -H "Authorization: Bearer <token>"
```

### Search

#### Full-Text Search
```bash
# Search all documents
curl -X GET "http://localhost:3000/v1/search?q=invoice" \
  -H "Authorization: Bearer <token>"

# Search within a folder
curl -X GET "http://localhost:3000/v1/search?q=invoice&scope=folder&folder=invoices-2025" \
  -H "Authorization: Bearer <token>"

# Search specific files
curl -X GET "http://localhost:3000/v1/search?q=invoice&scope=files&ids[]=doc1&ids[]=doc2" \
  -H "Authorization: Bearer <token>"
```

**Note:** Cannot use both `folder` scope and `ids[]` filter simultaneously.

### Scoped Actions

#### Run Action
```bash
curl -X POST http://localhost:3000/v1/actions/run \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": {
      "type": "folder",
      "name": "invoices-2025"
    },
    "messages": [
      {
        "role": "user",
        "content": "make a CSV of vendor totals"
      }
    ],
    "actions": ["make_document", "make_csv"]
  }'
```

**Actions Available:**
- `make_document`: Creates a new document with generated text
- `make_csv`: Generates a CSV file and stores as a document

**Note:** Each action request consumes 5 credits.

#### Get Usage for Month
```bash
curl -X GET "http://localhost:3000/v1/actions/usage/month?month=12&year=2025" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "userId": "user-id",
  "credits": 25
}
```

### OCR Webhook

#### Process OCR Event
```bash
curl -X POST http://localhost:3000/v1/webhooks/ocr \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "scanner-01",
    "imageId": "img_123",
    "text": "LIMITED TIME SALE… unsubscribe: mailto:stop@brand.com",
    "meta": {
      "address": "123 Main St"
    }
  }'
```

Response:
```json
{
  "classification": "ad",
  "taskCreated": "task-id"
}
```

**Classification:**
- `official`: Contains financial/legal terms
- `ad`: Contains promotional terms

**Rate Limiting:** Maximum 3 tasks per sender per day per user.

### Metrics

#### Get Metrics
```bash
curl -X GET http://localhost:3000/v1/metrics \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "docs_total": 123,
  "folders_total": 7,
  "actions_month": 42,
  "tasks_today": 5
}
```

**Note:** Admin users see all metrics; regular users see only their own.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Scripts

- `npm run dev` - Start development server with watch mode
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Lint code
- `npm run seed` - Seed database with demo data
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers

## Design Decisions & Tradeoffs

### Architecture
- **Modular Design**: Each feature is organized into separate modules (documents, tags, folders, etc.) for better maintainability and separation of concerns.
- **NestJS Framework**: Chosen for its built-in dependency injection, modular architecture, and TypeScript support.
- **MongoDB**: Used for flexible document storage and easy schema evolution.

### Authentication & Security
- **JWT Mocking**: For this assignment, JWT validation is mocked - it accepts any valid JWT format with required claims. In production, this would use proper JWT secret validation.
- **Tenant Isolation**: All queries are filtered by `ownerId` to ensure users can only access their own data.
- **RBAC**: Role-based access control is implemented at the guard level with decorators for easy application.

### Data Modeling
- **Primary Tag Constraint**: Each document must have exactly one primary tag. This is enforced at the application level (not database level) for flexibility.
- **Document-Tag Relationship**: Uses a separate `DocumentTag` collection for many-to-many relationship with `isPrimary` flag.
- **Text Search**: MongoDB text indexes are used for full-text search. In production, consider Elasticsearch for advanced search capabilities.

### Scoped Actions
- **Mock Processor**: Uses a deterministic mock processor that generates consistent results based on input. In production, this would integrate with an actual AI/ML service.
- **Credit Tracking**: Tracks usage per user per month for billing/monitoring purposes.

### OCR Webhook
- **Classification**: Simple keyword-based classification. In production, would use ML models for better accuracy.
- **Rate Limiting**: Enforced at the application level (3 tasks per sender per day). In production, consider using Redis for distributed rate limiting.

### Auditing
- **Global Interceptor**: All actions are automatically logged via a global interceptor. This ensures comprehensive audit trails without cluttering business logic.

### Performance Considerations
- **Indexes**: Created indexes on frequently queried fields (`ownerId`, `tagId`, `textContent`, etc.)
- **Async Operations**: Audit logging is done asynchronously to not block request processing.

### Known Limitations & Shortcuts
1. **File Storage**: Files are stored on the local filesystem. In production, use cloud storage (S3, GCS, etc.)
2. **Text Extraction**: Simplified text extraction from files. In production, use proper OCR/text extraction libraries.
3. **JWT Validation**: Mocked for assignment purposes. Production would require proper secret validation.
4. **Rate Limiting**: Application-level only. Production would need distributed rate limiting.
5. **Search**: Basic MongoDB text search. Production would benefit from Elasticsearch or similar.

## What I'd Do Next With More Time

1. **Production-Ready Features:**
   - Implement proper file storage (S3/GCS)
   - Add real OCR/text extraction libraries
   - Implement proper JWT secret validation
   - Add distributed rate limiting with Redis
   - Integrate with real AI/ML services for actions

2. **Testing:**
   - Add more comprehensive E2E tests
   - Add integration tests for all endpoints
   - Add tests for RBAC scenarios
   - Add load testing

3. **Observability:**
   - Add Prometheus metrics endpoint
   - Implement structured logging (Winston/Pino)
   - Add distributed tracing (OpenTelemetry)
   - Add health check endpoints

4. **API Enhancements:**
   - Add pagination for list endpoints
   - Add filtering and sorting options
   - Generate OpenAPI/Swagger documentation
   - Add request/response validation improvements

5. **Security:**
   - Add input sanitization
   - Implement rate limiting middleware
   - Add CORS configuration
   - Implement proper error handling to avoid information leakage

6. **CI/CD:**
   - Set up GitHub Actions or similar
   - Add automated testing on PR
   - Add automated deployment pipelines

7. **Documentation:**
   - Generate OpenAPI specification
   - Create Postman/Bruno collection
   - Add API documentation website

8. **Performance:**
   - Add caching layer (Redis)
   - Optimize database queries
   - Add connection pooling
   - Implement request batching where applicable

## License

This project is created for evaluation purposes.
