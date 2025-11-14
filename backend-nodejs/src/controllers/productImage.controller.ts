import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as productImageService from '../services/productImage.service';
import { AppError } from '../utils/AppError';

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400, 'NO_FILE');
  }

  const { productId } = req.params;
  const { altText, isPrimary } = req.body;

  const image = await productImageService.uploadProductImage({
    productId,
    filePath: req.file.path,
    altText,
    isPrimary: isPrimary === 'true',
  });

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: image,
  });
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('No image files provided', 400, 'NO_FILES');
  }

  const { productId } = req.params;

  const images = await productImageService.uploadMultipleProductImages(productId, req.files);

  res.status(201).json({
    success: true,
    message: `${images.length} images uploaded successfully`,
    data: images,
  });
});

export const getImages = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const images = await productImageService.getProductImages(productId);

  res.json({
    success: true,
    data: images,
  });
});

export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;
  const { altText, isPrimary, order } = req.body;

  const image = await productImageService.updateProductImage(imageId, {
    altText,
    isPrimary,
    order: order ? parseInt(order, 10) : undefined,
  });

  res.json({
    success: true,
    message: 'Image updated successfully',
    data: image,
  });
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageId } = req.params;

  const result = await productImageService.deleteProductImage(imageId);

  res.json({
    success: true,
    message: result.message,
  });
});
