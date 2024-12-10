import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, IconButton, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../context/AuthContext';
import NotificationIcon from '../notifications/NotificationIcon';

const Navbar = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
  };

  const getProfilePictureUrl = () => {
    return user?.profilePicture 
      ? `http://localhost:3000/uploads/profile-pictures/${user.profilePicture}`
      : null;
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        color: theme.palette.text.primary
      }}
      elevation={0}
    >
      <Container maxWidth="lg">
        <Toolbar 
          sx={{ 
            justifyContent: 'space-between', 
            py: 1,
            minHeight: 64
          }}
        >
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit',
              transition: 'opacity 0.25s ease',
              '&:hover': { 
                opacity: 0.8 
              }
            }}
          >
            <DirectionsBikeIcon 
              sx={{ 
                fontSize: '1.8rem', 
                color: theme.palette.primary.main, 
                mr: 1 
              }} 
            />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                letterSpacing: '-0.5px',
                color: theme.palette.text.primary
              }}
            >
              MLRIT Bike Pooling
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user ? (
              <>
                {['Create Ride', 'Search Rides', 'Ride Requests', 'My Rides'].map((label, index) => {
                  const routes = ['/create-ride', '/search-rides', '/requests', '/my-rides'];
                  const icons = [
                    <AddCircleOutlineIcon />, 
                    <SearchIcon />, 
                    <ListAltIcon />, 
                    <PersonIcon />
                  ];

                  return (
                    <Button
                      key={label}
                      component={RouterLink}
                      to={routes[index]}
                      startIcon={icons[index]}
                      variant="text"
                      color="primary"
                      sx={{ 
                        mr: 1,
                        fontWeight: 500,
                        '& .MuiButton-startIcon': { 
                          marginRight: 0.5 
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(74, 108, 247, 0.05)'
                        }
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}

                <NotificationIcon />

                <IconButton 
                  component={RouterLink} 
                  to="/profile" 
                  sx={{ 
                    padding: 0, 
                    ml: 1,
                    transition: 'transform 0.25s ease',
                    '&:hover': { 
                      transform: 'scale(1.05)'
                    } 
                  }}
                >
                  <Avatar 
                    src={getProfilePictureUrl()} 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      border: `2px solid ${theme.palette.primary.light}`,
                      boxShadow: '0 2px 6px rgba(74, 108, 247, 0.15)' 
                    }}
                  >
                    {!getProfilePictureUrl() && user?.name?.[0]}
                  </Avatar>
                </IconButton>

                <Button
                  onClick={handleLogout}
                  startIcon={<ExitToAppIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{
                    ml: 1,
                    borderRadius: 10,
                    '&:hover': {
                      backgroundColor: 'rgba(74, 108, 247, 0.05)'
                    }
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<ExitToAppIcon />}
                  variant="contained"
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  startIcon={<PersonIcon />}
                  variant="contained"
                  color="secondary"
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
