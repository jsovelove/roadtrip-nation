import { useState, useEffect } from 'react';
import { Box, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ThemeEngagementChart = ({ data, limit = 10, showAll = false }) => {
  const [metric, setMetric] = useState('viewCount');
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (!data) return;
    
    // Process data for chart
    const processData = () => {
      // Convert object to array for sorting
      const themeArray = Object.entries(data).map(([name, metrics]) => ({
        name,
        ...metrics
      }));
      
      // Sort by the selected metric
      themeArray.sort((a, b) => b[metric] - a[metric]);
      
      // Limit if needed
      const limitedData = showAll ? themeArray : themeArray.slice(0, limit);
      
      // Prepare data for chart
      return {
        labels: limitedData.map(item => item.name),
        datasets: [
          {
            label: getMetricLabel(metric),
            data: limitedData.map(item => item[metric]),
            backgroundColor: '#1DB954',
            borderColor: '#158c3f',
            borderWidth: 1,
          }
        ]
      };
    };
    
    setChartData(processData());
  }, [data, metric, limit, showAll]);
  
  // Get a human-readable label for the metric
  const getMetricLabel = (metricKey) => {
    const labels = {
      viewCount: 'View Count',
      avgTimeSpent: 'Average Time Spent (seconds)',
      completionRate: 'Completion Rate',
      userCount: 'User Count',
      bookmarkCount: 'Bookmark Count'
    };
    
    return labels[metricKey] || metricKey;
  };
  
  const handleMetricChange = (event) => {
    setMetric(event.target.value);
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            
            if (metric === 'completionRate') {
              return label + (context.parsed.y * 100).toFixed(1) + '%';
            } else if (metric === 'avgTimeSpent') {
              const minutes = Math.floor(context.parsed.y / 60);
              const seconds = context.parsed.y % 60;
              return label + `${minutes}m ${seconds}s`;
            }
            
            return label + context.parsed.y;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            if (metric === 'completionRate') {
              return (value * 100).toFixed(0) + '%';
            } else if (metric === 'avgTimeSpent') {
              const minutes = Math.floor(value / 60);
              if (minutes > 0) {
                return minutes + 'm';
              }
              return value + 's';
            }
            return value;
          }
        }
      }
    }
  };
  
  if (!chartData) {
    return <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</Box>;
  }
  
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="metric-select-label">Metric</InputLabel>
          <Select
            labelId="metric-select-label"
            id="metric-select"
            value={metric}
            label="Metric"
            onChange={handleMetricChange}
          >
            <MenuItem value="viewCount">View Count</MenuItem>
            <MenuItem value="avgTimeSpent">Average Time Spent</MenuItem>
            <MenuItem value="completionRate">Completion Rate</MenuItem>
            <MenuItem value="userCount">User Count</MenuItem>
            <MenuItem value="bookmarkCount">Bookmark Count</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ height: 300 }}>
        <Bar data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default ThemeEngagementChart; 