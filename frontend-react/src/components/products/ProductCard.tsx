import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
} from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Product } from '../../types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../../services/cartService';
import { useAuthStore } from '../../stores/authStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const addToCartMutation = useMutation({
    mutationFn: () => cartService.addToCart(product.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      addToCartMutation.mutate();
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const primaryImage = product.images?.find((img) => img.isPrimary)?.url ||
                       product.images?.[0]?.url ||
                       '/placeholder.png';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardMedia
        component={Link}
        to={`/products/${product.id}`}
        sx={{
          height: 200,
          textDecoration: 'none',
          position: 'relative',
        }}
      >
        <Box
          component="img"
          src={primaryImage}
          alt={product.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {product.stock === 0 && (
          <Chip
            label="Out of Stock"
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          />
        )}
        {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
          <Chip
            label={`${Math.round(((parseFloat(product.comparePrice) - parseFloat(product.price)) / parseFloat(product.comparePrice)) * 100)}% OFF`}
            color="secondary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
            }}
          />
        )}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          component={Link}
          to={`/products/${product.id}`}
          sx={{
            textDecoration: 'none',
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1,
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          {product.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1,
          }}
        >
          {product.description}
        </Typography>

        {product.averageRating && product.reviewCount ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating value={product.averageRating} precision={0.1} size="small" readOnly />
            <Typography variant="body2" color="text.secondary">
              ({product.reviewCount})
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="primary" component="span">
            {formatPrice(product.price)}
          </Typography>
          {product.comparePrice && (
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ textDecoration: 'line-through', ml: 1 }}
            >
              {formatPrice(product.comparePrice)}
            </Typography>
          )}
        </Box>

        {product.stock > 0 && product.stock <= 10 && (
          <Typography variant="caption" color="warning.main">
            Only {product.stock} left in stock
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CartIcon />}
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !isAuthenticated || addToCartMutation.isPending}
        >
          {addToCartMutation.isPending
            ? 'Adding...'
            : product.stock === 0
            ? 'Out of Stock'
            : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
};
