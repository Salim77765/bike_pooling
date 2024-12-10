import React from 'react';
import { Container, Box } from '@mui/material';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(45deg, #1A237E 30%, #4D52B3 90%)'
        }}
      >
        <img 
          src="/logo.png" 
          alt="Loading" 
          style={{ 
            maxWidth: '200px', 
            animation: 'pulse 1.5s infinite' 
          }} 
        />
      </Box>
    );
  }

  return (
    <Box 
      sx={{
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: '#F5F5F5'
      }}
    >
      <Navbar />
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1, 
          py: 4,
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        {/* Routes will be rendered here */}
      </Container>
    </Box>
  );
};

export default Layout;
