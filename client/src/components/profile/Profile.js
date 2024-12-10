import React, { useState, useRef } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Box, 
  Paper, 
  IconButton 
} from '@mui/material';
import { Edit, Save, PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
  });
  const fileInputRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture 
      ? `http://localhost:3000/uploads/profile-pictures/${user.profilePicture}` 
      : null
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);

      try {
        const response = await axios.post('/api/users/upload-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setProfilePicture(`http://localhost:3000/uploads/profile-pictures/${response.data.profilePicture}`);
        updateUser({ profilePicture: response.data.profilePicture });
      } catch (error) {
        console.error('Error uploading profile picture', error);
      }
    }
  };

  const handleSave = async () => {
    // Validate input before sending
    const validationErrors = [];
    
    if (!profileData.name || profileData.name.trim() === '') {
      validationErrors.push('Name is required');
    }

    if (!profileData.phone || !/^\d{10}$/.test(profileData.phone)) {
      validationErrors.push('Invalid phone number (10 digits required)');
    }

    if (validationErrors.length > 0) {
      // Show validation errors
      alert(validationErrors.join('\n'));
      return;
    }

    try {
      // Log the data being sent
      console.log('Sending profile update:', profileData);

      const response = await axios.put('/api/users/profile', profileData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Log the response
      console.log('Profile update response:', response.data);

      // Update user context
      updateUser(response.data);
      
      // Show success message
      alert('Profile updated successfully!');
      
      // Exit editing mode
      setIsEditing(false);
    } catch (error) {
      // Comprehensive error handling
      console.error('Error updating profile', error);

      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        alert(`Update failed: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        alert('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request
        alert('Error: ' + error.message);
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Avatar
            src={profilePicture}
            sx={{ width: 120, height: 120, mb: 2 }}
          >
            {!profilePicture && (user?.name?.[0] || user?.email?.[0])}
          </Avatar>
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="label"
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <input
              hidden
              accept="image/*"
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
            />
            <PhotoCamera />
          </IconButton>
        </Box>

        <Typography variant="h5" gutterBottom>
          User Profile
        </Typography>

        <Box sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={profileData.name}
            onChange={handleInputChange}
            disabled={!isEditing}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={profileData.email}
            onChange={handleInputChange}
            disabled
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={profileData.phone}
            onChange={handleInputChange}
            disabled={!isEditing}
            margin="normal"
          />
          <TextField
            fullWidth
            label="College"
            name="college"
            value={profileData.college}
            onChange={handleInputChange}
            disabled={!isEditing}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Department"
            name="department"
            value={profileData.department}
            onChange={handleInputChange}
            disabled={!isEditing}
            margin="normal"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            {!isEditing ? (
              <Button 
                variant="contained" 
                startIcon={<Edit />} 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Save />} 
                onClick={handleSave}
              >
                Save Changes
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
