import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/utils';
import { ProductCard } from '../../components/products/ProductCard';
import { useAuthStore } from '../../stores/authStore';
import type { Product } from '../../types/api';

// Mock services
vi.mock('../../services/cartService', () => ({
  cartService: {
    addToCart: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'This is a test product description',
    price: 99.99,
    comparePrice: 129.99,
    sku: 'TEST-001',
    categoryId: 'cat-1',
    stock: 15,
    isActive: true,
    images: [
      {
        id: 'img-1',
        productId: 'product-1',
        url: '/test-image.jpg',
        altText: 'Test Image',
        isPrimary: true,
        order: 0,
      },
    ],
    category: {
      id: 'cat-1',
      name: 'Test Category',
      slug: 'test-category',
      
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it('should render product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/This is a test product description/)).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$129.99')).toBeInTheDocument();
  });

  it('should display discount badge when comparePrice is higher', () => {
    render(<ProductCard product={mockProduct} />);

    const discount = Math.round(((mockProduct.comparePrice! - mockProduct.price) / mockProduct.comparePrice!) * 100);
    expect(screen.getByText(`${discount}% OFF`)).toBeInTheDocument();
  });

  it('should display "Out of Stock" chip when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);

    // Both chip and button show "Out of Stock", use getAllByText
    const outOfStockElements = screen.getAllByText('Out of Stock');
    expect(outOfStockElements.length).toBeGreaterThan(0);
  });

  it('should display low stock warning when stock is low', () => {
    const lowStockProduct = { ...mockProduct, stock: 5 };
    render(<ProductCard product={lowStockProduct} />);

    expect(screen.getByText('Only 5 left in stock')).toBeInTheDocument();
  });

  it('should not display low stock warning when stock is above 10', () => {
    const highStockProduct = { ...mockProduct, stock: 20 };
    render(<ProductCard product={highStockProduct} />);

    expect(screen.queryByText(/Only .* left in stock/)).not.toBeInTheDocument();
  });

  it('should display ratings when available', () => {
    const productWithRating = {
      ...mockProduct,
      averageRating: 4.5,
      reviewCount: 42,
    };
    render(<ProductCard product={productWithRating} />);

    expect(screen.getByText('(42)')).toBeInTheDocument();
  });

  it('should disable "Add to Cart" button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  it('should disable "Add to Cart" button when user is not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(<ProductCard product={mockProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeDisabled();
  });

  it('should call addToCart when button is clicked and user is authenticated', async () => {
    const user = userEvent.setup();
    const { cartService } = await import('../../services/cartService');

    render(<ProductCard product={mockProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    await waitFor(() => {
      expect(cartService.addToCart).toHaveBeenCalledWith('product-1', 1);
    });
  });

  it('should use placeholder image when no images are provided', () => {
    const productWithoutImages = { ...mockProduct, images: [] };
    render(<ProductCard product={productWithoutImages} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/placeholder.png');
  });

  it('should use primary image when available', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should render product link correctly', () => {
    render(<ProductCard product={mockProduct} />);

    const links = screen.getAllByRole('link');
    const productLinks = links.filter(link =>
      link.getAttribute('href') === `/products/${mockProduct.id}`
    );
    expect(productLinks.length).toBeGreaterThan(0);
  });
});
