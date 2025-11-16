import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Documentation',
      version: '1.0.0',
      description: 'Comprehensive REST API for E-Commerce application built with Node.js, Express, TypeScript, and Prisma',
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.ecommerce.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'ADMIN'],
              example: 'CUSTOMER',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Laptop',
            },
            slug: {
              type: 'string',
              example: 'laptop-pro-15',
            },
            description: {
              type: 'string',
              example: 'High-performance laptop for professionals',
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 999.99,
            },
            comparePrice: {
              type: 'number',
              format: 'decimal',
              example: 1299.99,
              nullable: true,
            },
            sku: {
              type: 'string',
              example: 'LAP-001',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
            },
            stock: {
              type: 'integer',
              example: 50,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            category: {
              $ref: '#/components/schemas/Category',
            },
            images: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProductImage',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Electronics',
            },
            slug: {
              type: 'string',
              example: 'electronics',
            },
            description: {
              type: 'string',
              example: 'Electronic devices and gadgets',
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            url: {
              type: 'string',
              example: '/uploads/products/image.jpg',
            },
            altText: {
              type: 'string',
              example: 'Product image',
            },
            isPrimary: {
              type: 'boolean',
              example: true,
            },
            order: {
              type: 'integer',
              example: 0,
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-20240101-001',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING',
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              example: 999.99,
            },
            tax: {
              type: 'number',
              format: 'decimal',
              example: 99.99,
            },
            shipping: {
              type: 'number',
              format: 'decimal',
              example: 10.00,
            },
            total: {
              type: 'number',
              format: 'decimal',
              example: 1109.98,
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            orderId: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            quantity: {
              type: 'integer',
              example: 2,
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 999.99,
            },
            total: {
              type: 'number',
              format: 'decimal',
              example: 1999.98,
            },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 5,
            },
            comment: {
              type: 'string',
              example: 'Great product!',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
      {
        name: 'Categories',
        description: 'Product category management',
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations',
      },
      {
        name: 'Orders',
        description: 'Order management',
      },
      {
        name: 'Reviews',
        description: 'Product reviews and ratings',
      },
      {
        name: 'User',
        description: 'User profile and settings',
      },
      {
        name: 'Admin',
        description: 'Admin analytics and statistics',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
