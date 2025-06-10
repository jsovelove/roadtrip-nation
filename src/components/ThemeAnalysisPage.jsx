import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import ThemesBarChart from './ThemesBarChart';
import ThemeCorrelationNetwork from './ThemeCorrelationNetwork';

// TabPanel component for tab content
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`theme-tabpanel-${index}`}
      aria-labelledby={`theme-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ThemeAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Theme Analysis & Correlations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore theme frequencies and relationships across interviews. Switch between views to analyze themes in different ways.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { py: 2 } 
          }}
        >
          <Tab 
            icon={<BarChartIcon />} 
            label="Theme Frequency" 
            iconPosition="start"
            sx={{ 
              fontWeight: 600,
              '&.Mui-selected': { color: '#1DB954' }
            }}
          />
          <Tab 
            icon={<BubbleChartIcon />} 
            label="Theme Correlations" 
            iconPosition="start"
            sx={{ 
              fontWeight: 600,
              '&.Mui-selected': { color: '#6b7fff' }
            }}
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ThemesBarChart />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <ThemeCorrelationNetwork />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ThemeAnalysisPage; 