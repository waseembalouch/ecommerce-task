import * as categoryService from '../../../src/services/category.service';
import { prisma } from '../../../src/config/database';

// Mock prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Category Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic products and gadgets',
    };

    it('should successfully create a category without parent', async () => {
      const mockCategory = {
        id: 'category-1',
        ...validCategoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.category.findUnique as any).mockResolvedValue(null); // slug check
      (prisma.category.create as any).mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory(validCategoryData);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: validCategoryData.slug },
      });
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it('should successfully create a category with parent', async () => {
      const categoryWithParent = {
        ...validCategoryData,
        name: 'Laptops',
        slug: 'laptops',
        parentId: 'parent-category-1',
      };

      const mockParent = {
        id: 'parent-category-1',
        name: 'Electronics',
        slug: 'electronics',
      };

      const mockCategory = {
        id: 'category-2',
        ...categoryWithParent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.category.findUnique as any)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(mockParent); // parent check
      (prisma.category.create as any).mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory(categoryWithParent);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw error if slug already exists', async () => {
      const existingCategory = {
        id: 'existing-category',
        slug: validCategoryData.slug,
        name: 'Existing Category',
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);

      await expect(categoryService.createCategory(validCategoryData)).rejects.toMatchObject({
        message: 'Category with this slug already exists',
        statusCode: 400,
      });
    });

    it('should throw error if parent category not found', async () => {
      const categoryWithInvalidParent = {
        ...validCategoryData,
        parentId: 'non-existent-parent',
      };

      (prisma.category.findUnique as any)
        .mockResolvedValueOnce(null) // slug check passes
        .mockResolvedValueOnce(null); // parent check fails

      await expect(categoryService.createCategory(categoryWithInvalidParent)).rejects.toMatchObject({
        message: 'Parent category not found',
        statusCode: 404,
      });
    });
  });

  describe('getCategories', () => {
    it('should return all categories with relationships', async () => {
      const mockCategories = [
        {
          id: 'category-1',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products',
          parentId: null,
          parent: null,
          children: [
            {
              id: 'category-2',
              name: 'Laptops',
              slug: 'laptops',
            },
          ],
          _count: { products: 10 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'category-2',
          name: 'Laptops',
          slug: 'laptops',
          description: 'Laptop computers',
          parentId: 'category-1',
          parent: {
            id: 'category-1',
            name: 'Electronics',
            slug: 'electronics',
          },
          children: [],
          _count: { products: 5 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.category.findMany as any).mockResolvedValue(mockCategories);

      const result = await categoryService.getCategories();

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
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
    });

    it('should return empty array when no categories exist', async () => {
      (prisma.category.findMany as any).mockResolvedValue([]);

      const result = await categoryService.getCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id with relationships', async () => {
      const categoryId = 'category-1';
      const mockCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        parentId: null,
        parent: null,
        children: [
          {
            id: 'category-2',
            name: 'Laptops',
            slug: 'laptops',
          },
        ],
        _count: { products: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.category.findUnique as any).mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById(categoryId);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
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
    });

    it('should throw error if category not found', async () => {
      const categoryId = 'non-existent';

      (prisma.category.findUnique as any).mockResolvedValue(null);

      await expect(categoryService.getCategoryById(categoryId)).rejects.toMatchObject({
        message: 'Category not found',
        statusCode: 404,
      });
    });
  });

  describe('updateCategory', () => {
    const categoryId = 'category-1';
    const updateData = {
      name: 'Updated Electronics',
      description: 'Updated description',
    };

    it('should successfully update a category', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Old description',
        parentId: null,
      };

      const updatedCategory = {
        ...existingCategory,
        ...updateData,
        updatedAt: new Date(),
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);
      (prisma.category.update as any).mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory(categoryId, updateData);

      expect(result.name).toBe('Updated Electronics');
      expect(result.description).toBe('Updated description');
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: updateData,
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
    });

    it('should throw error if category not found', async () => {
      (prisma.category.findUnique as any).mockResolvedValue(null);

      await expect(categoryService.updateCategory(categoryId, updateData)).rejects.toMatchObject({
        message: 'Category not found',
        statusCode: 404,
      });
    });

    it('should check slug uniqueness when updating slug', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
      };

      const updateWithSlug = {
        slug: 'new-electronics',
      };

      (prisma.category.findUnique as any)
        .mockResolvedValueOnce(existingCategory) // initial category check
        .mockResolvedValueOnce({ id: 'other-category', slug: 'new-electronics' }); // slug exists check

      await expect(categoryService.updateCategory(categoryId, updateWithSlug)).rejects.toMatchObject({
        message: 'Category with this slug already exists',
        statusCode: 400,
      });
    });

    it('should throw error when trying to set category as its own parent', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        parentId: null,
      };

      const updateWithSelfParent = {
        parentId: categoryId,
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);

      await expect(categoryService.updateCategory(categoryId, updateWithSelfParent)).rejects.toMatchObject({
        message: 'Category cannot be its own parent',
        statusCode: 400,
      });
    });

    it('should throw error if new parent category not found', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        parentId: null,
      };

      const updateWithInvalidParent = {
        parentId: 'non-existent-parent',
      };

      (prisma.category.findUnique as any)
        .mockResolvedValueOnce(existingCategory) // initial category check
        .mockResolvedValueOnce(null); // parent check fails

      await expect(categoryService.updateCategory(categoryId, updateWithInvalidParent)).rejects.toMatchObject({
        message: 'Parent category not found',
        statusCode: 404,
      });
    });

    it('should allow updating to a valid parent category', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Laptops',
        slug: 'laptops',
        parentId: null,
      };

      const validParent = {
        id: 'parent-category-1',
        name: 'Electronics',
        slug: 'electronics',
      };

      const updateWithValidParent = {
        parentId: 'parent-category-1',
      };

      const updatedCategory = {
        ...existingCategory,
        parentId: 'parent-category-1',
        updatedAt: new Date(),
      };

      (prisma.category.findUnique as any)
        .mockResolvedValueOnce(existingCategory) // initial category check
        .mockResolvedValueOnce(validParent); // parent check passes
      (prisma.category.update as any).mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory(categoryId, updateWithValidParent);

      expect(result.parentId).toBe('parent-category-1');
    });
  });

  describe('deleteCategory', () => {
    const categoryId = 'category-1';

    it('should successfully delete a category with no products or children', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        _count: {
          products: 0,
          children: 0,
        },
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);
      (prisma.category.delete as any).mockResolvedValue(existingCategory);

      const result = await categoryService.deleteCategory(categoryId);

      expect(result.message).toContain('deleted successfully');
      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
    });

    it('should throw error if category not found', async () => {
      (prisma.category.findUnique as any).mockResolvedValue(null);

      await expect(categoryService.deleteCategory(categoryId)).rejects.toMatchObject({
        message: 'Category not found',
        statusCode: 404,
      });
    });

    it('should throw error if category has products', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        _count: {
          products: 5,
          children: 0,
        },
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);

      await expect(categoryService.deleteCategory(categoryId)).rejects.toMatchObject({
        message: 'Cannot delete category with products. Please reassign or delete products first.',
        statusCode: 400,
      });
    });

    it('should throw error if category has children', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        _count: {
          products: 0,
          children: 3,
        },
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);

      await expect(categoryService.deleteCategory(categoryId)).rejects.toMatchObject({
        message: 'Cannot delete category with subcategories. Please delete subcategories first.',
        statusCode: 400,
      });
    });

    it('should throw error if category has both products and children', async () => {
      const existingCategory = {
        id: categoryId,
        name: 'Electronics',
        slug: 'electronics',
        _count: {
          products: 5,
          children: 3,
        },
      };

      (prisma.category.findUnique as any).mockResolvedValue(existingCategory);

      await expect(categoryService.deleteCategory(categoryId)).rejects.toMatchObject({
        message: 'Cannot delete category with products. Please reassign or delete products first.',
        statusCode: 400,
      });
    });
  });
});
