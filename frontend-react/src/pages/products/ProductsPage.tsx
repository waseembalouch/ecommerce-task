import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductFilters } from '../../components/products/ProductFilters';
import { Pagination } from '../../components/common/Pagination';

export const ProductsPage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    minPrice: 0,
    maxPrice: 5000,
    sort: '-createdAt',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  });

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search, page: 1 });
  };

  const handlePriceChange = (minPrice: number, maxPrice: number) => {
    setFilters({ ...filters, minPrice, maxPrice, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    setFilters({ ...filters, sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      minPrice: 0,
      maxPrice: 5000,
      sort: '-createdAt',
    });
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load products. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Products
      </Typography>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <ProductFilters
            search={filters.search}
            onSearchChange={handleSearchChange}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onPriceChange={handlePriceChange}
            sort={filters.sort}
            onSortChange={handleSortChange}
            onClear={handleClearFilters}
          />
        </Grid>

        {/* Products Grid */}
        <Grid item xs={12} md={9}>
          {isLoading ? (
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
          ) : data && data.data.length > 0 ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {data.data.length} of {data.meta.total} products
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {data.data.map((product) => (
                  <Grid item xs={12} sm={6} lg={4} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>

              <Pagination
                page={filters.page}
                totalPages={data.meta.totalPages}
                onChange={handlePageChange}
              />
            </>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
