import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab, CircularProgress, Container } from '@mui/material';
import { getAllAnalytics } from '../services/analyticsService';
import ThemeEngagementChart from './analytics/ThemeEngagementChart';
import VideoAnalyticsChart from './analytics/VideoAnalyticsChart';
import TrendingTopicsChart from './analytics/TrendingTopicsChart';
import UserDemographicsChart from './analytics/UserDemographicsChart';
import EngagementOverTimeChart from './analytics/EngagementOverTimeChart';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const data = await getAllAnalytics();
        setAnalyticsData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography color="error" variant="h5">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Roadtrip Nation Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Comprehensive analytics on user engagement, content performance, and audience demographics.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab label="Overview" />
            <Tab label="Theme Analytics" />
            <Tab label="Video Performance" />
            <Tab label="Demographics" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Engagement Over Time</Typography>
                <EngagementOverTimeChart data={analyticsData.engagementOverTime} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Trending Topics</Typography>
                <TrendingTopicsChart data={analyticsData.trendingTopics} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Top Themes</Typography>
                <ThemeEngagementChart data={analyticsData.themeEngagement} limit={5} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>User Demographics</Typography>
                <UserDemographicsChart data={analyticsData.userDemographics} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Theme Analytics Tab */}
        {activeTab === 1 && (
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Theme Engagement</Typography>
                <ThemeEngagementChart data={analyticsData.themeEngagement} showAll={true} />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Theme Trends Over Time</Typography>
                <TrendingTopicsChart data={analyticsData.trendingTopics} showAll={true} height={500} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Video Performance Tab */}
        {activeTab === 2 && (
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Video Performance Metrics</Typography>
                <VideoAnalyticsChart data={analyticsData.videoAnalytics} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Demographics Tab */}
        {activeTab === 3 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Age Distribution</Typography>
                <UserDemographicsChart data={analyticsData.userDemographics} type="age" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Gender Distribution</Typography>
                <UserDemographicsChart data={analyticsData.userDemographics} type="gender" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Regional Distribution</Typography>
                <UserDemographicsChart data={analyticsData.userDemographics} type="region" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Device Usage</Typography>
                <UserDemographicsChart data={analyticsData.userDemographics} type="device" />
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default AnalyticsDashboard; 