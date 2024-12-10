import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  DirectionsBike,
  AccessTime,
  LocationOn,
  Person,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StyledCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const StyledContent = styled(CardContent)({
  flexGrow: 1,
});

const StyledLocationText = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const StyledIcon = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(1),
  fontSize: '1.2rem',
  verticalAlign: 'middle',
  display: 'flex',
  alignItems: 'center',
  '& > svg': {
    fontSize: '1.2rem',
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const StyledActions = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const StyledSeatsAvailable = styled(Typography)(({ theme }) => ({
  color: theme.palette.success.main,
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
}));

const RideCard = ({ ride, onUpdate }) => {
  const { user } = useAuth();
  const [openParticipants, setOpenParticipants] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    name: '',
    phone: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const isCreator = user && ride.creator && user._id === ride.creator._id;

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleJoinDialogOpen = () => {
    if (!user) {
      showMessage('Please login to join rides', 'warning');
      return;
    }
    setOpenJoinDialog(true);
  };

  const handleJoinDialogClose = () => {
    setOpenJoinDialog(false);
    setJoinFormData({ name: '', phone: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJoinFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJoinRide = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/rides/${ride._id}/join`, joinFormData);
      handleJoinDialogClose();
      if (onUpdate) onUpdate();
      showMessage(response.data.message || 'Successfully sent join request! 🎉', 'success');
    } catch (error) {
      console.error('Error joining ride:', error);
      showMessage(error.response?.data?.msg || 'Failed to join ride', 'error');
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteRide = async () => {
    try {
      await axios.delete(`/api/rides/${ride._id}`);
      if (onUpdate) onUpdate();
      showMessage('Ride successfully deleted');
    } catch (error) {
      console.error('Error deleting ride:', error);
      showMessage(error.response?.data?.msg || 'Failed to delete ride', 'error');
    }
    handleMenuClose();
  };

  return (
    <>
      <StyledCard>
        <StyledContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <StyledChip
              label={ride.status.toUpperCase()}
              color={ride.status === 'active' ? 'primary' : ride.status === 'completed' ? 'default' : 'error'}
            />
            {isCreator && (
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
            )}
          </div>
          
          <StyledLocationText variant="body2">
            <StyledIcon>
              <LocationOn color="primary" />
            </StyledIcon>
            From: {ride.from.address}
          </StyledLocationText>
          
          <StyledLocationText variant="body2">
            <StyledIcon>
              <LocationOn color="secondary" />
            </StyledIcon>
            To: {ride.to.address}
          </StyledLocationText>
          
          <StyledLocationText variant="body2">
            <StyledIcon>
              <AccessTime />
            </StyledIcon>
            {format(new Date(ride.departureTime), 'PPp')}
          </StyledLocationText>
          
          <StyledLocationText variant="body2">
            <StyledIcon>
              <Person />
            </StyledIcon>
            Created by: {ride.creator?.name || 'Unknown'}
          </StyledLocationText>
          
          <StyledSeatsAvailable variant="body2">
            <StyledIcon>
              <DirectionsBike />
            </StyledIcon>
            {ride.availableSeats - (ride.participants?.length || 0)} seats available
          </StyledSeatsAvailable>

          {ride.participants?.length > 0 && (
            <Button
              size="small"
              color="primary"
              onClick={() => setOpenParticipants(true)}
              style={{ marginTop: '8px' }}
            >
              View Participants ({ride.participants.length})
            </Button>
          )}
        </StyledContent>
        
        {ride.status === 'active' && !isCreator && (
          <StyledActions>
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoinDialogOpen}
              disabled={ride.participants?.length >= ride.availableSeats}
            >
              Join Ride
            </Button>
          </StyledActions>
        )}
      </StyledCard>

      <Dialog open={openJoinDialog} onClose={handleJoinDialogClose}>
        <form onSubmit={handleJoinRide}>
          <DialogTitle>Join Ride</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Your Name"
              type="text"
              fullWidth
              required
              value={joinFormData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="phone"
              label="Phone Number"
              type="tel"
              fullWidth
              required
              value={joinFormData.phone}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleJoinDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Join
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={openParticipants}
        onClose={() => setOpenParticipants(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Ride Participants</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {ride.participants?.length} / {ride.availableSeats} seats taken
            </Typography>
          </div>
        </DialogTitle>
        <DialogContent>
          {ride.participants?.length > 0 ? (
            <List>
              {ride.participants.map((participant, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary={participant.name}
                    secondary={`Phone: ${participant.phone}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="textSecondary" style={{ textAlign: 'center', padding: '16px' }}>
              No participants yet
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenParticipants(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteRide}>
          <Delete fontSize="small" style={{ marginRight: 8 }} /> Delete
        </MenuItem>
      </Menu>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RideCard;
