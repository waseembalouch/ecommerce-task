import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  ShoppingBag as ProductsIcon,
  ShoppingCart as OrdersIcon,
  People as UsersIcon,
  AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const AdminDashboard = () => {
  // Fetch statistics
  const { data: productsData } = useQuery({
    queryKey: ['products', { page: 1, limit: 1 }],
    queryFn: () => productService.getProducts({ page: 1, limit: 1 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderService.getOrders(),
  });

  const totalProducts = productsData?.pagination?.total || 0;
  const totalOrders = ordersData?.length || 0;

  // Calculate total revenue from orders
  const totalRevenue = ordersData?.reduce((sum, order) => {
    return sum + (order.totalAmount || 0);
  }, 0) || 0;

  const stats: StatCard[] = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: <ProductsIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: <OrdersIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <RevenueIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Active Users',
      value: '-',
      icon: <UsersIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={600}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.8 }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Orders */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Orders
        </Typography>
        {ordersData && ordersData.length > 0 ? (
          <Box>
            {ordersData.slice(0, 5).map((order) => (
              <Box
                key={order.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Order #{order.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" fontWeight={600}>
                    ${order.totalAmount?.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor:
                        order.status === 'DELIVERED'
                          ? 'success.light'
                          : order.status === 'CANCELLED'
                          ? 'error.light'
                          : 'warning.light',
                      color: 'white',
                    }}
                  >
                    {order.status}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">No orders yet</Typography>
        )}
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
                transition: 'box-shadow 0.3s',
              }}
              onClick={() => (window.location.href = '/admin/products')}
            >
              <CardContent>
                <Typography variant="h6">Manage Products</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add, edit, or remove products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
                transition: 'box-shadow 0.3s',
              }}
              onClick={() => (window.location.href = '/admin/orders')}
            >
              <CardContent>
                <Typography variant="h6">Manage Orders</Typography>
                <Typography variant="body2" color="text.secondary">
                  View and update order status
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};
