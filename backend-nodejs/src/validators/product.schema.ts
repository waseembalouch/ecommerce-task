import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    comparePrice: z.number().positive().optional(),
    cost: z.number().positive().optional(),
    sku: z.string().min(2, 'SKU must be at least 2 characters'),
    categoryId: z.string().uuid('Invalid category ID'),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    price: z.number().positive('Price must be positive').optional(),
    comparePrice: z.number().positive().optional().nullable(),
    cost: z.number().positive().optional().nullable(),
    sku: z.string().min(2, 'SKU must be at least 2 characters').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    search: z.string().optional(),
    category: z.string().uuid().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sort: z.enum(['price', '-price', 'createdAt', '-createdAt', 'name', '-name']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
