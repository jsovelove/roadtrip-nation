import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllLeaders } from '../services/leaderService';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  Chip,
  CardMedia,
  Skeleton,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const LeadersList = () => {
  const [leaders, setLeaders] = useState([]);
  const [filteredLeaders, setFilteredLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const leadersData = await getAllLeaders();
        setLeaders(leadersData);
        setFilteredLeaders(leadersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leaders:', err);
        setError('Failed to load leaders. Please try again later.');
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLeaders(leaders);
    } else {
      const filtered = leaders.filter(
        leader => 
          (leader.id && leader.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (leader.title && leader.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLeaders(filtered);
    }
  }, [searchTerm, leaders]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="50%" height={60} />
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, borderRadius: 1 }} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ 
          p: 4, 
          borderRadius: 2, 
          backgroundColor: 'error.light', 
          color: 'error.dark',
          textAlign: 'center'
        }}>
          <Typography variant="h6">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Search Leaders
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name or title..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ 
            maxWidth: '600px',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {filteredLeaders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No leaders found matching your search criteria
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Grid container spacing={3} sx={{ maxWidth: '1200px' }}>
            {filteredLeaders.map((leader) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                key={leader.id}
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Card sx={{ 
                  width: 320,
                  height: 400, 
                  display: 'flex', 
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {leader.thumbnailURL ? (
                    <CardMedia
                      component="img"
                      image={leader.thumbnailURL}
                      alt={`${leader.id} thumbnail`}
                      sx={{ 
                        height: 180,
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <CardMedia
                      component="div"
                      sx={{ 
                        height: 180, 
                        backgroundColor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 64, color: 'white' }} />
                    </CardMedia>
                  )}
                  <CardContent sx={{ 
                    height: 160,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      gutterBottom 
                      fontWeight={600}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {leader.id || 'Unnamed Leader'}
                    </Typography>
                    {leader.title && (
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {leader.title}
                      </Typography>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      flexWrap: 'wrap', 
                      mt: 'auto'
                    }}>
                      {leader.analysisVersions && leader.analysisVersions.length > 0 ? (
                        <Chip 
                          label={`${leader.analysisVersions.length} Analysis Version${leader.analysisVersions.length !== 1 ? 's' : ''}`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          label="No analysis"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ 
                    p: 2, 
                    pt: 0,
                    mt: 'auto',
                    height: 60,
                    flexShrink: 0
                  }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      component={Link} 
                      to={`/leaders/${leader.id}`}
                      endIcon={<ArrowForwardIcon />}
                      fullWidth
                    >
                      View Interview
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default LeadersList; 