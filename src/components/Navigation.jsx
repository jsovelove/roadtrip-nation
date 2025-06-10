import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Navigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography 
              variant="h5" 
              component={RouterLink} 
              to="/" 
              sx={{ 
                fontWeight: 700, 
                textDecoration: 'none', 
                color: 'inherit',
                letterSpacing: '-0.5px'
              }}
            >
              Roadtrip Nation
            </Typography>
          </Box>
          
          {isMobile ? (
            <IconButton color="inherit" edge="end">
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/"
                sx={{ 
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Leaders
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/themes"
                startIcon={<BarChartIcon />}
                sx={{ 
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Themes
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/topic-analysis"
                startIcon={<PieChartIcon />}
                sx={{ 
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Topic Analysis
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/analytics"
                startIcon={<AssessmentIcon />}
                sx={{ 
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Analytics
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 