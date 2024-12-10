import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Container, styled } from '@mui/material';
import axios from 'axios';

const LoadingContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
}));

const PrivateRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    // Intercept 401 (Unauthorized) responses
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token is invalid or expired
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress color="primary" />
      </LoadingContainer>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
