import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import LeadersList from './components/LeadersList';
import LeaderDetail from './components/LeaderDetail';
import AddLeader from './components/AddLeader';
import ThemeAnalysisPage from './components/ThemeAnalysisPage';
import TopicAnalysis from './components/TopicAnalysis';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PasswordProtection from './components/PasswordProtection';
import { Box } from '@mui/material';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1DB954', // Roadtrip Nation green
      light: '#4eca74',
      dark: '#158c3f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6b7fff', // Modern blue accent
      light: '#93a0ff',
      dark: '#4e5dc7',
    },
    background: {
      default: '#f9f9fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#2a2a2a',
      secondary: '#6e6e6e',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '8px 16px',
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated (from sessionStorage)
    const authStatus = sessionStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PasswordProtection onAuthenticated={setIsAuthenticated} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/roadtrip-nation">
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<LeadersList />} />
              <Route path="/leaders/:id" element={<LeaderDetail />} />
              <Route path="/add-leader" element={<AddLeader />} />
              <Route path="/themes" element={<ThemeAnalysisPage />} />
              <Route path="/topic-analysis" element={<TopicAnalysis />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
