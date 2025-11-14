# Node.js/Express Backend - Architecture Documentation

## Overview
This is the primary backend implementation using Node.js with Express framework and TypeScript. It serves as the reference implementation that will be ported to Flask, FastAPI, and Go.

## Technology Stack

### Core Framework
- **Node.js**: v18+ (LTS)
- **Express**: v4.18+ - Minimal and flexible web framework
- **TypeScript**: v5+ - Type safety and better developer experience

### Database & ORM
- **PostgreSQL**: v15+ - Primary database
- **Prisma**: v5+ - Modern TypeScript-first ORM
  - Type-safe database client
  - Automatic migrations
  - Schema introspection

### Caching & Session
- **Redis**: v7+ - In-memory data store
- **ioredis**: Redis client for Node.js
- **connect-redis**: Session store for Express

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing
- **helmet**: Security headers middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting
- **express-validator** or **Zod**: Input validation

### File Upload
- **Multer**: Multipart/form-data file uploads
- **Sharp**: Image processing and optimization

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertions
- **ts-jest**: TypeScript support for Jest

### Developer Tools
- **ts-node-dev**: Development server with auto-reload
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

## Project Structure

```
backend-nodejs/
├── CLAUDE.md (this file)
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/             # Migration history
│   └── seed.ts                 # Seed data script
│
├── src/
│   ├── index.ts                # Application entry point
│   ├── app.ts                  # Express app configuration
│   ├── server.ts               # Server startup
│   │
│   ├── config/                 # Configuration files
│   │   ├── database.ts         # Prisma client instance
│   │   ├── redis.ts            # Redis client instance
│   │   ├── env.ts              # Environment variables
│   │   └── constants.ts        # Application constants
│   │
│   ├── middlewares/            # Express middlewares
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   ├── error.middleware.ts # Error handling
│   │   ├── validate.middleware.ts # Request validation
│   │   ├── upload.middleware.ts # File upload
│   │   └── rateLimiter.middleware.ts
│   │
│   ├── routes/                 # Route definitions
│   │   ├── index.ts            # Main router
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── category.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   ├── review.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   ├── category.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   ├── review.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── category.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── review.service.ts
│   │   ├── user.service.ts
│   │   ├── email.service.ts
│   │   └── cache.service.ts
│   │
│   ├── repositories/           # Data access layer (optional)
│   │   ├── product.repository.ts
│   │   ├── order.repository.ts
│   │   └── user.repository.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── express.d.ts        # Express extensions
│   │   ├── auth.types.ts
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts           # Logging utility
│   │   ├── asyncHandler.ts     # Async error wrapper
│   │   ├── AppError.ts         # Custom error class
│   │   ├── jwt.ts              # JWT utilities
│   │   ├── password.ts         # Password utilities
│   │   └── validators.ts       # Custom validators
│   │
│   └── validators/             # Zod schemas
│       ├── auth.schema.ts
│       ├── product.schema.ts
│       ├── order.schema.ts
│       └── user.schema.ts
│
├── tests/                      # Test files
│   ├── setup.ts                # Test setup
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   └── integration/
│       ├── auth.test.ts
│       ├── product.test.ts
│       └── order.test.ts
│
└── uploads/                    # Uploaded files (development)
    └── products/
```

## Architecture Layers

### 1. Routes Layer
**Responsibility**: Define API endpoints and map them to controllers

```typescript
// routes/product.routes.ts
import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { productSchema } from '../validators/product.schema';

const router = Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/',
  authenticate,
  authorize('admin'),
  validate(productSchema.create),
  productController.createProduct
);

export default router;
```

### 2. Controllers Layer
**Responsibility**: Handle HTTP requests, validate input, call services, return responses

```typescript
// controllers/product.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, search, category } = req.query;

    const result = await productService.getProducts({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search: search as string,
      category: category as string,
    });

    res.json({
      success: true,
      data: result.products,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }
);
```

### 3. Services Layer
**Responsibility**: Business logic, database operations, external API calls

