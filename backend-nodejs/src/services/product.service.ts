import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';

interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  sku: string;
  categoryId: string;
  stock?: number;
  isActive?: boolean;
}

interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  comparePrice?: number | null;
  cost?: number | null;
  sku?: string;
  categoryId?: string;
  stock?: number;
  isActive?: boolean;
}

interface GetProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  isActive?: boolean;
}

export const createProduct = async (data: CreateProductData) => {
  const { name, slug, description, price, comparePrice, cost, sku, categoryId, stock, isActive } = data;

  // Check if slug already exists
  const existingSlug = await prisma.product.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    throw new AppError('Product with this slug already exists', 400, 'SLUG_EXISTS');
  }

  // Check if SKU already exists
  const existingSku = await prisma.product.findUnique({
    where: { sku },
  });

  if (existingSku) {
    throw new AppError('Product with this SKU already exists', 400, 'SKU_EXISTS');
  }

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      comparePrice,
      cost,
      sku,
      categoryId,
      stock: stock || 0,
      isActive: isActive !== undefined ? isActive : true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: true,
    },
  });

  return product;
};

export const getProducts = async (params: GetProductsParams) => {
  const { page, limit, search, category, minPrice, maxPrice, sort, isActive } = params;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ProductWhereInput = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (category) {
    where.categoryId = category;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  // Active filter
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Build orderBy clause
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;

    if (field === 'price') {
      orderBy = { price: isDesc ? 'desc' : 'asc' };
    } else if (field === 'name') {
      orderBy = { name: isDesc ? 'desc' : 'asc' };
    } else if (field === 'createdAt') {
      orderBy = { createdAt: isDesc ? 'desc' : 'asc' };
    }
  }

  // Fetch products and total count
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        orderBy: {
          order: 'asc',
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Calculate average rating
  const ratings = await prisma.review.aggregate({
    where: { productId: id },
    _avg: {
      rating: true,
    },
  });

  return {
    ...product,
    averageRating: ratings._avg.rating || 0,
  };
};

export const updateProduct = async (id: string, data: UpdateProductData) => {
  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check slug uniqueness if being updated
  if (data.slug && data.slug !== existingProduct.slug) {
    const slugExists = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      throw new AppError('Product with this slug already exists', 400, 'SLUG_EXISTS');
    }
  }

  // Check SKU uniqueness if being updated
  if (data.sku && data.sku !== existingProduct.sku) {
    const skuExists = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (skuExists) {
      throw new AppError('Product with this SKU already exists', 400, 'SKU_EXISTS');
    }
  }

  // Check category if being updated
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: true,
    },
  });

  return product;
};

export const deleteProduct = async (id: string) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Check if product has been ordered
  if (product._count.orderItems > 0) {
    // Don't delete, just deactivate
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product has existing orders and has been deactivated instead of deleted' };
  }

  // Delete product and related data (images, reviews will be cascade deleted)
  await prisma.product.delete({
    where: { id },
  });

  return { message: 'Product deleted successfully' };
};
