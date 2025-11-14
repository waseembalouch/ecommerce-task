import { Box, Button, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Container>
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to E-Commerce Store
        </Typography>

        {isAuthenticated ? (
          <Typography variant="h5" color="text.secondary" paragraph>
            Hello, {user?.firstName}! Start shopping for amazing products.
          </Typography>
        ) : (
          <Typography variant="h5" color="text.secondary" paragraph>
            Sign in to start shopping
          </Typography>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/products"
          >
            Browse Products
          </Button>

          {!isAuthenticated && (
            <>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/login"
              >
                Login
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/register"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};
