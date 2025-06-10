import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, Tabs, Tab, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VideoAnalyticsChart = ({ data }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoData, setVideoData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    if (!data) return;
    
    // Convert video data object to array
    const videos = Object.entries(data).map(([id, metrics]) => ({
      id,
      ...metrics
    }));
    
    setVideoData(videos);
    setSelectedVideo(videos[0]?.id || null);
  }, [data]);
  
  const handleVideoChange = (event) => {
    setSelectedVideo(event.target.value);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Get the currently selected video's data
  const getCurrentVideoData = () => {
    if (!selectedVideo || !data) return null;
    return data[selectedVideo];
  };
  
  // Overview metrics comparison chart
  const renderOverviewChart = () => {
    if (!videoData.length) return null;
    
    // Sort videos by views
    const sortedVideos = [...videoData].sort((a, b) => b.totalViews - a.totalViews);
    
    // Prepare data for the chart
    const chartData = {
      labels: sortedVideos.map(v => v.title),
      datasets: [
        {
          label: 'Total Views',
          data: sortedVideos.map(v => v.totalViews),
          backgroundColor: '#1DB954',
          borderColor: '#158c3f',
          borderWidth: 1,
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Bar data={chartData} options={options} />
      </Box>
    );
  };
  
  // Engagement timeline chart for a specific video
  const renderEngagementTimeline = () => {
    const videoData = getCurrentVideoData();
    if (!videoData || !videoData.engagementPeaks?.length) return null;
    
    // Sort by time point
    const sortedPeaks = [...videoData.engagementPeaks].sort((a, b) => {
      return a.timePoint.localeCompare(b.timePoint);
    });
    
    // Prepare data for the chart
    const chartData = {
      labels: sortedPeaks.map(p => p.timePoint),
      datasets: [
        {
          label: 'Engagement Score',
          data: sortedPeaks.map(p => p.engagement),
          backgroundColor: 'rgba(107, 127, 255, 0.2)',
          borderColor: '#6b7fff',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    };
    
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
              return `Engagement: ${(context.parsed.y * 100).toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            callback: (value) => `${(value * 100).toFixed(0)}%`
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </Box>
    );
  };
  
  // Drop-off points chart
  const renderDropOffChart = () => {
    const videoData = getCurrentVideoData();
    if (!videoData || !videoData.dropOffPoints?.length) return null;
    
    // Sort by time point
    const sortedDropOffs = [...videoData.dropOffPoints].sort((a, b) => {
      return a.timePoint.localeCompare(b.timePoint);
    });
    
    // Prepare data for the chart
    const chartData = {
      labels: sortedDropOffs.map(p => p.timePoint),
      datasets: [
        {
          label: 'Drop-off Rate',
          data: sortedDropOffs.map(p => p.dropRate),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          tension: 0.1
        }
      ]
    };
    
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
              return `Drop-off: ${(context.parsed.y * 100).toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 0.5,
          ticks: {
            callback: (value) => `${(value * 100).toFixed(0)}%`
          }
        }
      }
    };
    
    return (
      <Box sx={{ height: 400 }}>
        <Line data={chartData} options={options} />
      </Box>
    );
  };
  
  // Render video metrics cards
  const renderVideoMetrics = () => {
    const videoData = getCurrentVideoData();
    if (!videoData) return null;
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="primary">
              {videoData.totalViews.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Views
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="primary">
              {videoData.uniqueViewers.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unique Viewers
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="primary">
              {(videoData.completionRate * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="primary">
              {Math.floor(videoData.avgWatchTime / 60)}m {videoData.avgWatchTime % 60}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg. Watch Time
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  if (!videoData.length) {
    return <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</Box>;
  }
  
  return (
    <Box>
      {/* Top section with video selection and metrics */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel id="video-select-label">Select Video</InputLabel>
          <Select
            labelId="video-select-label"
            id="video-select"
            value={selectedVideo || ''}
            label="Select Video"
            onChange={handleVideoChange}
          >
            {videoData.map(video => (
              <MenuItem key={video.id} value={video.id}>
                {video.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedVideo && renderVideoMetrics()}
      </Box>
      
      {/* Tabs for different charts */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="video analytics tabs">
            <Tab label="Overview" />
            <Tab label="Engagement Timeline" />
            <Tab label="Drop-off Points" />
          </Tabs>
        </Box>
        
        <Box sx={{ pt: 3 }}>
          {activeTab === 0 && renderOverviewChart()}
          {activeTab === 1 && renderEngagementTimeline()}
          {activeTab === 2 && renderDropOffChart()}
        </Box>
      </Box>
    </Box>
  );
};

export default VideoAnalyticsChart; 