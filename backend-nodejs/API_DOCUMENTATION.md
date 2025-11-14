# E-Commerce API Documentation

**Base URL**: `http://localhost:3000/api`

**Version**: 1.0.0

---

## Table of Contents
1. [Authentication](#authentication)
2. [Categories](#categories)
3. [Products](#products)
4. [Cart](#cart)
5. [Orders](#orders)
6. [Addresses](#addresses)
7. [Reviews](#reviews)
8. [Health Check](#health-check)

---

## Authentication

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "createdAt": "2025-11-14T20:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules**:
- Email: Valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, and number
- First/Last Name: Minimum 2 characters

---

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User
**GET** `/auth/me`

Get currently authenticated user profile.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "createdAt": "2025-11-14T20:00:00.000Z",
    "updatedAt": "2025-11-14T20:00:00.000Z"
  }
}
```

---

## Categories

### Get All Categories
**GET** `/categories`

Retrieve all categories with product counts.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and gadgets",
      "parentId": null,
      "productCount": 25,
      "children": [
        {
          "id": "uuid",
          "name": "Phones",
          "slug": "phones",
          "parentId": "parent-uuid"
        }
      ],
      "createdAt": "2025-11-14T20:00:00.000Z"
    }
  ]
}
```

---

### Get Category by ID
**GET** `/categories/:id`

Get single category with full details.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and gadgets",
    "parentId": null,
    "productCount": 25,
    "createdAt": "2025-11-14T20:00:00.000Z"
  }
}
```

---

### Create Category (Admin Only)
**POST** `/categories`

Create a new category.

**Headers**:
```
Authorization: Bearer {admin-token}
```

**Request Body**:
```json
{
  "name": "Laptops",
  "slug": "laptops",
  "description": "Portable computers",
  "parentId": "electronics-uuid"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "name": "Laptops",
    "slug": "laptops",
    "description": "Portable computers",
    "parentId": "electronics-uuid",
    "createdAt": "2025-11-14T20:00:00.000Z"
  }
}
```

---

### Update Category (Admin Only)
**PUT** `/categories/:id`

Update existing category.

**Headers**:
```
Authorization: Bearer {admin-token}
```

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

---

### Delete Category (Admin Only)
**DELETE** `/categories/:id`

Delete a category (only if it has no products or subcategories).

**Headers**:
```
Authorization: Bearer {admin-token}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## Products

### Get All Products
**GET** `/products`

Get paginated list of products with filtering, searching, and sorting.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search in name, description, SKU
- `category` (uuid): Filter by category ID
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sort` (string): Sort field with +/- prefix (e.g., `+price`, `-createdAt`)

**Examples**:
```
GET /products?page=1&limit=10
GET /products?search=iphone
GET /products?category=uuid&minPrice=100&maxPrice=1000
GET /products?sort=-price
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "description": "Latest Apple iPhone",
      "price": "999.99",
      "comparePrice": "1099.99",
      "sku": "IPHONE15PRO-001",
      "categoryId": "uuid",
      "stock": 50,
      "isActive": true,
      "averageRating": 4.5,
      "reviewCount": 10,
      "category": {
        "id": "uuid",
        "name": "Phones",
        "slug": "phones"
      },
      "images": [
        {
          "id": "uuid",
          "url": "/uploads/products/image.jpg",
          "altText": "iPhone front view",
          "isPrimary": true,
          "order": 0
        }
      ],
      "createdAt": "2025-11-14T20:00:00.000Z",
      "updatedAt": "2025-11-14T20:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### Get Product by ID
**GET** `/products/:id`

Get detailed product information including all images and reviews.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "iPhone 15 Pro",
    "slug": "iphone-15-pro",
    "description": "Latest Apple iPhone with A17 Pro chip",
    "price": "999.99",
    "comparePrice": "1099.99",
    "sku": "IPHONE15PRO-001",
    "stock": 50,
    "isActive": true,
    "averageRating": 4.5,
    "category": {
      "id": "uuid",
      "name": "Phones",
      "slug": "phones"
    },
    "images": [...],
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Great phone!",
        "createdAt": "2025-11-14T20:00:00.000Z"
      }
    ]
  }
}
```

---

### Create Product (Admin Only)
**POST** `/products`

Create a new product.

**Headers**:
```
Authorization: Bearer {admin-token}
```

**Request Body**:
```json
{
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Latest Apple iPhone with A17 Pro chip",
  "price": 999.99,
  "comparePrice": 1099.99,
  "sku": "IPHONE15PRO-001",
  "categoryId": "uuid",
  "stock": 50
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "iPhone 15 Pro",
    ...
  }
}
```

---

### Update Product (Admin Only)
**PUT** `/products/:id`

Update existing product.

**Headers**:
```
Authorization: Bearer {admin-token}
```

**Request Body** (all fields optional):
```json
{
  "price": 899.99,
  "stock": 100,
  "isActive": true
}
```

---

### Delete Product (Admin Only)
**DELETE** `/products/:id`

Soft delete a product (sets isActive to false).

**Headers**:
```
Authorization: Bearer {admin-token}
```

---

### Upload Product Images (Admin Only)
**POST** `/products/:id/images`

Upload images for a product.

**Headers**:
```
Authorization: Bearer {admin-token}
Content-Type: multipart/form-data
```

**Form Data**:
- `image` (file): Single image file (for single upload)
- `images` (file[]): Multiple image files (for bulk upload)
- `isPrimary` (boolean): Set as primary image
- `order` (number): Display order

**Supported formats**: JPEG, PNG, WebP
**Max file size**: 5MB per image

**Response** (201):
```json
{
  "success": true,
  "message": "Image(s) uploaded successfully",
  "data": {
    "id": "uuid",
    "url": "/uploads/products/product-123456.jpg",
    "isPrimary": true,
    "order": 0
  }
}
```

---

## Cart

### Get Cart
**GET** `/cart`

Get current user's shopping cart.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "uuid",
        "quantity": 2,
        "price": 999.99,
        "name": "iPhone 15 Pro",
        "image": "/uploads/products/iphone.jpg"
      }
    ],
    "totalItems": 2,
    "subtotal": 1999.98
  }
}
```

