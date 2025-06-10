import { useState, useEffect } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  Legend,
  Filler
);

const EngagementOverTimeChart = ({ data }) => {
  const [metric, setMetric] = useState('viewCounts');
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (!data) return;
    
    // Process data for chart
    const processData = () => {
      let values = [];
      let label = '';
      let color = '';
      
      switch (metric) {
        case 'viewCounts':
          values = data.viewCounts;
          label = 'Daily Views';
          color = '#1DB954'; // green
          break;
        case 'uniqueUsers':
          values = data.uniqueUsers;
          label = 'Unique Users';
          color = '#6b7fff'; // blue
          break;
        case 'interactionRates':
          values = data.interactionRates.map(rate => rate * 100); // Convert to percentage
          label = 'Interaction Rate (%)';
          color = '#ff6384'; // pink
          break;
        default:
          values = data.viewCounts;
          label = 'Daily Views';
          color = '#1DB954';
      }
      
      return {
        labels: data.dates,
        datasets: [
          {
            label,
            data: values,
            borderColor: color,
            backgroundColor: `${color}20`, // Add transparency
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6
          }
        ]
      };
    };
    
    setChartData(processData());
  }, [data, metric]);
  
  const handleMetricChange = (event, newMetric) => {
    if (newMetric !== null) {
      setMetric(newMetric);
    }
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
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            
            if (metric === 'interactionRates') {
              return label + context.parsed.y.toFixed(1) + '%';
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
            if (metric === 'interactionRates') {
              return value + '%';
            }
            return value;
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  if (!chartData) {
    return <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</Box>;
  }
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={metric}
          exclusive
          onChange={handleMetricChange}
          aria-label="engagement metric"
          size="small"
        >
          <ToggleButton value="viewCounts" aria-label="daily views">
            Daily Views
          </ToggleButton>
          <ToggleButton value="uniqueUsers" aria-label="unique users">
            Unique Users
          </ToggleButton>
          <ToggleButton value="interactionRates" aria-label="interaction rates">
            Interaction Rate
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ height: 300 }}>
        <Line data={chartData} options={options} />
      </Box>
    </Box>
  );
};

export default EngagementOverTimeChart; 