```typescript
// services/product.service.ts
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AppError } from '../utils/AppError';
import * as cacheService from './cache.service';

interface GetProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export const getProducts = async (params: GetProductsParams) => {
  const { page, limit, search, category } = params;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  // Check cache
  const cacheKey = `products:${JSON.stringify(params)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        images: { where: { isPrimary: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    products,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  // Cache result
  await cacheService.set(cacheKey, result, 300); // 5 minutes

  return result;
};
```

### 4. Middlewares
**Responsibility**: Cross-cutting concerns (auth, validation, error handling)

```typescript
// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
};
```

## Database Design (Prisma Schema)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  role          Role      @default(CUSTOMER)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  addresses     Address[]
  orders        Order[]
  reviews       Review[]

  @@map("users")
}

enum Role {
  CUSTOMER
  ADMIN
}

model Address {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  street    String
  city      String
  state     String
  zipCode   String   @map("zip_code")
  country   String
  isDefault Boolean  @default(false) @map("is_default")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders    Order[]

  @@map("addresses")
}

model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  parentId    String?    @map("parent_id")
  createdAt   DateTime   @default(now()) @map("created_at")

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]

  @@map("categories")
}

model Product {
  id           String         @id @default(uuid())
  name         String
  slug         String         @unique
  description  String
  price        Decimal        @db.Decimal(10, 2)
  comparePrice Decimal?       @map("compare_price") @db.Decimal(10, 2)
  cost         Decimal?       @db.Decimal(10, 2)
  sku          String         @unique
  categoryId   String         @map("category_id")
  stock        Int            @default(0)
  isActive     Boolean        @default(true) @map("is_active")
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  category     Category       @relation(fields: [categoryId], references: [id])
  images       ProductImage[]
  orderItems   OrderItem[]
  reviews      Review[]

  @@map("products")
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  url       String
  altText   String?  @map("alt_text")
  isPrimary Boolean  @default(false) @map("is_primary")
  order     Int      @default(0)

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model Order {
  id                String      @id @default(uuid())
  userId            String      @map("user_id")
  orderNumber       String      @unique @map("order_number")
  status            OrderStatus @default(PENDING)
  subtotal          Decimal     @db.Decimal(10, 2)
  tax               Decimal     @db.Decimal(10, 2)
  shipping          Decimal     @db.Decimal(10, 2)
  total             Decimal     @db.Decimal(10, 2)
  shippingAddressId String      @map("shipping_address_id")
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")

  user              User        @relation(fields: [userId], references: [id])
  shippingAddress   Address     @relation(fields: [shippingAddressId], references: [id])
  items             OrderItem[]

  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  productId String   @map("product_id")
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  total     Decimal  @db.Decimal(10, 2)

  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model Review {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  userId    String   @map("user_id")
  rating    Int
  comment   String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([productId, userId])
  @@map("reviews")
}
```

## Redis Data Structures

### 1. Shopping Cart
```typescript
// Key: cart:{userId}
// Type: Hash
// Structure:
{
  "product_id_1": "2",  // quantity
  "product_id_2": "1",
  "product_id_3": "5"
}

// Operations:
await redis.hset(`cart:${userId}`, productId, quantity);
await redis.hget(`cart:${userId}`, productId);
await redis.hgetall(`cart:${userId}`);
await redis.hdel(`cart:${userId}`, productId);
await redis.del(`cart:${userId}`);
```

### 2. Session Storage
```typescript
// Key: session:{sessionId}
// Type: String (JSON)
// TTL: 7 days

await redis.setex(`session:${sessionId}`, 604800, JSON.stringify(sessionData));
await redis.get(`session:${sessionId}`);
```

### 3. Product Cache
```typescript
// Key: product:{productId}
// Type: String (JSON)
// TTL: 5 minutes

await redis.setex(`product:${productId}`, 300, JSON.stringify(product));
```

### 4. Rate Limiting
```typescript
// Key: ratelimit:{userId}:{endpoint}
// Type: String
// TTL: 1 minute

const key = `ratelimit:${userId}:${endpoint}`;
const current = await redis.incr(key);
if (current === 1) {
  await redis.expire(key, 60);
}
```

## API Response Formats

### Success Response
```typescript
{
  success: true,
  data: { ... },
  message: "Operation successful",
  meta: {  // For paginated responses
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details: [  // For validation errors
      {
        field: "email",
        message: "Invalid email format"
      }
    ]
  }
}
```

## Error Handling

### Custom Error Class
```typescript
// utils/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Global Error Handler
```typescript
// middlewares/error.middleware.ts
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
```

## Environment Variables

```env
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://ecommerce:ecommerce123@postgres:5432/ecommerce_db

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# Email (Optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# External APIs (Optional)
STRIPE_SECRET_KEY=
```

## Testing Strategy

### Unit Tests
```typescript
// tests/unit/services/product.service.test.ts
import * as productService from '../../../src/services/product.service';
import { prisma } from '../../../src/config/database';

jest.mock('../../../src/config/database');

describe('Product Service', () => {
  describe('getProducts', () => {
    it('should return paginated products', async () => {
      // Mock implementation
      // Assertions
    });
  });
});
```

### Integration Tests
```typescript
// tests/integration/product.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Product API', () => {
  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
```

## Performance Considerations

1. **Database Indexing**: Index foreign keys and search columns
2. **Connection Pooling**: Configure Prisma connection pool
3. **Caching**: Use Redis for frequently accessed data
4. **Pagination**: Always paginate large datasets
5. **N+1 Queries**: Use Prisma `include` carefully
6. **Compression**: Enable gzip compression
7. **Rate Limiting**: Protect endpoints from abuse

## Security Checklist

- [x] Password hashing with bcrypt
- [x] JWT token expiration
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS protection (sanitization)
- [x] CORS configuration
- [x] Helmet security headers
- [x] Rate limiting
- [x] File upload validation
- [ ] CSRF protection (if using cookies)
- [ ] SSL/TLS in production

## Deployment

### Docker Build
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

### Health Check Endpoint
```typescript
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
