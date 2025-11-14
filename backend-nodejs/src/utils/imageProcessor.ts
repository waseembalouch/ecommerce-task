import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/env';

interface ProcessImageOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export const processImage = async (
  filePath: string,
  options: ProcessImageOptions = {}
): Promise<string> => {
  const { width = 800, height = 800, quality = 80 } = options;

  try {
    const ext = path.extname(filePath);
    const filename = path.basename(filePath, ext);
    const dirname = path.dirname(filePath);
    const processedFileName = `${filename}-processed${ext}`;
    const processedFilePath = path.join(dirname, processedFileName);

    await sharp(filePath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(processedFilePath);

    // Delete original file
    await fs.unlink(filePath);

    return processedFilePath;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

export const createThumbnail = async (filePath: string): Promise<string> => {
  try {
    const ext = path.extname(filePath);
    const filename = path.basename(filePath, ext);
    const dirname = path.dirname(filePath);
    const thumbnailFileName = `${filename}-thumb${ext}`;
    const thumbnailFilePath = path.join(dirname, thumbnailFileName);

    await sharp(filePath)
      .resize(200, 200, {
        fit: 'cover',
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailFilePath);

    return thumbnailFilePath;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

export const getImageUrl = (filePath: string): string => {
  // Remove the upload directory prefix and convert to URL path
  const relativePath = filePath.replace(config.upload.dir, '').replace(/\\/g, '/');
  return `/uploads${relativePath}`;
};
