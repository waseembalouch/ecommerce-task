import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Cart } from '../../types/api';

interface CartSummaryProps {
  cart: Cart;
}

export const CartSummary = ({ cart }: CartSummaryProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <Card sx={{ position: 'sticky', top: 20 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>

        <Box sx={{ my: 2 }}>
          {/* Subtotal */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})
            </Typography>
            <Typography variant="body2">
              {formatPrice(subtotal)}
            </Typography>
          </Box>

          {/* Shipping */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipping
            </Typography>
            <Typography variant="body2" color={shipping === 0 ? 'success.main' : 'text.primary'}>
              {shipping === 0 ? 'FREE' : formatPrice(shipping)}
            </Typography>
          </Box>

          {/* Free shipping message */}
          {subtotal < 100 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Add {formatPrice(100 - subtotal)} more for free shipping
            </Typography>
          )}

          {/* Tax */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Tax (8%)
            </Typography>
            <Typography variant="body2">
              {formatPrice(tax)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Total */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">
              Total
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {formatPrice(total)}
            </Typography>
          </Box>

          {/* Checkout Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<CartIcon />}
            onClick={handleCheckout}
            disabled={cart.items.length === 0}
          >
            Proceed to Checkout
          </Button>

          {/* Continue Shopping */}
          <Button
            fullWidth
            variant="text"
            size="medium"
            onClick={() => navigate('/products')}
            sx={{ mt: 1 }}
          >
            Continue Shopping
          </Button>
        </Box>

        {/* Additional Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            • Secure checkout with encrypted payment
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            • 30-day return policy
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            • Free shipping on orders over $100
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
