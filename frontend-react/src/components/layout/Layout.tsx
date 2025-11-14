import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container
        component="main"
        maxWidth="xl"
        sx={{ flexGrow: 1, py: 4 }}
      >
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="xl">
          <Box textAlign="center">
            © 2025 E-Commerce. All rights reserved.
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
