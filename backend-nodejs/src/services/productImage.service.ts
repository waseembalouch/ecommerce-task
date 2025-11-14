import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { processImage, getImageUrl, deleteImage } from '../utils/imageProcessor';
import path from 'path';

interface UploadImageData {
  productId: string;
  filePath: string;
  altText?: string;
  isPrimary?: boolean;
}

export const uploadProductImage = async (data: UploadImageData) => {
  const { productId, filePath, altText, isPrimary } = data;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    // Delete uploaded file if product doesn't exist
    await deleteImage(filePath);
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  try {
    // Process image
    const processedPath = await processImage(filePath);
    const imageUrl = getImageUrl(processedPath);

    // If this is set as primary, unset other primary images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: {
          productId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Get the next order number
    const maxOrder = await prisma.productImage.aggregate({
      where: { productId },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order || 0) + 1;

    // Create image record
    const productImage = await prisma.productImage.create({
      data: {
        productId,
        url: imageUrl,
        altText: altText || product.name,
        isPrimary: isPrimary || false,
        order: nextOrder,
      },
    });

    return productImage;
  } catch (error) {
    // Delete file if processing fails
    await deleteImage(filePath);
    throw error;
  }
};

export const uploadMultipleProductImages = async (
  productId: string,
  files: Express.Multer.File[]
) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    // Delete all uploaded files if product doesn't exist
    await Promise.all(files.map((file) => deleteImage(file.path)));
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  try {
    // Get the next order number
    const maxOrder = await prisma.productImage.aggregate({
      where: { productId },
      _max: { order: true },
    });

    let currentOrder = (maxOrder._max.order || 0) + 1;

    const uploadedImages = await Promise.all(
      files.map(async (file, index) => {
        const processedPath = await processImage(file.path);
        const imageUrl = getImageUrl(processedPath);

        const productImage = await prisma.productImage.create({
          data: {
            productId,
            url: imageUrl,
            altText: product.name,
            isPrimary: index === 0 && currentOrder === 1, // First image is primary if no images exist
            order: currentOrder++,
          },
        });

        return productImage;
      })
    );

    return uploadedImages;
  } catch (error) {
    // Delete all files if processing fails
    await Promise.all(files.map((file) => deleteImage(file.path)));
    throw error;
  }
};

export const getProductImages = async (productId: string) => {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { order: 'asc' },
  });

  return images;
};

export const updateProductImage = async (
  imageId: string,
  data: { altText?: string; isPrimary?: boolean; order?: number }
) => {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new AppError('Image not found', 404, 'IMAGE_NOT_FOUND');
  }

  // If setting as primary, unset other primary images for this product
  if (data.isPrimary) {
    await prisma.productImage.updateMany({
      where: {
        productId: image.productId,
        isPrimary: true,
        id: { not: imageId },
      },
      data: {
        isPrimary: false,
      },
    });
  }

  const updatedImage = await prisma.productImage.update({
    where: { id: imageId },
    data,
  });

  return updatedImage;
};

export const deleteProductImage = async (imageId: string) => {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new AppError('Image not found', 404, 'IMAGE_NOT_FOUND');
  }

  // Delete image from database
  await prisma.productImage.delete({
    where: { id: imageId },
  });

  // Delete image file from disk
  // Note: This is a simple implementation. In production, you might want to:
  // 1. Delete from cloud storage (S3, Cloudinary, etc.)
  // 2. Handle errors more gracefully
  // 3. Keep a backup before deletion
  try {
    const filePath = path.join(process.cwd(), 'uploads', image.url.replace('/uploads/', ''));
    await deleteImage(filePath);
  } catch (error) {
    console.error('Error deleting image file:', error);
    // Don't throw error - image record is already deleted
  }

  return { message: 'Image deleted successfully' };
};
