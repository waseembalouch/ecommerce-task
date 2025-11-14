import { Pagination as MuiPagination, Box } from '@mui/material';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  const handleChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onChange(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={handleChange}
        color="primary"
        size="large"
        showFirstButton
        showLastButton
      />
    </Box>
  );
};
