import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Slider,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onClear: () => void;
}

export const ProductFilters = ({
  search,
  onSearchChange,
  minPrice,
  maxPrice,
  onPriceChange,
  sort,
  onSortChange,
  onClear,
}: ProductFiltersProps) => {
  const [priceRange, setPriceRange] = React.useState<number[]>([minPrice, maxPrice]);

  React.useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handlePriceChangeCommitted = (_event: any, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    onPriceChange(min, max);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search products..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ mb: 3 }}
      />

      {/* Sort */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Sort By</InputLabel>
        <Select value={sort} onChange={(e) => onSortChange(e.target.value)} label="Sort By">
          <MenuItem value="">None</MenuItem>
          <MenuItem value="+price">Price: Low to High</MenuItem>
          <MenuItem value="-price">Price: High to Low</MenuItem>
          <MenuItem value="+name">Name: A to Z</MenuItem>
          <MenuItem value="-name">Name: Z to A</MenuItem>
          <MenuItem value="-createdAt">Newest First</MenuItem>
          <MenuItem value="+createdAt">Oldest First</MenuItem>
        </Select>
      </FormControl>

      {/* Price Range */}
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Price Range</Typography>
        <Slider
          value={priceRange}
          onChange={handlePriceChange}
          onChangeCommitted={handlePriceChangeCommitted}
          valueLabelDisplay="auto"
          min={0}
          max={5000}
          step={50}
          valueLabelFormat={(value) => `$${value}`}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ${priceRange[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${priceRange[1]}
          </Typography>
        </Box>
      </Box>

      {/* Clear Filters */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={<ClearIcon />}
        onClick={onClear}
      >
        Clear Filters
      </Button>
    </Paper>
  );
};
