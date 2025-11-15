import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import type { Address } from '../../types/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, setAuth } = useAuthStore();

  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    isDefault: false,
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch addresses
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: userService.getAddresses,
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (updatedUser) => {
      setAuth(updatedUser, useAuthStore.getState().token || '');
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: () => {
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: () => {
      setErrorMessage('Failed to change password');
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  // Create/Update address mutation
  const saveAddressMutation = useMutation({
    mutationFn: (data: Partial<Address>) => {
      if (editingAddress) {
        return userService.updateAddress(editingAddress.id, data);
      }
      return userService.createAddress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      handleCloseAddressDialog();
      setSuccessMessage(editingAddress ? 'Address updated!' : 'Address added!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: userService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSuccessMessage('Address deleted!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleOpenAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressFormData({
        fullName: address.fullName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
        isDefault: address.isDefault || false,
      });
    } else {
      setEditingAddress(null);
      setAddressFormData({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        phone: '',
        isDefault: false,
      });
    }
    setAddressDialogOpen(true);
  };

  const handleCloseAddressDialog = () => {
    setAddressDialogOpen(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = () => {
    saveAddressMutation.mutate(addressFormData);
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}}>
            <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Please Log In
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}}>
              You need to be logged in to view your profile
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/login')}}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: 3 }}}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}}>
        My Profile
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}}>
          {errorMessage}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}}>
          <Tabs value={tabValue} onChange={handleTabChange}}>
            <Tab label="Account Details" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Addresses" icon={<LocationIcon />} iconPosition="start" />
            <Tab label="Change Password" icon={<LockIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Account Details Tab */}
        <TabPanel value={tabValue} index={0}}>
          <CardContent>
            <Box component="form" onSubmit={handleUpdateProfile}}>
              <Grid container spacing={3}}>
                <Grid size={{ xs:{12}, sm:{6}}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs:{12}, sm:{6}}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs:{12}}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs:{12}}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Addresses Tab */}
        <TabPanel value={tabValue} index={1}}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}}>
              <Typography variant="h6">Saved Addresses</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAddressDialog()}
              >
                Add Address
              </Button>
            </Box>

            {!addresses || addresses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}}>
                <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No saved addresses yet
                </Typography>
              </Box>
            ) : (
              <List>
                {addresses.map((address) => (
                  <ListItem
                    key={address.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 2,
                    }}
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" onClick={() => handleOpenAddressDialog(address)}}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}}>
                          <Typography variant="subtitle1" fontWeight={600}}>
                            {address.fullName}
                          </Typography>
                          {address.isDefault && (
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              Default
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </Typography>
                          <Typography variant="body2">
                            {address.city}, {address.state} {address.postalCode}
                          </Typography>
                          <Typography variant="body2">{address.country}</Typography>
                          <Typography variant="body2">Phone: {address.phone}</Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </TabPanel>

        {/* Change Password Tab */}
        <TabPanel value={tabValue} index={2}}>
          <CardContent>
            <Box component="form" onSubmit={handleChangePassword}}>
              <Grid container spacing={3}}>
                <Grid size={{ xs:{12}}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid size={{ xs:{12}}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    helperText="Must be at least 8 characters"
                  />
                </Grid>
                <Grid size={{ xs:{12}}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onClose={handleCloseAddressDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}}>
            <Grid size={{ xs:{12}}>
              <TextField
                fullWidth
                label="Full Name"
                value={addressFormData.fullName}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, fullName: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs:{12}}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={addressFormData.addressLine1}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, addressLine1: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs:{12}}>
              <TextField
                fullWidth
                label="Address Line 2 (Optional)"
                value={addressFormData.addressLine2}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, addressLine2: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs:{12}, sm:{6}}>
              <TextField
                fullWidth
                label="City"
                value={addressFormData.city}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, city: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs:{12}, sm:{6}}>
              <TextField
                fullWidth
                label="State/Province"
                value={addressFormData.state}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, state: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs:{12}, sm:{6}}>
              <TextField
                fullWidth
                label="Postal Code"
                value={addressFormData.postalCode}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, postalCode: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs:{12}, sm:{6}}>
              <TextField
                fullWidth
                label="Country"
                value={addressFormData.country}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, country: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs:{12}}>
              <TextField
                fullWidth
                label="Phone Number"
                value={addressFormData.phone}
                onChange={(e) =>
                  setAddressFormData({ ...addressFormData, phone: e.target.value })
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddressDialog}}>Cancel</Button>
          <Button
            onClick={handleSaveAddress}
            variant="contained"
            disabled={saveAddressMutation.isPending}
          >
            {saveAddressMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
