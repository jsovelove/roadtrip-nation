import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Color palette for lines
const COLORS = [
  '#1DB954', // green
  '#6b7fff', // blue
  '#ff6384', // pink
  '#ffcd56', // yellow
  '#36a2eb', // light blue
  '#ff9f40', // orange
  '#9966ff', // purple
  '#c9cbcf', // grey
  '#4bc0c0', // teal
  '#ff8a80', // light red
  '#81c784', // light green
  '#7986cb'  // indigo
];

const TrendingTopicsChart = ({ data, showAll = false, height = 400 }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [chartData, setChartData] = useState(null);
  
  // Initialize with data
  useEffect(() => {
    if (!data || !data.topics) return;
    
    // If showAll is true, select all topics initially
    // Otherwise, just select the top 5 trending topics by latest value
    if (showAll) {
      setSelectedTopics(Object.keys(data.topics));
    } else {
      // Find the top 5 trending topics based on the latest data point
      const topicEntries = Object.entries(data.topics);
      
      // Sort by the last value in each topic's data array (latest trend value)
      topicEntries.sort((a, b) => {
        const aLastValue = a[1][a[1].length - 1];
        const bLastValue = b[1][b[1].length - 1];
        return bLastValue - aLastValue;
      });
      
      // Select top 5
      const topTopics = topicEntries.slice(0, 5).map(entry => entry[0]);
      setSelectedTopics(topTopics);
    }
  }, [data, showAll]);
  
  // Update chart data when selections change
  useEffect(() => {
    if (!data || !data.topics || !selectedTopics.length) return;
    
    // Prepare data for chart
    const datasets = selectedTopics.map((topic, index) => ({
      label: topic,
      data: data.topics[topic],
      borderColor: COLORS[index % COLORS.length],
      backgroundColor: COLORS[index % COLORS.length] + '20', // Add transparency
      borderWidth: 2,
      tension: 0.4,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5
    }));
    
    setChartData({
      labels: data.dates,
      datasets
    });
  }, [data, selectedTopics]);
  
  const handleTopicChange = (event) => {
    const value = event.target.value;
    setSelectedTopics(value);
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
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Engagement Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  if (!data || !data.topics) {
    return <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</Box>;
  }
  
  // Get all available topics
  const allTopics = Object.keys(data.topics);
  
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ width: 300 }}>
          <InputLabel id="topics-select-label">Topics</InputLabel>
          <Select
            labelId="topics-select-label"
            id="topics-select"
            multiple
            value={selectedTopics}
            onChange={handleTopicChange}
            renderValue={(selected) => {
              if (selected.length > 2) {
                return `${selected.length} topics selected`;
              }
              return selected.join(', ');
            }}
            label="Topics"
          >
            {allTopics.map((topic) => (
              <MenuItem key={topic} value={topic}>
                <Checkbox checked={selectedTopics.indexOf(topic) > -1} />
                <ListItemText primary={topic} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedTopics.length === 0 && (
          <Typography color="error" sx={{ mt: 1 }}>
            Please select at least one topic to display
          </Typography>
        )}
      </Box>
      
      <Box sx={{ height }}>
        {chartData && selectedTopics.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>Select topics to display trend data</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TrendingTopicsChart; 