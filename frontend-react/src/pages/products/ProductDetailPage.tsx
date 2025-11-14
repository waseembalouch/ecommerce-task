import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Rating,
  Divider,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { useAuthStore } from '../../stores/authStore';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      cartService.addToCart(data.productId, data.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('Product added to cart!');
    },
  });

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (product) {
      addToCartMutation.mutate({
        productId: product.id,
        quantity,
      });
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load product. Please try again later.
        </Alert>
        <Button onClick={() => navigate('/products')} sx={{ mt: 2 }}>
          Back to Products
        </Button>
      </Container>
    );
  }

  const discountPercentage = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 3 }}>
      {/* Breadcrumb */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        <Button
          variant="text"
          size="small"
          onClick={() => navigate('/products')}
          sx={{ minWidth: 'auto', p: 0 }}
        >
          Products
        </Button>
        {' / '}
        {product.name}
      </Typography>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Card>
            <Box
              component="img"
              src={product.images[selectedImage]?.url || '/placeholder.png'}
              alt={product.name}
              sx={{
                width: '100%',
                height: 500,
                objectFit: 'cover',
              }}
            />
          </Card>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {product.images.map((image, index) => (
                <Box
                  key={image.id}
                  component="img"
                  src={image.url}
                  alt={`${product.name} ${index + 1}`}
                  onClick={() => setSelectedImage(index)}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: selectedImage === index ? '2px solid' : '2px solid transparent',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Product Name */}
            <Typography variant="h4" gutterBottom fontWeight={600}>
              {product.name}
            </Typography>

            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Rating value={product.averageRating || 0} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary">
                ({product.reviewCount || 0} reviews)
              </Typography>
            </Box>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h4" color="primary" fontWeight={600}>
                  ${product.price.toFixed(2)}
                </Typography>
                {product.comparePrice && product.comparePrice > product.price && (
                  <>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ textDecoration: 'line-through' }}
                    >
                      ${product.comparePrice.toFixed(2)}
                    </Typography>
                    <Chip
                      label={`${discountPercentage}% OFF`}
                      color="error"
                      size="small"
                    />
                  </>
                )}
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Description */}
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {product.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Stock Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Availability:
              </Typography>
              {product.stock > 0 ? (
                <Chip
                  label={`${product.stock} in stock`}
                  color="success"
                  size="small"
                />
              ) : (
                <Chip label="Out of stock" color="error" size="small" />
              )}
            </Box>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Quantity:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <IconButton
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ px: 3, minWidth: 40, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <IconButton
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    (Max: {product.stock})
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CartIcon />}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addToCartMutation.isPending}
                sx={{ flex: 1 }}
              >
                {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
              </Button>
              <IconButton
                size="large"
                sx={{
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <FavoriteBorderIcon />
              </IconButton>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Additional Information */}
      <Box sx={{ mt: 6 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Product Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  SKU
                </Typography>
                <Typography variant="body1">{product.sku}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">{product.category?.name || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Reviews Section - Placeholder for now */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Customer Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reviews feature coming soon...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
