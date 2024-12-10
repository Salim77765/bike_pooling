import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, DirectionsRenderer, useLoadScript } from '@react-google-maps/api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { format } from 'date-fns';
import PlacesAutocomplete from './PlacesAutocomplete';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import JoinIcon from '@mui/icons-material/GroupAdd';

const libraries = ['places', 'marker'];

const SearchRides = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Always declare mapRef before any conditional logic
  const mapRef = useRef(null);
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [searchLocations, setSearchLocations] = useState({
    from: null,
    to: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [currentRideToJoin, setCurrentRideToJoin] = useState(null);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rides');
      // Filter out rides with no available seats or status 'full'
      const availableRides = response.data.filter(ride => 
        ride.availableSeats > 0 && ride.status !== 'full'
      );
      
      // Log rides for debugging
      console.log('Fetched Available Rides:', availableRides.map(ride => ({
        id: ride._id,
        from: ride.from.address,
        to: ride.to.address,
        availableSeats: ride.availableSeats,
        status: ride.status
      })));
      
      setRides(availableRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      showMessage(error.response?.data?.message || 'Error fetching rides', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshRides = async () => {
    try {
      const response = await api.get('/rides');
      const availableRides = response.data.filter(ride => 
        ride.availableSeats > 0 && ride.status !== 'full'
      );
      setRides(availableRides);
    } catch (error) {
      console.error('Error refreshing rides:', error);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleJoinRideClick = (ride) => {
    setCurrentRideToJoin(ride);
    setJoinDialogOpen(true);
  };

  const handleConfirmJoinRide = async () => {
    // ULTRA VERBOSE DEBUGGING
    console.error('🚨 JOIN RIDE - CRITICAL TRACE 🚨', {
      currentRideToJoin: JSON.stringify(currentRideToJoin, null, 2),
      user: JSON.stringify(user, null, 2),
      stackTrace: new Error().stack
    });

    // Defensive programming with extreme null checks
    if (!currentRideToJoin) {
      console.error('CRITICAL: currentRideToJoin is COMPLETELY UNDEFINED');
      showMessage('No ride selected. Impossible to proceed.', 'error');
      return;
    }

    // Comprehensive object property validation
    const safeGet = (obj, path, defaultValue = undefined) => {
      return path.split('.').reduce((acc, part) => 
        acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
    };

    // Validate every single property with extreme prejudice
    const validateRideObject = (ride) => {
      const criticalErrors = [];

      const requiredPaths = [
        '_id', 
        'from.address', 
        'to.address', 
        'creator.name'
      ];

      requiredPaths.forEach(path => {
        const value = safeGet(ride, path);
        if (value === undefined) {
          criticalErrors.push(`Missing critical path: ${path}`);
          console.error(`🚨 UNDEFINED PATH: ${path}`, { 
            fullObject: JSON.stringify(ride, null, 2) 
          });
        }
      });

      return criticalErrors;
    };

    const validationErrors = validateRideObject(currentRideToJoin);
    
    if (validationErrors.length > 0) {
      console.error('🚨 RIDE OBJECT VALIDATION FAILED 🚨', {
        errors: validationErrors,
        rideObject: JSON.stringify(currentRideToJoin, null, 2)
      });
      
      showMessage('Invalid ride details. Cannot proceed.', 'error');
      return;
    }

    try {
      // Extremely defensive payload creation
      const requestPayload = {
        rideId: safeGet(currentRideToJoin, '_id', null),
        userId: safeGet(user, '_id', null),
        fromAddress: safeGet(currentRideToJoin, 'from.address', ''),
        toAddress: safeGet(currentRideToJoin, 'to.address', ''),
        creatorName: safeGet(currentRideToJoin, 'creator.name', 'Unknown')
      };

      console.log('🔍 SAFE REQUEST PAYLOAD:', JSON.stringify(requestPayload, null, 2));

      // Validate payload before sending
      Object.entries(requestPayload).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          console.error(`🚨 PAYLOAD VALIDATION FAILED: ${key} is undefined/null`);
          throw new Error(`Invalid payload: ${key} cannot be undefined`);
        }
      });

      // Make API call
      const response = await api.post(`/rides/${requestPayload.rideId}/join`, requestPayload);

      console.log('✅ JOIN RIDE SUCCESS:', JSON.stringify(response.data, null, 2));

      showMessage(response.data.message || 'Ride request sent successfully!', 'success');
      
      // Refresh rides to get updated seat counts
      await refreshRides();

      // Reset dialog state
      setJoinDialogOpen(false);
      setCurrentRideToJoin(null);

    } catch (error) {
      // MAXIMUM ERROR LOGGING
      console.error('🚨 JOIN RIDE - CATASTROPHIC FAILURE 🚨', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        responseStatus: error.response?.status,
        responseData: JSON.stringify(error.response?.data, null, 2)
      });

      // User-friendly error message with fallback
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.details || 
        error.message || 
        'Catastrophic failure in ride joining process';

      showMessage(errorMessage, 'error');
      
      // Ensure complete state reset
      setJoinDialogOpen(false);
      setCurrentRideToJoin(null);
    }
  };

  const handleSearch = async () => {
    // Validate addresses
    if (!searchLocations.from || !searchLocations.to) {
      showMessage('Please select both pickup and drop-off locations', 'warning');
      return;
    }

    // Validate address strings
    const fromAddress = searchLocations.from.address;
    const toAddress = searchLocations.to.address;
    const fromCoordinates = searchLocations.from.coordinates;
    const toCoordinates = searchLocations.to.coordinates;

    if (!fromAddress || !toAddress) {
      showMessage('Please provide complete location addresses', 'error');
      return;
    }

    // Log detailed location information for debugging
    console.log('RIDE SEARCH DETAILS:', {
      fromLocation: {
        fullLocation: searchLocations.from,
        address: fromAddress,
        coordinates: fromCoordinates
      },
      toLocation: {
        fullLocation: searchLocations.to,
        address: toAddress,
        coordinates: toCoordinates
      }
    });

    // Prepare search parameters
    const searchParams = {
      fromAddress,
      toAddress,
      fromCoordinates,
      toCoordinates
    };

    setLoading(true);
    try {
      const response = await api.post('/rides/search', searchParams);
      
      // Log search response details with safe creator access
      console.log('SEARCH RESPONSE:', {
        searchParams,
        ridesFound: response.data.length,
        rides: response.data.map(ride => ({
          id: ride._id,
          fromAddress: ride.from.address,
          toAddress: ride.to.address,
          creator: ride.creator?.name || 'Unknown',
          departureTime: ride.departureTime
        }))
      });

      // Safely process rides with fallback for creator information
      const processedRides = response.data.map(ride => ({
        ...ride,
        creator: {
          name: ride.creator?.name || 'Unknown',
          email: ride.creator?.email || '',
          phone: ride.creator?.phone || ''
        }
      }));

      setRides(processedRides);
      
      if (processedRides.length === 0) {
        // More informative message when no rides are found
        showMessage(`No rides found between ${fromAddress} and ${toAddress}. Try broader locations or check back later.`, 'info');
      } else {
        showMessage(`Found ${processedRides.length} rides between ${fromAddress} and ${toAddress}`, 'success');
      }
    } catch (error) {
      console.error('COMPREHENSIVE Search Error:', {
        error: error.response?.data || error.message,
        requestData: searchParams
      });
      
      // More detailed error handling
      if (error.response) {
        const errorDetails = error.response.data;
        showMessage(
          errorDetails.details || 
          errorDetails.message || 
          'Error searching rides', 
          'error'
        );
        console.error('Server error details:', errorDetails);
      } else if (error.request) {
        showMessage('No response from server. Please check your connection.', 'error');
      } else {
        showMessage('An unexpected error occurred', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = useCallback(async (ride) => {
    if (!window.google || !ride?.from?.coordinates || !ride?.to?.coordinates) return;

    const directionsService = new window.google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin: { lat: ride.from.coordinates[1], lng: ride.from.coordinates[0] },
        destination: { lat: ride.to.coordinates[1], lng: ride.to.coordinates[0] },
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      setDirections(result);
      setDistance(result.routes[0].legs[0].distance.text);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, []);

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
    calculateRoute(ride);
  };

  const handleViewMap = (ride) => {
    setSelectedRide(ride);
    calculateRoute(ride);
  };

  // Consistent marker rendering
  const renderMarkers = useCallback(() => {
    // Defensive programming with early return
    if (!window.google || !selectedRide || !mapRef.current) return null;

    const createMarkerElement = (coordinates, title, label, color) => {
      if (!coordinates || coordinates.length < 2) return null;

      try {
        return new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: {
            lat: coordinates[1],
            lng: coordinates[0]
          },
          title: title,
          content: (() => {
            const markerDiv = document.createElement('div');
            markerDiv.innerHTML = `
              <div style="
                background-color: ${color}; 
                color: white; 
                padding: 5px 10px; 
                border-radius: 5px; 
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
              ">${label}</div>
            `;
            return markerDiv;
          })()
        });
      } catch (error) {
        console.error('Error creating marker:', error);
        return null;
      }
    };

    const fromMarker = createMarkerElement(
      selectedRide.from?.coordinates, 
      'Starting Point', 
      'A', 
      'green'
    );

    const toMarker = createMarkerElement(
      selectedRide.to?.coordinates, 
      'Destination', 
      'B', 
      'red'
    );

    return [fromMarker, toMarker].filter(marker => marker !== null);
  }, [selectedRide]);

  const renderRidesList = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {rides.map((ride) => (
          <Grid item xs={12} md={6} key={ride._id}>
            <Card
              sx={{
                borderRadius: 2,
                background: selectedRide?._id === ride._id 
                  ? 'linear-gradient(45deg, #e3f2fd 30%, #bbdefb 90%)'
                  : '#fff',
                boxShadow: selectedRide?._id === ride._id 
                  ? '0 4px 10px rgba(30, 136, 229, 0.2)'
                  : '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                }
              }}
              onClick={() => handleRideSelect(ride)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
                    {ride.from.address} → {ride.to.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {new Date(ride.departureTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    icon={<PersonIcon />}
                    label={`${ride.availableSeats} seats`}
                    size="small"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMap(ride);
                    }}
                    sx={{
                      bgcolor: '#e8eaf6',
                      color: '#3f51b5',
                      '&:hover': {
                        bgcolor: '#c5cae9'
                      }
                    }}
                  />
                  <Chip
                    icon={<JoinIcon />}
                    label="Join Ride"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinRideClick(ride);
                    }}
                    sx={{
                      bgcolor: '#e8eaf6',
                      color: '#3f51b5',
                      '&:hover': {
                        bgcolor: '#c5cae9'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#1a237e' }}>
                    {ride.creator.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {ride.creator.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ride.creator.email}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    region: 'IN', // Specify India region
    version: 'weekly', // Use the latest stable version
    language: 'en' // Set language to English
  });

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps script load error:', loadError);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Failed to load Google Maps. Please check your internet connection or try again later.'
      });
    }
  }, [loadError]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <CircularProgress />;
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
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: '#1a237e' }}>
          Search Rides
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PlacesAutocomplete
              onSelect={(place) => setSearchLocations((prev) => ({ ...prev, from: place }))}
              placeholder="Starting point"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PlacesAutocomplete
              onSelect={(place) => setSearchLocations((prev) => ({ ...prev, to: place }))}
              placeholder="Destination"
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSearch}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
              boxShadow: '0 3px 5px 2px rgba(26, 35, 126, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #283593 30%, #1a237e 90%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search Rides'}
          </Button>
        </Box>
      </Paper>

      {rides.length > 0 && (
        renderRidesList()
      )}

      <Grid item xs={12} md={8}>
        <Paper sx={{ height: 'calc(100vh - 100px)' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={12}
            center={
              selectedRide
                ? { lat: selectedRide.from.coordinates[1], lng: selectedRide.from.coordinates[0] }
                : { lat: 17.4065, lng: 78.4772 } // Hyderabad coordinates as default
            }
            ref={mapRef}
          >
            {selectedRide && (
              <>
                {renderMarkers()}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true
                    }}
                  />
                )}
              </>
            )}
          </GoogleMap>
        </Paper>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        aria-labelledby="join-ride-dialog-title"
      >
        <DialogTitle id="join-ride-dialog-title">
          Join Ride
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send a join request for this ride?
            {currentRideToJoin && (
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Creator:</strong> {currentRideToJoin.creator.name}
                </Typography>
                <Typography variant="body2">
                  <strong>From:</strong> {currentRideToJoin.from.address}
                </Typography>
                <Typography variant="body2">
                  <strong>To:</strong> {currentRideToJoin.to.address}
                </Typography>
                <Typography variant="body2">
                  <strong>Departure Time:</strong> {format(new Date(currentRideToJoin.departureTime), 'PPp')}
                </Typography>
                <Typography variant="body2">
                  <strong>Available Seats:</strong> {currentRideToJoin.availableSeats}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmJoinRide} color="primary" autoFocus>
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SearchRides;
