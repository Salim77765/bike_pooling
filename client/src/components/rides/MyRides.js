import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import api from '../../utils/api';
import { format, isPast } from 'date-fns';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [directions, setDirections] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalParticipants: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyRides();
  }, []);

  useEffect(() => {
    if (rides.length > 0) {
      applyFiltersAndSort();
      calculateStats();
    }
  }, [rides, sortBy, filterStatus, searchTerm, selectedTab]);

  const calculateStats = () => {
    const now = new Date();
    const stats = rides.reduce((acc, ride) => {
      acc.total++;
      if (isPast(new Date(ride.departureTime))) {
        acc.completed++;
      } else {
        acc.active++;
      }
      acc.totalParticipants += ride.participants.filter(p => p.status === 'accepted').length;
      return acc;
    }, { total: 0, active: 0, completed: 0, totalParticipants: 0 });
    setStats(stats);
  };

  const fetchMyRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/rides/created');
      console.log('My rides:', response.data);
      setRides(response.data);
    } catch (error) {
      console.error('Error fetching rides:', error);
      const errorMessage = error.response?.data?.message || 'Error fetching rides';
      setError(errorMessage);
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ride) => {
    navigate('/edit-ride/' + ride._id);
  };

  const handleDeleteConfirm = (ride) => {
    setSelectedRide(ride);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedRide) return;

    try {
      const response = await api.delete(`/rides/${selectedRide._id}`);
      console.log('Delete response:', response.data);
      showMessage(response.data.message || 'Ride deleted successfully');
      setOpenDeleteDialog(false);
      fetchMyRides();
    } catch (error) {
      console.error('Error deleting ride:', error.response || error);
      const errorMessage = error.response?.data?.message || 'Error deleting ride';
      showMessage(errorMessage, 'error');
    }
  };

  const handleViewParticipants = (ride) => {
    setSelectedRide(ride);
    setOpenDialog(true);
  };

  const handleViewMap = async (ride) => {
    setSelectedRide(ride);
    setOpenMapDialog(true);
    
    // Calculate directions
    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: { lat: ride.from.coordinates[1], lng: ride.from.coordinates[0] },
        destination: { lat: ride.to.coordinates[1], lng: ride.to.coordinates[0] },
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      
      setDirections(result);
    } catch (error) {
      console.error('Error calculating directions:', error);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...rides];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ride => {
        const isCompleted = isPast(new Date(ride.departureTime));
        return filterStatus === 'completed' ? isCompleted : !isCompleted;
      });
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(ride =>
        ride.from.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.to.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.departureTime) - new Date(a.departureTime);
        case 'participants':
          return b.participants.length - a.participants.length;
        case 'seats':
          return a.availableSeats - b.availableSeats;
        default:
          return 0;
      }
    });

    setFilteredRides(filtered);
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRide(null);
  };

  const handleCloseMapDialog = () => {
    setOpenMapDialog(false);
    setDirections(null);
    setSelectedRide(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRideStatus = (departureTime) => {
    return isPast(new Date(departureTime))
      ? { label: 'Completed', color: 'default' }
      : { label: 'Active', color: 'success' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchMyRides}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(45deg, #f5f5f5 30%, #ffffff 90%)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .05)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
            My Rides
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/create-ride"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
              boxShadow: '0 3px 5px 2px rgba(26, 35, 126, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #283593 30%, #1a237e 90%)',
              }
            }}
          >
            Create New Ride
          </Button>
        </Box>

        {rides.length > 0 ? (
          <Grid container spacing={3}>
            {rides.map((ride) => (
              <Grid item xs={12} md={6} key={ride._id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
                          {ride.from.address} → {ride.to.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(ride.departureTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          onClick={() => handleEdit(ride)}
                          sx={{
                            color: '#1565c0',
                            bgcolor: '#e3f2fd',
                            '&:hover': {
                              bgcolor: '#bbdefb',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteConfirm(ride)}
                          sx={{
                            color: '#d32f2f',
                            bgcolor: '#ffebee',
                            '&:hover': {
                              bgcolor: '#ffcdd2',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        icon={<PersonIcon />}
                        label={`${ride.participants.length} Participants`}
                        onClick={() => handleViewParticipants(ride)}
                        sx={{
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                          '&:hover': {
                            bgcolor: '#bbdefb'
                          }
                        }}
                      />
                      <Chip
                        icon={<MapIcon />}
                        label="View Route"
                        onClick={() => handleViewMap(ride)}
                        sx={{
                          bgcolor: '#e8eaf6',
                          color: '#3f51b5',
                          '&:hover': {
                            bgcolor: '#c5cae9'
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 1, 
                      bgcolor: '#f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Available Seats
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {ride.availableSeats}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Distance
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {ride.distance} km
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {ride.duration} min
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: '#f5f5f5'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No rides found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a new ride to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/create-ride"
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
                boxShadow: '0 3px 5px 2px rgba(26, 35, 126, .3)',
              }}
            >
              Create New Ride
            </Button>
          </Paper>
        )}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: '100%',
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#1a237e', 
          color: 'white',
          py: 2
        }}>
          Ride Participants
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <List>
            {selectedRide?.participants.map((participant) => (
              <ListItem 
                key={participant._id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: '#f5f5f5'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#1a237e' }}>
                    {participant.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.name}
                  secondary={participant.email}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: '100%',
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#d32f2f',
          color: 'white',
          py: 2
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            Are you sure you want to delete this ride? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              color: '#d32f2f',
              '&:hover': {
                bgcolor: '#ffebee'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              bgcolor: '#d32f2f',
              '&:hover': {
                bgcolor: '#b71c1c'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openMapDialog}
        onClose={handleCloseMapDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Route Map</DialogTitle>
        <DialogContent>
          {selectedRide && (
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={{ height: '400px', width: '100%' }}
                center={{
                  lat: selectedRide.from.coordinates[1],
                  lng: selectedRide.from.coordinates[0]
                }}
                zoom={12}
              >
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true
                    }}
                  />
                )}
                <Marker
                  position={{
                    lat: selectedRide.from.coordinates[1],
                    lng: selectedRide.from.coordinates[0]
                  }}
                  label="A"
                />
                <Marker
                  position={{
                    lat: selectedRide.to.coordinates[1],
                    lng: selectedRide.to.coordinates[0]
                  }}
                  label="B"
                />
              </GoogleMap>
            </LoadScript>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMapDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyRides;
