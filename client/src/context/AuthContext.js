import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDetails = async (userId) => {
    try {
      console.log('Fetching user details for userId:', userId);
      const res = await axios.get(`/api/users/${userId}`);
      console.log('User details fetched:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching user details', err);
      return null;
    }
  };

  const setAuthToken = token => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
    }
  };

  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token && validateToken(token)) {
        try {
          // Set token in axios headers
          setAuthToken(token);

          // Decode token to get user ID
          const decoded = jwtDecode(token);
          
          // Fetch user details
          const userDetails = await fetchUserDetails(decoded.user.id);
          
          if (userDetails) {
            setUser(userDetails);
          } else {
            // If user details fetch fails, logout
            logout();
          }
        } catch (err) {
          console.error('Authentication initialization error:', err);
          logout();
        }
      } else {
        // Invalid or expired token
        logout();
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      const { token } = res.data;
      
      // Decode and validate token
      if (validateToken(token)) {
        setAuthToken(token);
        const decoded = jwtDecode(token);
        const userDetails = await fetchUserDetails(decoded.user.id);
        
        if (userDetails) {
          setUser(userDetails);
          setError(null);
          return true;
        }
      }
      
      throw new Error('Invalid token');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      logout();
      return false;
    }
  };

  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      const { token } = res.data;
      
      // Decode and validate token
      if (validateToken(token)) {
        setAuthToken(token);
        const decoded = jwtDecode(token);
        const userDetails = await fetchUserDetails(decoded.user.id);
        
        if (userDetails) {
          setUser(userDetails);
          setError(null);
          return true;
        }
      }
      
      throw new Error('Invalid token');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      logout();
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        register, 
        login, 
        logout, 
        clearError 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
