import {
  Box,
  Card,
  CardMedia,
  Typography,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../../types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../../services/cartService';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const queryClient = useQueryClient();

  const updateQuantityMutation = useMutation({
    mutationFn: (quantity: number) => cartService.updateCartItem(item.product.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: () => cartService.removeCartItem(item.product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const handleIncrement = () => {
    if (item.quantity < item.product.stock) {
      updateQuantityMutation.mutate(item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantityMutation.mutate(item.quantity - 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= item.product.stock) {
      updateQuantityMutation.mutate(value);
    }
  };

  const handleRemove = () => {
    removeItemMutation.mutate();
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const primaryImage = item.product.images?.find((img) => img.isPrimary)?.url ||
                       item.product.images?.[0]?.url ||
                       '/placeholder.png';

  const itemSubtotal = parseFloat(item.product.price) * item.quantity;

  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Product Image */}
        <CardMedia
          component={Link}
          to={`/products/${item.product.id}`}
          sx={{
            width: 120,
            height: 120,
            flexShrink: 0,
            borderRadius: 1,
            textDecoration: 'none',
          }}
        >
          <Box
            component="img"
            src={primaryImage}
            alt={item.product.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 1,
            }}
          />
        </CardMedia>

        {/* Product Details */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="h6"
            component={Link}
            to={`/products/${item.product.id}`}
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              mb: 0.5,
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {item.product.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {item.product.description?.substring(0, 100)}
            {item.product.description && item.product.description.length > 100 ? '...' : ''}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
            {/* Price */}
            <Typography variant="h6" color="primary">
              {formatPrice(item.product.price)}
            </Typography>

            {/* Stock Warning */}
            {item.product.stock > 0 && item.product.stock <= 10 && (
              <Typography variant="caption" color="warning.main">
                Only {item.product.stock} left
              </Typography>
            )}
          </Box>
        </Box>

        {/* Quantity Controls & Actions */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            minWidth: 150,
          }}
        >
          {/* Subtotal */}
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
            {formatPrice(itemSubtotal.toString())}
          </Typography>

          {/* Quantity Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleDecrement}
              disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
              size="small"
              type="number"
              value={item.quantity}
              onChange={handleQuantityChange}
              disabled={updateQuantityMutation.isPending}
              inputProps={{
                min: 1,
                max: item.product.stock,
                style: { textAlign: 'center', width: 50 },
              }}
              sx={{
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none',
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
              }}
            />
            <IconButton
              size="small"
              onClick={handleIncrement}
              disabled={item.quantity >= item.product.stock || updateQuantityMutation.isPending}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Remove Button */}
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemove}
            disabled={removeItemMutation.isPending}
          >
            Remove
          </Button>
        </Box>
      </Box>
    </Card>
  );
};
