import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationItemClick = async (notification) => {
    // Comprehensive logging of notification object
    console.log('Full Notification Object:', JSON.stringify(notification, null, 2));
    
    // Mark notification as read
    await markNotificationAsRead(notification._id);
    
    // Close notification menu
    handleNotificationClose();

    // Extract potential ride-related information
    const rideId = 
      notification.rideId || 
      notification.ride?._id || 
      notification.ride || 
      notification.data?.rideId;

    // Log extracted ride ID
    console.log('Extracted Ride ID:', rideId);

    // Navigate based on notification type
    switch(notification.type) {
      case 'RIDE_ACCEPT':
      case 'RIDE_REQUEST':
      case 'RIDE_CONFIRMATION':
        // Comprehensive fallback for ride navigation
        if (!rideId) {
          console.error('No ride ID found in notification:', {
            notificationType: notification.type,
            notificationData: notification
          });
          
          // User-friendly error handling
          alert('Cannot view ride details. Ride information is missing.');
          return;
        }
        
        // Navigate to specific ride details
        navigate(`/ride-details/${rideId}`);
        break;
      default:
        console.log('Unhandled notification type:', notification.type);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleNotificationClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 300,
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification._id} 
              onClick={() => handleNotificationItemClick(notification)}
              style={{ 
                backgroundColor: !notification.read ? '#f0f0f0' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={!notification.read ? 'bold' : 'normal'}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationIcon;
