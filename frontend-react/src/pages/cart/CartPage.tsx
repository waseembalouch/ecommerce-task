import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  ShoppingBag as ShopIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../../services/cartService';
import { CartItem } from '../../components/cart/CartItem';
import { CartSummary } from '../../components/cart/CartSummary';
import { useAuthStore } from '../../stores/authStore';

export const CartPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCartMutation.mutate();
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Please Log In
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You need to be logged in to view your shopping cart
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load cart. Please try again later.
        </Alert>
      </Container>
    );
  }

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

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ShopIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Your Cart is Empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Looks like you haven't added any items to your cart yet
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/products')}
              startIcon={<ShopIcon />}
            >
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Shopping Cart
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'} in your cart
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleClearCart}
          disabled={clearCartMutation.isPending}
        >
          Clear Cart
        </Button>
      </Box>

      {/* Cart Content */}
      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box>
            {cart.items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </Box>
        </Grid>

        {/* Cart Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <CartSummary cart={cart} />
        </Grid>
      </Grid>

      {/* Continue Shopping Link */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/products')}
        >
          ← Continue Shopping
        </Button>
      </Box>
    </Container>
  );
};
