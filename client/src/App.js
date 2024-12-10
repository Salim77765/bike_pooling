import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/routing/PrivateRoute';

// Components
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import CreateRide from './components/rides/CreateRide';
import SearchRides from './components/rides/SearchRides';
import RideRequests from './components/rides/RideRequests';
import MyRides from './components/rides/MyRides';
import Profile from './components/profile/Profile';
import EditRide from './components/rides/EditRide';
import RideDetails from './components/rides/RideDetails';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-ride"
                element={
                  <PrivateRoute>
                    <CreateRide />
                  </PrivateRoute>
                }
              />
              <Route
                path="/search-rides"
                element={
                  <PrivateRoute>
                    <SearchRides />
                  </PrivateRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <PrivateRoute>
                    <RideRequests />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-rides"
                element={
                  <PrivateRoute>
                    <MyRides />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/edit-ride/:id"
                element={
                  <PrivateRoute>
                    <EditRide />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ride-details/:rideId"
                element={
                  <PrivateRoute>
                    <RideDetails />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
