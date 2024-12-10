import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useLoadScript } from '@react-google-maps/api';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { format } from 'date-fns';
import PlacesAutocomplete from './PlacesAutocomplete';

const libraries = ['places'];

const CreateRide = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [formData, setFormData] = useState({
    from: null,
    to: null,
    departureTime: new Date(),
    availableSeats: 1
  });
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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

  const calculateRoute = useCallback(async () => {
    if (formData.from && formData.to && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      try {
        const result = await directionsService.route({
          origin: { lat: formData.from.coordinates[1], lng: formData.from.coordinates[0] },
          destination: { lat: formData.to.coordinates[1], lng: formData.to.coordinates[0] },
          travelMode: window.google.maps.TravelMode.DRIVING
        });
        setDirections(result);
        // Calculate distance in kilometers
        const distanceInMeters = result.routes[0].legs[0].distance.value;
        const distanceInKm = (distanceInMeters / 1000).toFixed(2);
        setDistance(distanceInKm);
      } catch (error) {
        console.error('Error calculating route:', error);
        showMessage('Error calculating route', 'error');
      }
    }
  }, [formData.from, formData.to]);

  useEffect(() => {
    if (isLoaded && formData.from && formData.to) {
      calculateRoute();
    }
  }, [calculateRoute, isLoaded, formData.from, formData.to]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to) {
      showMessage('Please select both pickup and drop-off locations', 'error');
      return;
    }

    try {
      await axios.post('/api/rides', {
        ...formData,
        departureTime: formData.departureTime.toISOString()
      });
      showMessage('Ride created successfully! 🎉');
      setFormData({
        from: null,
        to: null,
        departureTime: new Date(),
        availableSeats: 1
      });
      setDirections(null);
      setDistance(null);
    } catch (error) {
      console.error('Error creating ride:', error);
      showMessage(error.response?.data?.msg || 'Failed to create ride', 'error');
    }
  };

  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">
            Error loading Google Maps. Please check your internet connection and try again.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!isLoaded) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading Google Maps...</Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create a Ride
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <PlacesAutocomplete
                label="From"
                onSelect={(location) => setFormData(prev => ({ ...prev, from: location }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <PlacesAutocomplete
                label="To"
                onSelect={(location) => setFormData(prev => ({ ...prev, to: location }))}
              />
            </Grid>

            {distance && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="primary">
                  Distance: {distance} km
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Departure Time"
                type="datetime-local"
                value={format(formData.departureTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData(prev => ({ ...prev, departureTime: new Date(e.target.value) }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Available Seats"
                type="number"
                value={formData.availableSeats}
                onChange={(e) => setFormData(prev => ({ ...prev, availableSeats: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 4 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Create Ride
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ height: '400px' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={formData.from ? { 
                  lat: formData.from.coordinates[1], 
                  lng: formData.from.coordinates[0] 
                } : { lat: 17.4065, lng: 78.4772 }}
                zoom={13}
              >
                {formData.from && (
                  <Marker
                    position={{
                      lat: formData.from.coordinates[1],
                      lng: formData.from.coordinates[0]
                    }}
                    label="A"
                  />
                )}
                {formData.to && (
                  <Marker
                    position={{
                      lat: formData.to.coordinates[1],
                      lng: formData.to.coordinates[0]
                    }}
                    label="B"
                  />
                )}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: '#2196F3',
                        strokeWeight: 4
                      }
                    }}
                  />
                )}
              </GoogleMap>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateRide;
