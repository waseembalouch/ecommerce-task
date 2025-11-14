# React Frontend - Architecture Documentation

## Overview
Modern e-commerce frontend built with React 18, TypeScript, and Material UI (MUI v5). Provides a responsive, user-friendly interface for customers and administrators.

## Technology Stack

### Core Framework
- **React**: v18+ - UI library with concurrent rendering
- **TypeScript**: v5+ - Type safety and better DX
- **Vite**: v5+ - Fast build tool and dev server

### UI & Styling
- **Material UI (MUI)**: v5+ - Comprehensive component library
- **Emotion**: CSS-in-JS (MUI dependency)
- **MUI Icons**: Icon library
- **React Hook Form**: Form management
- **Zod**: Schema validation

### State Management
- **React Query (TanStack Query)**: Server state management
- **Zustand**: Client state management (lightweight alternative to Redux)

### Routing & Navigation
- **React Router**: v6+ - Client-side routing

### HTTP & API
- **Axios**: HTTP client with interceptors

### Additional Libraries
- **date-fns**: Date formatting and manipulation
- **react-hot-toast**: Toast notifications
- **react-dropzone**: File uploads

### Developer Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vite PWA Plugin**: Progressive Web App support (optional)

## Project Structure

```
frontend-react/
├── CLAUDE.md (this file)
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── index.html
│
├── public/
│   ├── favicon.ico
│   └── logo.png
│
└── src/
    ├── main.tsx               # Application entry point
    ├── App.tsx                # Root component
    ├── vite-env.d.ts          # Vite type declarations
    │
    ├── api/                   # API client and endpoints
    │   ├── client.ts          # Axios instance with interceptors
    │   ├── auth.api.ts
    │   ├── product.api.ts
    │   ├── cart.api.ts
    │   ├── order.api.ts
    │   └── user.api.ts
    │
    ├── components/            # Reusable components
    │   ├── common/            # Generic components
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Loading.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   └── Pagination.tsx
    │   │
    │   ├── layout/            # Layout components
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── MainLayout.tsx
    │   │
    │   ├── product/           # Product-specific components
    │   │   ├── ProductCard.tsx
    │   │   ├── ProductGrid.tsx
    │   │   ├── ProductFilters.tsx
    │   │   ├── ProductDetails.tsx
    │   │   └── ProductImageGallery.tsx
    │   │
    │   ├── cart/              # Cart components
    │   │   ├── CartItem.tsx
    │   │   ├── CartSummary.tsx
    │   │   └── CartDrawer.tsx
    │   │
    │   └── order/             # Order components
    │       ├── OrderItem.tsx
    │       ├── OrderSummary.tsx
    │       └── OrderTimeline.tsx
    │
    ├── pages/                 # Page components
    │   ├── Home.tsx
    │   ├── Products.tsx
    │   ├── ProductDetail.tsx
    │   ├── Cart.tsx
    │   ├── Checkout.tsx
    │   ├── Orders.tsx
    │   ├── OrderDetail.tsx
    │   ├── Profile.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── NotFound.tsx
    │   │
    │   └── admin/             # Admin pages
    │       ├── Dashboard.tsx
    │       ├── ProductList.tsx
    │       ├── ProductForm.tsx
    │       ├── OrderList.tsx
    │       └── UserList.tsx
    │
    ├── hooks/                 # Custom React hooks
    │   ├── useAuth.ts
    │   ├── useCart.ts
    │   ├── useProducts.ts
    │   ├── useOrders.ts
    │   ├── useDebounce.ts
    │   └── useLocalStorage.ts
    │
    ├── store/                 # Zustand stores
    │   ├── authStore.ts       # Authentication state
    │   ├── cartStore.ts       # Cart state
    │   └── uiStore.ts         # UI state (modals, drawers)
    │
    ├── contexts/              # React contexts (if needed)
    │   └── ThemeContext.tsx
    │
    ├── types/                 # TypeScript type definitions
    │   ├── api.types.ts       # API response types
    │   ├── product.types.ts
    │   ├── order.types.ts
    │   ├── user.types.ts
    │   └── cart.types.ts
    │
    ├── utils/                 # Utility functions
    │   ├── formatters.ts      # Format currency, dates
    │   ├── validators.ts      # Validation helpers
    │   ├── constants.ts       # App constants
    │   └── helpers.ts         # General helpers
    │
    ├── schemas/               # Zod validation schemas
    │   ├── auth.schema.ts
    │   ├── product.schema.ts
    │   ├── order.schema.ts
    │   └── user.schema.ts
    │
    ├── styles/                # Global styles
    │   ├── theme.ts           # MUI theme configuration
    │   ├── global.css         # Global CSS
    │   └── variables.css      # CSS variables
    │
    └── __tests__/             # Test files
        ├── components/
        ├── pages/
        └── utils/
```

