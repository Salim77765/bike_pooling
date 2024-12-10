import React, { useState, useEffect } from 'react';
import { 
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Avatar,
  Chip,
  useTheme,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme();
  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await axios.get('/api/rides');
        setRides(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch rides. Please try again later.');
      } finally {
        setRidesLoading(false);
      }
    };

    // Only fetch rides if authentication is complete
    if (!authLoading) {
      fetchRides();
    }
  }, [authLoading]);

  // Safely handle user object
  const getUserFirstName = () => {
    if (!user || !user.name) return 'User';
    const nameParts = user.name.split(' ');
    return nameParts[0] || 'User';
  };

  const getUserInitial = () => {
    if (!user || !user.name) return '?';
    return user.name[0].toUpperCase();
  };

  // Global loading state
  if (authLoading || ridesLoading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress color="primary" />
      </Container>
    );
  }

  const renderUserStats = () => {
    const stats = [
      { label: 'Total Rides', value: rides.length },
      { label: 'Department', value: user?.department || 'N/A' }
    ];

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={6} key={stat.label}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h4" color="primary">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      { 
        icon: <AddIcon />, 
        label: 'Create Ride', 
        color: 'primary', 
        onClick: () => navigate('/create-ride') 
      },
      { 
        icon: <SearchIcon />, 
        label: 'Find Rides', 
        color: 'secondary', 
        onClick: () => navigate('/search-rides') 
      },
      { 
        icon: <NotificationsActiveIcon />, 
        label: 'Notifications', 
        color: 'warning', 
        onClick: () => navigate('/notifications') 
      }
    ];

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {actions.map((action) => (
          <Grid item xs={4} key={action.label}>
            <Card 
              variant="outlined" 
              sx={{ 
                textAlign: 'center', 
                transition: 'transform 0.3s ease',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <IconButton 
                  color={action.color} 
                  sx={{ mb: 1 }}
                  onClick={action.onClick}
                >
                  {action.icon}
                </IconButton>
                <Typography variant="subtitle2">{action.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 4,
        gap: 2 
      }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: theme.palette.primary.main 
          }}
        >
          {getUserInitial()}
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Welcome, {getUserFirstName()}
          </Typography>
          <Chip 
            icon={<DirectionsBikeIcon />} 
            label={`${user?.department || 'MLRIT'} Rider`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
      </Box>

      {renderQuickActions()}
      {renderUserStats()}
    </Container>
  );
};

export default Dashboard;
