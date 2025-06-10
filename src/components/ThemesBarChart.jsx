import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton, 
         FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getAllLeaders } from '../services/leaderService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ThemesBarChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [themeData, setThemeData] = useState({ official: [], custom: [] });
  const [displayMode, setDisplayMode] = useState('official'); // 'official' or 'custom'
  const [sortOrder, setSortOrder] = useState('frequency'); // 'frequency', 'alphabetical', 'alphabetical-reverse'
  const [limit, setLimit] = useState(20); // Limit number of themes to display
  
  useEffect(() => {
    const fetchThemeData = async () => {
      try {
        setLoading(true);
        const leaders = await getAllLeaders();
        
        // Count theme frequencies across all default analysis versions
        const officialThemes = {};
        const customThemes = {};
        
        leaders.forEach(leader => {
          // Find the default analysis version
          const defaultVersion = leader.analysisVersions?.find(
            version => version.versionId === leader.latestAnalysisVersion
          );
          
          if (!defaultVersion) return;
          
          // Process chapter markers
          defaultVersion.chapterMarkers?.forEach(marker => {
            // Process official themes
            marker.themes?.forEach(theme => {
              officialThemes[theme] = (officialThemes[theme] || 0) + 1;
            });
            
            // Process custom themes
            marker.customThemes?.forEach(theme => {
              customThemes[theme] = (customThemes[theme] || 0) + 1;
            });
          });
          
          // Process noise segment if it exists separately
          if (defaultVersion.noiseSegment) {
            defaultVersion.noiseSegment.themes?.forEach(theme => {
              officialThemes[theme] = (officialThemes[theme] || 0) + 1;
            });
            
            defaultVersion.noiseSegment.customThemes?.forEach(theme => {
              customThemes[theme] = (customThemes[theme] || 0) + 1;
            });
          }
        });
        
        // Convert to array format for charting
        const officialThemesArray = Object.entries(officialThemes).map(([name, value]) => ({
          name,
          value,
          type: 'official'
        }));
        
        const customThemesArray = Object.entries(customThemes).map(([name, value]) => ({
          name,
          value,
          type: 'custom'
        }));
        
        setThemeData({
          official: officialThemesArray,
          custom: customThemesArray
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching theme data:', err);
        setError('Failed to load theme data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchThemeData();
  }, []);
  
  const handleDisplayModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
    }
  };
  
  const handleSortOrderChange = (event) => {
    setSortOrder(event.target.value);
  };
  
  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };
  
  const getChartData = () => {
    if (loading || error) return null;
    
    // Select data based on display mode
    let data = displayMode === 'official' ? themeData.official : themeData.custom;
    
    // Sort data based on selected sort order
    switch (sortOrder) {
      case 'frequency':
        data = [...data].sort((a, b) => b.value - a.value);
        break;
      case 'alphabetical':
        data = [...data].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'alphabetical-reverse':
        data = [...data].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'frequency-asc':
        data = [...data].sort((a, b) => a.value - b.value);
        break;
      default:
        data = [...data].sort((a, b) => b.value - a.value);
    }
    
    // Limit data
    data = data.slice(0, limit);
    
    // Generate colors based on theme type
    const baseColor = displayMode === 'official' ? '#1DB954' : '#6b7fff';
    const hoverColor = displayMode === 'official' ? '#158c3f' : '#4e5dc7';
    
    return {
      labels: data.map(item => item.name),
      datasets: [
        {
          label: 'Theme Frequency',
          data: data.map(item => item.value),
          backgroundColor: baseColor,
          hoverBackgroundColor: hoverColor,
          borderColor: hoverColor,
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Calculate chart height based on the number of themes
  const calculateChartHeight = (chartData) => {
    if (!chartData || !chartData.labels) return 400;
    
    // Height per bar (increased from 25 to 30 for better spacing)
    const heightPerBar = 30;
    
    // Base height plus height for each bar
    const calculatedHeight = chartData.labels.length * heightPerBar + 100;
    
    // Return calculated height or minimum height if there are few themes
    return Math.max(calculatedHeight, 300);
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',  // Horizontal bar chart
    plugins: {
      legend: {
        position: 'top',
        display: false, // Hide legend since we only have one dataset
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return `Frequency: ${value} section${value !== 1 ? 's' : ''}`;
          }
        }
      },
      title: {
        display: true,
        text: `${displayMode === 'official' ? 'Roadtrip Nation' : 'AI-identified'} Theme Frequencies`,
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          },
          // Ensure all labels are displayed
          autoSkip: false,
          // Limit label length to prevent overlap
          callback: function(value, index, values) {
            const label = this.getLabelForValue(value);
            // If label is too long, truncate it with ellipsis
            if (label.length > 30) {
              return label.substr(0, 27) + '...';
            }
            return label;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Frequency (# of sections)',
          font: {
            size: 12
          }
        },
        beginAtZero: true
      }
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }
  
  const hasOfficialThemes = themeData.official.length > 0;
  const hasCustomThemes = themeData.custom.length > 0;
  const chartData = getChartData();
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <ToggleButtonGroup
          value={displayMode}
          exclusive
          onChange={handleDisplayModeChange}
          aria-label="theme display mode"
          color="primary"
          size="small"
        >
          <ToggleButton 
            value="official" 
            disabled={!hasOfficialThemes}
            sx={{ 
              '&.Mui-selected': { 
                backgroundColor: '#1DB954',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#158c3f',
                }
              }
            }}
          >
            Roadtrip Nation Themes ({themeData.official.length})
          </ToggleButton>
          <ToggleButton 
            value="custom" 
            disabled={!hasCustomThemes}
            sx={{ 
              '&.Mui-selected': { 
                backgroundColor: '#6b7fff',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#4e5dc7',
                }
              }
            }}
          >
            AI-identified Themes ({themeData.custom.length})
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-select-label">Sort Order</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={sortOrder}
              label="Sort Order"
              onChange={handleSortOrderChange}
            >
              <MenuItem value="frequency">Most Frequent</MenuItem>
              <MenuItem value="frequency-asc">Least Frequent</MenuItem>
              <MenuItem value="alphabetical">A to Z</MenuItem>
              <MenuItem value="alphabetical-reverse">Z to A</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="limit-select-label">Show</InputLabel>
            <Select
              labelId="limit-select-label"
              id="limit-select"
              value={limit}
              label="Show"
              onChange={handleLimitChange}
            >
              <MenuItem value={10}>Top 10</MenuItem>
              <MenuItem value={20}>Top 20</MenuItem>
              <MenuItem value={50}>Top 50</MenuItem>
              <MenuItem value={100}>Top 100</MenuItem>
              <MenuItem value={1000}>All</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Create a scrollable container for the chart with fixed height */}
      <Box sx={{ 
        height: "600px", 
        overflowY: "auto", 
        overflowX: "hidden",
        pr: 2 // Add padding on the right to account for scrollbar
      }}>
        <Box sx={{ 
          height: calculateChartHeight(chartData),
          minHeight: "100%"
        }}>
          {((displayMode === 'official' && !hasOfficialThemes) || 
            (displayMode === 'custom' && !hasCustomThemes)) ? (
            <Typography variant="body1" sx={{ p: 5, color: 'text.secondary', textAlign: 'center' }}>
              No {displayMode === 'official' ? 'Roadtrip Nation' : 'AI-identified'} themes available
            </Typography>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </Box>
      </Box>
      
      {limit === 1000 && chartData && chartData.labels && chartData.labels.length > 50 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Showing all {chartData.labels.length} themes. Scroll to see more.
        </Typography>
      )}
    </Box>
  );
};

export default ThemesBarChart; 