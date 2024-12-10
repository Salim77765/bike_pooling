import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import api from '../../utils/api';

const RideRequests = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchUserRides();
  }, []);

  const fetchUserRides = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching rides...');
      const response = await api.get('/rides/created');
      console.log('Rides response:', response.data);
      setRides(response.data);
    } catch (error) {
      console.error('Error details:', error.response || error);
      const errorMessage = error.response?.data?.message || error.message || 'Error fetching rides';
      setError(errorMessage);
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (rideId, participantId) => {
    try {
      console.log('Attempting to accept request:', {
        rideId, 
        participantId,
        fullUrl: `/rides/${rideId}/accept/${participantId}`
      });

      const response = await api.post(`/rides/${rideId}/accept/${participantId}`);
      
      console.log('Accept request full response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
        config: response.config
      });

      // More robust success checking
      const isSuccessful = 
        response.status === 200 || 
        response.status === 201 || 
        (response.data && response.data.ride);

      if (isSuccessful) {
        // Explicitly log success details
        console.log('Request acceptance successful:', {
          rideId: response.data.ride?._id,
          message: response.data.message
        });

        showMessage('Request accepted successfully', 'success');
        fetchUserRides();
        return;
      }

      // If we reach here, something unexpected happened
      throw new Error('Unexpected response when accepting request');
    } catch (error) {
      // Detailed error logging with full error object
      console.error('Comprehensive Accept Request Error Details:', {
        fullErrorObject: error,
        errorName: error.name,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestDetails: {
          rideId,
          participantId
        },
        // Additional error context from Axios
        axiosErrorDetails: {
          config: error.config ? {
            method: error.config.method,
            url: error.config.url,
            data: error.config.data
          } : 'No config available',
          headers: error.response?.headers,
          statusText: error.response?.statusText
        }
      });

      // More detailed error message with specific scenarios
      let errorMessage = 'Failed to update ride';
      
      if (error.response?.status === 400) {
        // Handle specific 400 Bad Request scenarios
        if (error.response.data?.msg === 'Request already accepted') {
          errorMessage = 'This request has already been accepted';
        } else if (error.response.data?.msg === 'No seats available') {
          errorMessage = 'All seats for this ride are already filled';
        }
      }

      // Always show the error message
      showMessage(errorMessage, 'error');

      // Re-throw to potentially allow further error handling
      throw error;
    }
  };

  const handleRejectRequest = async (rideId, participantId) => {
    try {
      console.log('Attempting to reject request:', {
        rideId, 
        participantId,
        fullUrl: `/rides/${rideId}/reject-participant/${participantId}`
      });

      const response = await api.post(`/rides/${rideId}/reject-participant/${participantId}`);
      
      console.log('Reject request full response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
        config: response.config
      });

      // More robust success checking
      const isSuccessful = 
        response.status === 200 || 
        response.status === 201 || 
        (response.data && response.data.ride);

      if (isSuccessful) {
        // Explicitly log success details
        console.log('Request rejection successful:', {
          rideId: response.data.ride?._id,
          message: response.data.message
        });

        showMessage('Request rejected successfully', 'success');
        fetchUserRides();
        return;
      }

      // If we reach here, something unexpected happened
      throw new Error('Unexpected response when rejecting request');
    } catch (error) {
      // Detailed error logging with full error object
      console.error('Comprehensive Reject Request Error Details:', {
        fullErrorObject: error,
        errorName: error.name,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestDetails: {
          rideId,
          participantId
        },
        // Additional error context from Axios
        axiosErrorDetails: {
          config: error.config ? {
            method: error.config.method,
            url: error.config.url,
            data: error.config.data
          } : 'No config available',
          headers: error.response?.headers,
          statusText: error.response?.statusText
        }
      });

      // More detailed error message with specific scenarios
      let errorMessage = 'Failed to update ride';
      
      if (error.response?.status === 400) {
        // Handle specific 400 Bad Request scenarios
        if (error.response.data?.msg === 'Participant not found') {
          errorMessage = 'This participant is no longer in the ride request list';
        }
      }

      // Always show the error message
      showMessage(errorMessage, 'error');

      // Re-throw to potentially allow further error handling
      throw error;
    }
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

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getPendingRequests = (ride) => {
    return ride.participants.filter(p => p.status === 'pending');
  };

  const getAcceptedRequests = (ride) => {
    return ride.participants.filter(p => p.status === 'accepted');
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
        <Button variant="contained" onClick={fetchUserRides}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Ride Requests
        </Typography>

        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label={`Pending Requests (${rides.reduce((acc, ride) => acc + getPendingRequests(ride).length, 0)})`} />
          <Tab label={`Accepted Requests (${rides.reduce((acc, ride) => acc + getAcceptedRequests(ride).length, 0)})`} />
        </Tabs>

        {rides.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No rides created yet
          </Typography>
        ) : (
          rides.map((ride) => {
            const pendingRequests = getPendingRequests(ride);
            const acceptedRequests = getAcceptedRequests(ride);
            const requestsToShow = selectedTab === 0 ? pendingRequests : acceptedRequests;

            if (requestsToShow.length === 0) return null;

            return (
              <Card key={ride._id} sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Ride Details
                      </Typography>
                      <Typography variant="body1">
                        From: {ride.from.address}
                      </Typography>
                      <Typography variant="body1">
                        To: {ride.to.address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Departure: {format(new Date(ride.departureTime), 'PPp')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Available Seats: {ride.availableSeats - getAcceptedRequests(ride).length}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedTab === 0 ? 'Pending Requests' : 'Accepted Requests'}
                      </Typography>

                      {requestsToShow.map((participant) => (
                        <Box
                          key={participant._id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body1">
                                Name: {participant.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Phone: {participant.phone}
                              </Typography>
                            </Grid>
                            {selectedTab === 0 && (
                              <Grid item xs={12} sm={6} container justifyContent="flex-end" spacing={1}>
                                <Grid item>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleAcceptRequest(ride._id, participant._id)}
                                  >
                                    Accept
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleRejectRequest(ride._id, participant._id)}
                                  >
                                    Reject
                                  </Button>
                                </Grid>
                              </Grid>
                            )}
                            {selectedTab === 1 && (
                              <Grid item xs={12} sm={6} container justifyContent="flex-end">
                                <Chip
                                  label="Accepted"
                                  color="success"
                                  variant="outlined"
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      ))}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })
        )}
      </Paper>

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

export default RideRequests;