---

### Add Item to Cart
**POST** `/cart/items`

Add product to cart or update quantity if already exists.

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "items": [...],
    "totalItems": 2,
    "subtotal": 1999.98
  }
}
```

---

### Update Cart Item
**PUT** `/cart/items/:productId`

Update quantity of a cart item.

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "quantity": 3
}
```

**Note**: Setting quantity to 0 removes the item from cart.

---

### Remove Item from Cart
**DELETE** `/cart/items/:productId`

Remove specific item from cart.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "items": [...],
    "totalItems": 0,
    "subtotal": 0
  }
}
```

---

### Clear Cart
**DELETE** `/cart`

Remove all items from cart.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

### Validate Cart
**GET** `/cart/validate`

Validate cart items (stock availability, prices, product availability).

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "cart": {
      "items": [...],
      "totalItems": 2,
      "subtotal": 1999.98
    }
  }
}
```

**Response with errors**:
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "errors": [
      "Only 10 items of iPhone 15 Pro available (you have 20 in cart)",
      "Price of MacBook Pro has changed"
    ],
    "cart": {...}
  }
}
```

---

## Orders

### Create Order (Checkout)
**POST** `/orders`

Create a new order from cart items.

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "shippingAddressId": "uuid",
  "taxRate": 0.1,
  "shippingCost": 10
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "orderNumber": "ORD-1234567890-ABC",
    "status": "PENDING",
    "subtotal": "999.99",
    "tax": "100.00",
    "shipping": "10.00",
    "total": "1109.99",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 1,
        "price": "999.99",
        "total": "999.99",
        "product": {
          "id": "uuid",
          "name": "iPhone 15 Pro",
          "slug": "iphone-15-pro"
        }
      }
    ],
    "shippingAddress": {
      "id": "uuid",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "createdAt": "2025-11-14T20:00:00.000Z"
  }
}
```

**Order Status Flow**:
- PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- Orders can be cancelled from PENDING, CONFIRMED, or PROCESSING

---

### Get User Orders
**GET** `/orders`

Get paginated list of current user's orders.

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `status` (enum): Filter by status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `page` (number): Page number
- `limit` (number): Items per page

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-1234567890-ABC",
      "status": "CONFIRMED",
      "total": "1109.99",
      "items": [...],
      "createdAt": "2025-11-14T20:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### Get Order by ID
**GET** `/orders/:id`

Get detailed order information.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-1234567890-ABC",
    "status": "CONFIRMED",
    "subtotal": "999.99",
    "tax": "100.00",
    "shipping": "10.00",
    "total": "1109.99",
    "items": [...],
    "shippingAddress": {...},
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2025-11-14T20:00:00.000Z",
    "updatedAt": "2025-11-14T20:05:00.000Z"
  }
}
```

---

### Update Order Status (Admin Only)
**PATCH** `/orders/:id/status`

Update order status (with validation of status transitions).

**Headers**:
```
Authorization: Bearer {admin-token}
```

**Request Body**:
```json
{
  "status": "CONFIRMED"
}
```

**Valid Transitions**:
- PENDING → CONFIRMED or CANCELLED
- CONFIRMED → PROCESSING or CANCELLED
- PROCESSING → SHIPPED or CANCELLED
- SHIPPED → DELIVERED
- DELIVERED → (no transitions)
- CANCELLED → (no transitions)

---

### Cancel Order
**POST** `/orders/:id/cancel`

Cancel an order (restores product stock).

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    ...
  }
}
```

