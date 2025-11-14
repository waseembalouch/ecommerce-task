import {
  AppBar,
  Badge,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { cartService } from '../../services/cartService';

export const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Fetch cart count
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* Logo */}
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          component={Link}
          to="/"
          sx={{ mr: 2 }}
        >
          <StoreIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          E-Commerce
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button color="inherit" component={Link} to="/products">
            Products
          </Button>

          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/orders">
                Orders
              </Button>

              {/* Cart Icon with Badge */}
              <IconButton
                color="inherit"
                component={Link}
                to="/cart"
              >
                <Badge badgeContent={cart?.totalItems || 0} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              {/* User Menu */}
              <Button
                color="inherit"
                startIcon={<PersonIcon />}
                component={Link}
                to="/profile"
              >
                {user?.firstName}
              </Button>

              {/* Admin Dashboard */}
              {user?.role === 'ADMIN' && (
                <Button color="inherit" component={Link} to="/admin">
                  Admin
                </Button>
              )}

              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
