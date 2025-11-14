import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as productService from '../services/product.service';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, category, minPrice, maxPrice, sort, isActive } = req.query;

  const result = await productService.getProducts({
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    search: search as string,
    category: category as string,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    sort: sort as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });

  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);

  res.json({
    success: true,
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.params.id);

  res.json({
    success: true,
    message: result.message,
  });
});