**Restrictions**:
- Cannot cancel DELIVERED orders
- Cannot cancel already CANCELLED orders
- Stock is restored when order is cancelled

---

## Addresses

### Get User Addresses
**GET** `/addresses`

Get all addresses for current user.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "isDefault": true
    }
  ]
}
```

---

### Create Address
**POST** `/addresses`

Create a new shipping address.

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "isDefault": true
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "id": "uuid",
    "street": "123 Main St",
    ...
  }
}
```

**Note**: Setting `isDefault: true` automatically unsets other default addresses.

---

### Update Address
**PUT** `/addresses/:id`

Update existing address.

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body** (all fields optional):
```json
{
  "street": "456 Oak Ave",
  "isDefault": true
}
```

---

### Delete Address
**DELETE** `/addresses/:id`

Delete a shipping address.

**Headers**:
```
Authorization: Bearer {token}
```

---

## Reviews

### Get Product Reviews
**GET** `/reviews?productId={uuid}`

Get reviews for a specific product.

**Query Parameters**:
- `productId` (uuid): Product ID (required)
- `page` (number): Page number
- `limit` (number): Items per page

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "userId": "uuid",
      "rating": 5,
      "comment": "Excellent phone! Very fast and great camera.",
      "user": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "product": {
        "id": "uuid",
        "name": "iPhone 15 Pro",
        "slug": "iphone-15-pro"
      },
      "createdAt": "2025-11-14T20:00:00.000Z",
      "updatedAt": "2025-11-14T20:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### Create Review
**POST** `/reviews`

Create a product review (requires purchase).

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Excellent product! Highly recommend."
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "rating": 5,
    "comment": "Excellent product!",
    "user": {...},
    "createdAt": "2025-11-14T20:00:00.000Z"
  }
}
```

**Restrictions**:
- User must have purchased the product
- One review per user per product
- Rating must be between 1-5

---

### Update Review
**PUT** `/reviews/:id`

Update your own review.

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

---

### Delete Review
**DELETE** `/reviews/:id`

Delete your own review.

**Headers**:
```
Authorization: Bearer {token}
```

---

### Get Product Rating Statistics
**GET** `/reviews/stats/:productId`

Get rating statistics for a product.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "averageRating": 4.5,
    "totalReviews": 100,
    "distribution": [
      {
        "rating": 1,
        "count": 2,
        "percentage": 2
      },
      {
        "rating": 2,
        "count": 3,
        "percentage": 3
      },
      {
        "rating": 3,
        "count": 10,
        "percentage": 10
      },
      {
        "rating": 4,
        "count": 25,
        "percentage": 25
      },
      {
        "rating": 5,
        "count": 60,
        "percentage": 60
      }
    ]
  }
}
```

---

## Health Check

### Health Check
**GET** `/health`

Check API health status.

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T20:00:00.000Z",
  "uptime": 12345.67
}
```

---

## Error Responses

All endpoints return errors in this format:

**400 Bad Request** (Validation Error):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

**Note**: Rate limiting is not currently implemented but is recommended for production.

Suggested limits:
- Authentication endpoints: 5 requests per minute per IP
- Other endpoints: 100 requests per minute per user

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

Tokens expire after 7 days by default.

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Meta**:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## File Uploads

**Supported Image Formats**: JPEG, PNG, WebP
**Maximum File Size**: 5MB per image
**Processing**: Images are automatically resized and optimized using Sharp

---

## Redis Cart Storage

Cart data is stored in Redis with the following structure:

**Key**: `cart:{userId}`
**Type**: Hash
**TTL**: 7 days
**Structure**:
```
{
  "productId1": "quantity",
  "productId2": "quantity"
}
```

Cart is automatically cleared after successful order creation.

---

## Testing the API

You can test the API using:

1. **cURL** (examples throughout this document)
2. **Postman** (import this as OpenAPI spec)
3. **Thunder Client** (VS Code extension)
4. **HTTPie**

**Example cURL**:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","firstName":"Test","lastName":"User"}'

# Get products
curl http://localhost:3000/api/products

# Add to cart (with auth)
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"uuid","quantity":1}'
```

---

## Next Steps

1. Generate OpenAPI/Swagger specification
2. Add API versioning (v1, v2)
3. Implement rate limiting
4. Add request logging
5. Set up API monitoring
6. Create Postman collection

---

**Last Updated**: 2025-11-14
**Maintained By**: Development Team