## Architecture Patterns

### 1. Component Architecture
Components follow atomic design principles:
- **Atoms**: Basic building blocks (Button, Input)
- **Molecules**: Simple combinations (SearchBar, ProductCard)
- **Organisms**: Complex components (Header, ProductGrid)
- **Templates**: Page layouts (MainLayout)
- **Pages**: Full pages (Home, Products)

### 2. State Management Strategy

#### Server State (React Query)
```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/product.api';

export const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

#### Client State (Zustand)
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 3. API Client Configuration

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
```

### 4. Routing Configuration

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/admin/Dashboard';

const ProtectedRoute = ({ children, adminOnly = false }: any) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="admin/*"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Material UI Theme Configuration

```typescript
// styles/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

## Key Components Examples

### Product Card Component
```typescript
// components/product/ProductCard.tsx
import { Card, CardMedia, CardContent, Typography, Box, Button } from '@mui/material';
import { Product } from '../../types/product.types';
import { formatCurrency } from '../../utils/formatters';
import { useCartStore } from '../../store/cartStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addToCart = useCartStore((state) => state.addItem);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={product.images[0]?.url || '/placeholder.png'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {product.description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="primary">
            {formatCurrency(product.price)}
          </Typography>
          {product.comparePrice && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {formatCurrency(product.comparePrice)}
            </Typography>
          )}
        </Box>
      </CardContent>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => addToCart(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </Box>
    </Card>
  );
};
```

### Products Page with Filters
```typescript
// pages/Products.tsx
import { useState } from 'react';
import { Container, Grid, Box, CircularProgress } from '@mui/material';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import Pagination from '../components/common/Pagination';

export const Products: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 10000,
  });

  const { data, isLoading, error } = useProducts(filters);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <div>Error loading products</div>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <ProductFilters filters={filters} onChange={setFilters} />
        </Grid>

        {/* Product Grid */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={3}>
            {data?.products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              page={filters.page}
              totalPages={data?.totalPages || 1}
              onChange={(page) => setFilters({ ...filters, page })}
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
```

## Form Handling with React Hook Form

```typescript
// pages/Checkout.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Box } from '@mui/material';

const checkoutSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  zipCode: z.string().min(5, 'Zip code is required'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const Checkout: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    // Handle checkout
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        fullWidth
        label="First Name"
        {...register('firstName')}
        error={!!errors.firstName}
        helperText={errors.firstName?.message}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Last Name"
        {...register('lastName')}
        error={!!errors.lastName}
        helperText={errors.lastName?.message}
        margin="normal"
      />
      {/* More fields... */}
      <Button type="submit" variant="contained" size="large" fullWidth>
        Place Order
      </Button>
    </Box>
  );
};
```

## Responsive Design

### Breakpoints (MUI default)
- **xs**: 0px - 600px (mobile)
- **sm**: 600px - 900px (tablet)
- **md**: 900px - 1200px (small laptop)
- **lg**: 1200px - 1536px (desktop)
- **xl**: 1536px+ (large desktop)

### Responsive Component Example
```typescript
<Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    gap: { xs: 2, md: 4 },
    p: { xs: 2, md: 4 },
  }}
>
  {/* Content */}
</Box>
```

## Environment Variables

```env
# .env.example
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=E-Commerce Store
VITE_STRIPE_PUBLIC_KEY=
```

## Performance Optimization

### 1. Code Splitting
```typescript
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

### 2. Image Optimization
```typescript
<img
  src={`${imageUrl}?w=400&h=400&fit=cover`}
  srcSet={`${imageUrl}?w=200 200w, ${imageUrl}?w=400 400w`}
  loading="lazy"
  alt={altText}
/>
```

### 3. React Query Caching
- Automatic caching of server state
- Background refetching
- Optimistic updates

### 4. Memoization
```typescript
import { useMemo, useCallback } from 'react';

const expensiveValue = useMemo(() => computeExpensiveValue(deps), [deps]);
const memoizedCallback = useCallback(() => doSomething(), [deps]);
```

## Testing Strategy

### Component Tests (Vitest + Testing Library)
```typescript
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product information', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

## Deployment

### Docker Build
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Accessibility (a11y)

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Color contrast compliance (WCAG AA)
- Screen reader testing

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
