import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A6CF7',     // Soft blue
      light: '#7A9BFF',
      dark: '#3A5AD7'
    },
    secondary: {
      main: '#6C5CE7',     // Soft purple
      light: '#8E7BFF',
      dark: '#5C4AD7'
    },
    background: {
      default: '#F9FAFB',  // Ultra light gray
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2C3E50',  // Dark slate
      secondary: '#7F8C8D'  // Soft gray
    },
    error: {
      main: '#E74C3C'
    }
  },
  typography: {
    fontFamily: [
      'Inter', 
      'Roboto', 
      'Helvetica', 
      'Arial', 
      'sans-serif'
    ].join(','),
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '2.2rem',
      fontWeight: 600,
      color: '#2C3E50',
      letterSpacing: '-0.5px'
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 500,
      color: '#2C3E50',
      letterSpacing: '-0.3px'
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      fontWeight: 400
    }
  },
  shape: {
    borderRadius: 12  // Soft, rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.25s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 10px rgba(76, 108, 247, 0.15)'
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4A6CF7 0%, #7A9BFF 100%)',
          color: 'white'
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #6C5CE7 0%, #8E7BFF 100%)',
          color: 'white'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          padding: '24px',
          transition: 'all 0.3s ease'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.25s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4A6CF7'
            }
          }
        }
      }
    }
  },
  transitions: {
    easing: {
      // Smooth, light easing
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    duration: {
      shorter: 150,
      short: 250,
      standard: 300
    }
  }
});

export default theme;
