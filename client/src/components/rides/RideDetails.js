import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Avatar, 
  Chip, 
  Divider,
  Alert
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const RideDetails = () => {
  const { rideId } = useParams();
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('RideDetails Component - Received rideId:', rideId);

    const fetchRideDetails = async () => {
      // Validate rideId before making the request
      if (!rideId || rideId === 'undefined') {
        setError('Invalid ride ID');
        setLoading(false);
        return;
      }

      try {
        console.log('Attempting to fetch ride details for ID:', rideId);
        const response = await axios.get(`/api/rides/${rideId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Ride details response:', response.data);
        
        setRideDetails(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Detailed error fetching ride details:', error);
        
        // More detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          setError(`Server error: ${error.response.data.message || 'Failed to load ride details'}`);
        } else if (error.request) {
          // The request was made but no response was received
          setError('No response from server. Please check your internet connection.');
        } else {
          // Something happened in setting up the request
          setError('Error: ' + error.message);
        }
        
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  if (loading) return <Typography>Loading ride details...</Typography>;
  
  if (error) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );
  
  if (!rideDetails) return <Typography>No ride found</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Ride Details
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Route</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label="From" 
                color="primary" 
                size="small" 
                sx={{ mr: 1 }} 
              />
              <Typography>{rideDetails.from?.address || 'Not specified'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                label="To" 
                color="secondary" 
                size="small" 
                sx={{ mr: 1 }} 
              />
              <Typography>{rideDetails.to?.address || 'Not specified'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6">Ride Information</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography>
                <strong>Departure:</strong> {rideDetails.departureTime 
                  ? format(new Date(rideDetails.departureTime), 'PPp') 
                  : 'Not specified'}
              </Typography>
              <Typography>
                <strong>Available Seats:</strong> {rideDetails.availableSeats || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Creator</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={rideDetails.creator?.profilePicture 
              ? `http://localhost:3000/uploads/profile-pictures/${rideDetails.creator.profilePicture}` 
              : null
            }
          >
            {rideDetails.creator?.name?.[0] || '?'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">{rideDetails.creator?.name || 'Unknown Creator'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {rideDetails.creator?.email || 'No email'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Participants</Typography>
        {rideDetails.participants && rideDetails.participants.length > 0 ? (
          rideDetails.participants.map((participant) => (
            <Box 
              key={participant._id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2 
              }}
            >
              <Avatar 
                src={participant.profilePicture 
                  ? `http://localhost:3000/uploads/profile-pictures/${participant.profilePicture}` 
                  : null
                }
              >
                {participant.name?.[0] || '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{participant.name || 'Unknown'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {participant.email || 'No email'}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography>No participants yet</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default RideDetails;
