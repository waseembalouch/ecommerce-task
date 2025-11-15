import { useState } from 'react';
import {
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Card,
  CardContent,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../../services/reviewService';
import { useAuthStore } from '../../stores/authStore';
import type { Review } from '../../types/api';

interface ProductReviewsProps {
  productId: string;
  averageRating?: number;
  reviewCount?: number;
}

export const ProductReviews = ({ productId, averageRating = 0, reviewCount = 0 }: ProductReviewsProps) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });

  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewService.getProductReviews(productId),
  });

  const createReviewMutation = useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      handleCloseDialog();
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      reviewService.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      handleCloseDialog();
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: reviewService.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  const handleOpenDialog = (review?: Review) => {
    if (review) {
      setEditingReview(review);
      setReviewData({
        rating: review.rating,
        comment: review.comment || '',
      });
    } else {
      setEditingReview(null);
      setReviewData({
        rating: 5,
        comment: '',
      });
    }
    setReviewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setReviewDialogOpen(false);
    setEditingReview(null);
    setReviewData({ rating: 5, comment: '' });
  };

  const handleSubmitReview = () => {
    if (editingReview) {
      updateReviewMutation.mutate({
        id: editingReview.id,
        data: reviewData,
      });
    } else {
      createReviewMutation.mutate({
        productId,
        ...reviewData,
      });
    }
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate rating distribution
  const getRatingDistribution = () => {
    if (!reviews || reviews.length === 0) return [0, 0, 0, 0, 0];

    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((review) => {
      distribution[review.rating - 1]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const userHasReviewed = reviews?.some((review) => review.user?.id === user?.id);

  if (error) {
    return (
      <Alert severity="error">
        Failed to load reviews. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Customer Reviews
      </Typography>

      {/* Rating Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={600}>
                  {averageRating.toFixed(1)}
                </Typography>
                <Rating value={averageRating} precision={0.1} size="large" readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Box>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <Box
                    key={rating}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ minWidth: 60 }}>
                      {rating} stars
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        reviewCount > 0
                          ? (ratingDistribution[rating - 1] / reviewCount) * 100
                          : 0
                      }
                      sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                      {ratingDistribution[rating - 1]}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Write Review Button */}
      {isAuthenticated && !userHasReviewed && (
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Write a Review
          </Button>
        </Box>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !reviews || reviews.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No reviews yet. Be the first to review this product!
          </Typography>
        </Box>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Box key={review.id}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {review.user?.firstName} {review.user?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {user?.id === review.user?.id && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(review)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2">{review.comment}</Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingReview ? 'Edit Review' : 'Write a Review'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Rating
            </Typography>
            <Rating
              value={reviewData.rating}
              onChange={(_event, newValue) => {
                setReviewData({ ...reviewData, rating: newValue || 1 });
              }}
              size="large"
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Review"
              value={reviewData.comment}
              onChange={(e) =>
                setReviewData({ ...reviewData, comment: e.target.value })
              }
              sx={{ mt: 3 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={
              !reviewData.comment.trim() ||
              createReviewMutation.isPending ||
              updateReviewMutation.isPending
            }
          >
            {createReviewMutation.isPending || updateReviewMutation.isPending
              ? 'Submitting...'
              : editingReview
              ? 'Update'
              : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
