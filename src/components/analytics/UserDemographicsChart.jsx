import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Color palettes for different demographic types
const COLORS = {
  age: ['#FF9F40', '#FFCD56', '#4BC0C0', '#36A2EB', '#9966FF'],
  gender: ['#36A2EB', '#FF6384', '#4BC0C0'],
  region: ['#1DB954', '#FF6384', '#FFCD56', '#36A2EB', '#9966FF', '#FF9F40'],
  device: ['#36A2EB', '#FF6384', '#4BC0C0']
};

const UserDemographicsChart = ({ data, type = 'age' }) => {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (!data) return;
    
    const processData = () => {
      let items = [];
      let colors = [];
      
      // Select data based on type
      switch (type) {
        case 'age':
          items = data.ageGroups || [];
          colors = COLORS.age;
          break;
        case 'gender':
          items = data.genders || [];
          colors = COLORS.gender;
          break;
        case 'region':
          items = data.regions || [];
          colors = COLORS.region;
          break;
        case 'device':
          items = data.devices || [];
          colors = COLORS.device;
          break;
        default:
          items = data.ageGroups || [];
          colors = COLORS.age;
      }
      
      return {
        labels: items.map(item => getItemLabel(item, type)),
        datasets: [
          {
            data: items.map(item => getItemValue(item)),
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace(')', ', 1)')),
            borderWidth: 1,
          },
        ],
      };
    };
    
    setChartData(processData());
  }, [data, type]);
  
  // Get label based on type
  const getItemLabel = (item, type) => {
    switch (type) {
      case 'age':
        return item.group;
      case 'gender':
        return item.gender;
      case 'region':
        return item.region;
      case 'device':
        return item.device;
      default:
        return '';
    }
  };
  
  // Get percentage value
  const getItemValue = (item) => {
    return item.percentage * 100;
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    }
  };
  
  if (!chartData) {
    return <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</Box>;
  }
  
  return (
    <Box sx={{ height: 300, position: 'relative' }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
};

export default UserDemographicsChart; 