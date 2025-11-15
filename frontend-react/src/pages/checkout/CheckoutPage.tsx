import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../../services/cartService';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface PaymentMethod {
  type: 'card' | 'paypal' | 'cod';
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

const steps = ['Shipping Address', 'Payment Method', 'Review Order'];

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [activeStep, setActiveStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'card',
  });

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await api.post('/orders', orderData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${data.data.id}`);
    },
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNext();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNext();
  };

  const handlePlaceOrder = async () => {
    if (!cart) return;

    const orderData = {
      shippingAddress,
      paymentMethod: paymentMethod.type,
      items: cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
    };

    placeOrderMutation.mutate(orderData);
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
              You need to be logged in to checkout
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (cartLoading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Empty cart check
  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" gutterBottom>
              Your Cart is Empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Add some products to your cart before checking out
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        {/* Checkout Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Step 1: Shipping Address */}
              {activeStep === 0 && (
                <Box component="form" onSubmit={handleShippingSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        required
                        value={shippingAddress.fullName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Address Line 1"
                        required
                        value={shippingAddress.addressLine1}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Address Line 2 (Optional)"
                        value={shippingAddress.addressLine2}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="City"
                        required
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="State/Province"
                        required
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Postal Code"
                        required
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Country"
                        required
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, country: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, phone: e.target.value })
                        }
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button type="submit" variant="contained" size="large">
                      Continue to Payment
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 2: Payment Method */}
              {activeStep === 1 && (
                <Box component="form" onSubmit={handlePaymentSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Payment Method
                  </Typography>

                  <FormControl component="fieldset" sx={{ mt: 2, mb: 3 }}>
                    <RadioGroup
                      value={paymentMethod.type}
                      onChange={(e) =>
                        setPaymentMethod({ ...paymentMethod, type: e.target.value as any })
                      }
                    >
                      <FormControlLabel
                        value="card"
                        control={<Radio />}
                        label="Credit/Debit Card"
                      />
                      <FormControlLabel value="paypal" control={<Radio />} label="PayPal" />
                      <FormControlLabel
                        value="cod"
                        control={<Radio />}
                        label="Cash on Delivery"
                      />
                    </RadioGroup>
                  </FormControl>

                  {paymentMethod.type === 'card' && (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Card Number"
                          required
                          placeholder="1234 5678 9012 3456"
                          value={paymentMethod.cardNumber || ''}
                          onChange={(e) =>
                            setPaymentMethod({ ...paymentMethod, cardNumber: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Cardholder Name"
                          required
                          value={paymentMethod.cardHolder || ''}
                          onChange={(e) =>
                            setPaymentMethod({ ...paymentMethod, cardHolder: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Expiry Date"
                          required
                          placeholder="MM/YY"
                          value={paymentMethod.expiryDate || ''}
                          onChange={(e) =>
                            setPaymentMethod({ ...paymentMethod, expiryDate: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="CVV"
                          required
                          placeholder="123"
                          value={paymentMethod.cvv || ''}
                          onChange={(e) =>
                            setPaymentMethod({ ...paymentMethod, cvv: e.target.value })
                          }
                        />
                      </Grid>
                    </Grid>
                  )}

                  {paymentMethod.type === 'paypal' && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You will be redirected to PayPal to complete your payment
                    </Alert>
                  )}

                  {paymentMethod.type === 'cod' && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You will pay in cash when your order is delivered
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} size="large">
                      Back
                    </Button>
                    <Button type="submit" variant="contained" size="large">
                      Review Order
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 3: Review Order */}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Review Your Order
                  </Typography>

                  {/* Shipping Address Review */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Shipping Address
                    </Typography>
                    <Typography variant="body2">{shippingAddress.fullName}</Typography>
                    <Typography variant="body2">{shippingAddress.addressLine1}</Typography>
                    {shippingAddress.addressLine2 && (
                      <Typography variant="body2">{shippingAddress.addressLine2}</Typography>
                    )}
                    <Typography variant="body2">
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                    </Typography>
                    <Typography variant="body2">{shippingAddress.country}</Typography>
                    <Typography variant="body2">{shippingAddress.phone}</Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Payment Method Review */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Payment Method
                    </Typography>
                    <Typography variant="body2">
                      {paymentMethod.type === 'card' && 'Credit/Debit Card'}
                      {paymentMethod.type === 'paypal' && 'PayPal'}
                      {paymentMethod.type === 'cod' && 'Cash on Delivery'}
                    </Typography>
                  </Box>

                  {placeOrderMutation.isError && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                      Failed to place order. Please try again.
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} size="large">
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handlePlaceOrder}
                      disabled={placeOrderMutation.isPending}
                    >
                      {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Cart Items */}
              <Box sx={{ mb: 2 }}>
                {cart.items.map((item) => (
                  <Box
                    key={item.product.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                  >
                    <Typography variant="body2">
                      {item.product.name} x {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">${cart.totalAmount.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Shipping:</Typography>
                <Typography variant="body2">$0.00</Typography>
              </Box>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Tax:</Typography>
                <Typography variant="body2">$0.00</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  ${cart.totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
