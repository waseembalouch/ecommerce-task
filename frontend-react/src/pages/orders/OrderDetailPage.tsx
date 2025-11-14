import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../stores/authStore';

const getStatusColor = (status: string) => {
  const statusColors: Record<string, any> = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PROCESSING: 'info',
    SHIPPED: 'primary',
    DELIVERED: 'success',
    CANCELLED: 'error',
  };
  return statusColors[status] || 'default';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getOrderSteps = () => [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

const getActiveStep = (status: string) => {
  const steps: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CANCELLED: -1,
  };
  return steps[status] ?? 0;
};

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id && isAuthenticated,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate();
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" gutterBottom>
              Please Log In
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You need to be logged in to view order details
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </CardContent>
        </Card>
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

  if (error || !order) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load order details. Please try again later.
        </Alert>
        <Button onClick={() => navigate('/orders')} sx={{ mt: 2 }} startIcon={<BackIcon />}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  const activeStep = getActiveStep(order.status);
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Order #{order.id.substring(0, 8).toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placed on {formatDate(order.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={order.status}
              color={getStatusColor(order.status)}
              size="medium"
            />
            <Chip
              label={order.paymentStatus}
              color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
              size="medium"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      {/* Order Status Stepper */}
      {order.status !== 'CANCELLED' && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {getOrderSteps().map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Message */}
      {order.status === 'CANCELLED' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This order has been cancelled
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Order Items */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              component="img"
                              src={item.product?.images?.[0]?.url || '/placeholder.png'}
                              alt={item.product?.name}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {item.product?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.product?.sku}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{item.quantity}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${parseFloat(item.price).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary & Details */}
        <Grid item xs={12} md={4}>
          {/* Order Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">
                  ${parseFloat(order.subtotalAmount || order.totalAmount).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Shipping:</Typography>
                <Typography variant="body2">
                  ${parseFloat(order.shippingAmount || '0').toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Tax:</Typography>
                <Typography variant="body2">
                  ${parseFloat(order.taxAmount || '0').toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  ${parseFloat(order.totalAmount).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShippingIcon /> Shipping Address
              </Typography>

              <Divider sx={{ my: 2 }} />

              {order.shippingAddress ? (
                <Box>
                  <Typography variant="body2">{order.shippingAddress.fullName}</Typography>
                  <Typography variant="body2">{order.shippingAddress.addressLine1}</Typography>
                  {order.shippingAddress.addressLine2 && (
                    <Typography variant="body2">{order.shippingAddress.addressLine2}</Typography>
                  )}
                  <Typography variant="body2">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </Typography>
                  <Typography variant="body2">{order.shippingAddress.country}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Phone: {order.shippingAddress.phone}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No shipping address available
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Method
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" textTransform="capitalize">
                {order.paymentMethod || 'N/A'}
              </Typography>
            </CardContent>
          </Card>

          {/* Cancel Order Button */}
          {canCancel && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
