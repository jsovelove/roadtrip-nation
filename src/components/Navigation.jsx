import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Container 
} from '@mui/material';
import { 
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Leaders', icon: <PersonIcon /> },
    { path: '/add-leader', label: 'Add Leader', icon: <PersonAddIcon /> },
    { path: '/topic-analysis', label: 'Topic Analysis', icon: <AnalyticsIcon /> }
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    window.location.reload(); // Reload to show password screen
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              fontWeight: 700 
            }}
          >
            Roadtrip Nation
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                color="inherit"
                startIcon={item.icon}
                variant={location.pathname === item.path ? 'outlined' : 'text'}
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  backgroundColor: location.pathname === item.path ? 'white' : 'transparent',
                  '&:hover': {
                    backgroundColor: location.pathname === item.path ? 'grey.100' : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
            
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                ml: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 