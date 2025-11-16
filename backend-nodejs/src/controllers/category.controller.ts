import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as categoryService from '../services/category.service';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.getCategories();

  res.json({
    success: true,
    data: categories,
  });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.json({
    success: true,
    data: category,
  });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id);

  res.json({
    success: true,
    message: result.message,
  });
});
