import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Alert, 
  IconButton, 
  InputAdornment 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear previous errors when user starts typing
    if (loginError) setLoginError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!formData.email || !formData.password) {
      setLoginError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setLoginError(null);

    try {
      const success = await login(formData);
      
      if (success) {
        navigate('/dashboard');
      } else {
        // This will trigger the error from AuthContext
        setLoginError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      setLoginError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>

        {loginError && (
          <Alert 
            severity="error" 
            sx={{ width: '100%', mb: 2 }}
          >
            {loginError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            error={!!loginError}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!loginError}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </Button>

          <Typography variant="body2" align="center">
            Don't have an account? 
            <Button 
              color="primary" 
              onClick={() => navigate('/register')}
              sx={{ textTransform: 'none' }}
            >
              Register
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
