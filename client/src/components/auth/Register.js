import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
  MenuItem,
  useTheme
} from '@mui/material';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { useAuth } from '../../context/AuthContext';

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering'
];

const Register = () => {
  const navigate = useNavigate();
  const { register, error, clearError, user } = useAuth();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    college: 'MLRIT',
    department: ''
  });
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    if (error) {
      setShowError(true);
    }
  }, [user, error, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setShowError(true);
      return;
    }

    try {
      await register(formData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
    clearError();
  };

  return (
    <Container maxWidth="xs">
      <Paper 
        elevation={0} 
        sx={{
          marginTop: theme.spacing(4),
          padding: theme.spacing(4),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 3,
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3 
          }}
        >
          <DirectionsBikeIcon 
            sx={{ 
              fontSize: '2.5rem', 
              color: theme.palette.primary.main, 
              mr: 2 
            }} 
          />
          <Typography 
            component="h1" 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary 
            }}
          >
            Create Account
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2 
              } 
            }}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="MLRIT Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2 
              } 
            }}
            helperText="Use your @mlrit.ac.in email"
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2 
              } 
            }}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            select
            id="department"
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2 
              } 
            }}
          >
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2 
              } 
            }}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2 
              } 
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Sign Up
          </Button>
        </form>

        <Typography 
          variant="body2" 
          sx={{ 
            mt: 2, 
            color: theme.palette.text.secondary 
          }}
        >
          Already have an account? 
          <Button 
            color="primary" 
            onClick={() => navigate('/login')}
            sx={{ 
              textTransform: 'none', 
              ml: 1 
            }}
          >
            Sign In
          </Button>
        </Typography>
      </Paper>

      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error || 'Passwords do not match'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Register;
