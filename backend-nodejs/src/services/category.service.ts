import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
}

export const createCategory = async (data: CreateCategoryData) => {
  const { name, slug, description, parentId } = data;

  // Check if slug already exists
  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });

  if (existingCategory) {
    throw new AppError('Category with this slug already exists', 400, 'SLUG_EXISTS');
  }

  // If parentId is provided, check if parent exists
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new AppError('Parent category not found', 404, 'PARENT_NOT_FOUND');
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      parentId,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return category;
};

export const getCategories = async () => {
  const categories = await prisma.category.findMany({
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return categories;
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  return category;
};

export const updateCategory = async (id: string, data: UpdateCategoryData) => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  // If slug is being updated, check if it's unique
  if (data.slug && data.slug !== existingCategory.slug) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      throw new AppError('Category with this slug already exists', 400, 'SLUG_EXISTS');
    }
  }

  // If parentId is being updated, validate it
  if (data.parentId) {
    // Prevent setting self as parent
    if (data.parentId === id) {
      throw new AppError('Category cannot be its own parent', 400, 'INVALID_PARENT');
    }

    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new AppError('Parent category not found', 404, 'PARENT_NOT_FOUND');
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return category;
};

export const deleteCategory = async (id: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  // Check if category has products
  if (category._count.products > 0) {
    throw new AppError(
      'Cannot delete category with products. Please reassign or delete products first.',
      400,
      'CATEGORY_HAS_PRODUCTS'
    );
  }

  // Check if category has children
  if (category._count.children > 0) {
    throw new AppError(
      'Cannot delete category with subcategories. Please delete subcategories first.',
      400,
      'CATEGORY_HAS_CHILDREN'
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  return { message: 'Category deleted successfully' };
};
