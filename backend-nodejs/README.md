# E-Commerce Backend - Node.js/Express Implementation

A fully-featured e-commerce REST API built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, and Redis.

## Features

✅ **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Customer, Admin)
- Secure password hashing with bcrypt

✅ **Product Management**
- Full CRUD operations
- Advanced search, filtering, and sorting
- Hierarchical categories
- Multiple image uploads with automatic processing
- Stock/inventory management
- Product ratings and reviews

✅ **Shopping Cart**
- Redis-based cart storage for performance
- 7-day TTL (Time To Live)
- Real-time stock validation
- Cart persistence for logged-in users

✅ **Order Processing**
- Transaction-safe checkout
- Order status workflow (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
- Stock management with order creation
- Order cancellation with stock restoration
- Order history and tracking

✅ **Reviews & Ratings**
- Purchase verification (only verified buyers can review)
- One review per user per product
- Rating statistics and distribution
- Average rating calculation

✅ **User Management**
- User profiles
- Multiple shipping addresses
- Address default designation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Cache**: Redis 7+
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Image Processing**: Sharp
- **File Upload**: Multer
- **Password Hashing**: bcrypt

## Project Structure

```
backend-nodejs/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/             # Migration history
├── src/
│   ├── config/                 # Configuration (DB, Redis, env)
│   ├── controllers/            # Request handlers
│   ├── middlewares/            # Express middlewares
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   ├── utils/                  # Utility functions
│   ├── validators/             # Zod validation schemas
│   ├── app.ts                  # Express app setup
│   └── index.ts                # Entry point
├── uploads/                    # Uploaded files (development)
├── .env                        # Environment variables
├── API_DOCUMENTATION.md        # Complete API docs
├── CLAUDE.md                   # Architecture documentation
└── package.json
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Getting Started

### 1. Clone and Install

```bash
# Navigate to backend directory
cd backend-nodejs

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB
```

### 3. Start Docker Services

```bash
# From project root
docker-compose up -d

# Or start individual services
docker-compose up -d postgres redis
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Optional: Seed database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Available Scripts

```bash
# Development
npm run dev          # Start with hot reload

# Build
npm run build        # Compile TypeScript

# Production
npm start            # Run compiled JavaScript

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run migrations
npx prisma studio    # Open Prisma Studio GUI

# Prisma commands
npx prisma db push   # Push schema changes
npx prisma db seed   # Seed database
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/images` - Upload images (Admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add to cart
- `PUT /api/cart/items/:productId` - Update quantity
- `DELETE /api/cart/items/:productId` - Remove item
- `DELETE /api/cart` - Clear cart
- `GET /api/cart/validate` - Validate cart

### Orders
- `POST /api/orders` - Create order (checkout)
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update status (Admin)
- `POST /api/orders/:id/cancel` - Cancel order

### Addresses
- `GET /api/addresses` - List addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Reviews
- `GET /api/reviews?productId=uuid` - Get product reviews
- `GET /api/reviews/:id` - Get review
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/stats/:productId` - Get rating stats

### Health
- `GET /api/health` - API health check

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API documentation with examples.

## Database Schema

### Core Models

**Users**
- Authentication and user profiles
- Role-based access (CUSTOMER, ADMIN)

**Categories**
- Hierarchical structure with parent/child relationships
- Slug-based URLs

**Products**
- Full product information
- Stock tracking
- Soft delete (isActive flag)

**Product Images**
- Multiple images per product
- Primary image designation
- Automatic image processing

**Orders**
- Complete order management
- Status workflow tracking
- Transaction-safe processing

**Order Items**
- Line items with price snapshots
- Quantity tracking

**Reviews**
- Star ratings (1-5)
- User comments
- Purchase verification

**Addresses**
- Multiple shipping addresses
- Default address support

## Redis Data Structures

### Cart Storage
```
Key: cart:{userId}
Type: Hash
TTL: 7 days

Structure:
{
  "productId1": "quantity",
  "productId2": "quantity"
}
```

## Authentication

All protected endpoints require a JWT token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/cart
```

### User Roles

**CUSTOMER** (default):
- Browse products
- Manage cart
- Create orders
- Write reviews (for purchased products)
- Manage own profile and addresses

**ADMIN**:
- All customer permissions
- Manage products and categories
- Update order statuses
- View all orders
- Manage users

### Promoting User to Admin

```bash
# Via Docker
docker exec ecommerce-postgres psql -U ecommerce -d ecommerce_db \
  -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';"
```

## Testing

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login (save the token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test1234"
  }'

# Get products
curl http://localhost:3000/api/products

# Add to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_UUID",
    "quantity": 2
  }'
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {...}  // Optional validation details
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_SERVER_ERROR` - Server error

## Security Features

✅ **Password Security**
- bcrypt hashing with salt rounds
- Minimum password complexity requirements

✅ **JWT Authentication**
- Secure token generation
- Configurable expiration
- Token validation middleware

✅ **Input Validation**
- Zod schema validation
- SQL injection prevention (Prisma)
- XSS protection

✅ **Authorization**
- Role-based access control
- Resource ownership verification
- Admin-only endpoints

✅ **File Upload Security**
- File type validation
- File size limits
- Automatic image processing

## Performance Optimizations

✅ **Redis Caching**
- Cart data stored in Redis
- 7-day TTL for automatic cleanup

✅ **Database Indexing**
- Foreign keys indexed
- Search columns indexed
- Unique constraints

✅ **Efficient Queries**
- Prisma query optimization
- Selective field inclusion
- Pagination support

✅ **Image Optimization**
- Automatic resizing with Sharp
- Quality optimization
- Format conversion

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
REDIS_URL=your-production-redis-url
JWT_SECRET=strong-random-secret
```

### Docker Production Build

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Recommended Production Setup

1. **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
2. **Redis**: Managed Redis (AWS ElastiCache, Redis Cloud)
3. **File Storage**: S3 or similar (instead of local uploads)
4. **Environment**: Docker containers or serverless
5. **Monitoring**: Logging, error tracking, performance monitoring

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://ecommerce:ecommerce123@localhost:5432/ecommerce_db

# View logs
docker logs ecommerce-postgres
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping

# View logs
docker logs ecommerce-redis
```

### Prisma Issues

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Check migrations
npx prisma migrate status
```

## Contributing

1. Follow TypeScript best practices
2. Use Zod for all input validation
3. Write services for business logic
4. Keep controllers thin
5. Use async/await for all async operations
6. Handle errors with AppError class
7. Add comments for complex logic

## License

MIT

## Next Steps

- [ ] Add comprehensive unit tests (Jest)
- [ ] Add integration tests (Supertest)
- [ ] Generate OpenAPI/Swagger documentation
- [ ] Implement rate limiting
- [ ] Add request logging middleware
- [ ] Set up CI/CD pipeline
- [ ] Add database seeding
- [ ] Implement email notifications

---

**Version**: 1.0.0
**Last Updated**: 2025-11-14
**Documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and [CLAUDE.md](./CLAUDE.md)
