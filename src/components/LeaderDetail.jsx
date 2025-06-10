import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { 
  getLeaderById, 
  getTranscriptText, 
  addAnalysisVersion,
  deleteAnalysisVersion,
  setDefaultAnalysisVersion 
} from '../services/leaderService';
import { 
  identifyQA, 
  generateChapterMarkers
} from '../services/cloudFunctionService';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import VideoPlayer from './VideoPlayer';

const LeaderDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [contentTab, setContentTab] = useState(0);
  const [versionTab, setVersionTab] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const videoPlayerRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLeader = async () => {
      try {
        const leaderData = await getLeaderById(id);
        setLeader(leaderData);
        
        // Set the active version tab to the latest version if available
        if (leaderData.analysisVersions && leaderData.analysisVersions.length > 0) {
          const latestVersionIndex = leaderData.analysisVersions.findIndex(
            v => v.versionId === leaderData.latestAnalysisVersion
          );
          if (latestVersionIndex !== -1) {
            setVersionTab(latestVersionIndex);
          }
        }
        
        setLoading(false);
        
        // Handle timestamp from location state (if coming from topic analysis)
        if (location.state?.timestamp) {
          // Give time for the video player to load before seeking
          setTimeout(() => {
            navigateToTimestamp(location.state.timestamp);
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching leader:', err);
        setError('Failed to load leader data. Please try again later.');
        setLoading(false);
      }
    };

    fetchLeader();
  }, [id, location.state]);

  const handleAnalyze = async () => {
    if (!leader.transcriptURL) {
      setError('No transcript URL available for analysis');
      return;
    }
    setAnalyzing(true);
    setAnalysisStep(1);

    try {
      // Step 1: Fetch transcript text
      const transcriptText = await getTranscriptText(leader.transcriptURL);
      setTranscript(transcriptText);
      setAnalysisStep(2);

      // Step 2: Identify Q&A segments
      const qaData = await identifyQA(transcriptText);
      setAnalysisStep(3);

      // Prepare analysis data object
      let analysisData = {
        qaSegments: qaData,
      };

      // Step 3: Generate chapter markers (always includes integrated Noise segment)
      const existingThemes = leader.analysisVersions && leader.analysisVersions.length > 0
        ? leader.analysisVersions.flatMap(v => v.chapterMarkers?.flatMap(marker => marker.themes) || [])
        : [];
      const uniqueThemes = [...new Set(existingThemes)];

      const chapterMarkers = await generateChapterMarkers(transcriptText, qaData, uniqueThemes);
      setAnalysisStep(4);

      // Add chapter markers to analysis data
      analysisData.chapterMarkers = chapterMarkers;
      setAnalysisStep(5);

      // Add new analysis version
      await addAnalysisVersion(leader.id, analysisData);
      
      // Refresh leader data to get updated versions
      const updatedLeader = await getLeaderById(id);
      setLeader(updatedLeader);
      
      // Set the active version tab to the latest version
      if (updatedLeader.analysisVersions && updatedLeader.analysisVersions.length > 0) {
        setVersionTab(updatedLeader.analysisVersions.length - 1);
      }
      
      setAnalysisStep(6);
    } catch (err) {
      console.error('Error during analysis:', err);
      setError('Failed to analyze transcript. Please try again later.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContentTabChange = (event, newValue) => {
    setContentTab(newValue);
  };

  const handleVersionTabChange = (event, newValue) => {
    setVersionTab(newValue);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const openDeleteDialog = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const openDefaultDialog = () => {
    handleMenuClose();
    setDefaultDialogOpen(true);
  };

  const closeDefaultDialog = () => {
    setDefaultDialogOpen(false);
  };

  const setAsDefault = async () => {
    if (!leader?.id || versionTab === undefined) return;
    
    try {
      await setDefaultAnalysisVersion(leader.id, versionTab);
      
      // Refresh leader data to get updated default version
      const updatedLeader = await getLeaderById(id);
      setLeader(updatedLeader);
      
      closeDefaultDialog();
    } catch (err) {
      console.error('Error setting default version:', err);
      setError('Failed to set default version. Please try again later.');
      closeDefaultDialog();
    }
  };

  const handleDeleteVersion = async () => {
    if (!leader?.id || versionTab === undefined) return;
    
    try {
      await deleteAnalysisVersion(leader.id, versionTab);
      
      // Refresh leader data to get updated versions
      const updatedLeader = await getLeaderById(id);
      setLeader(updatedLeader);
      
      // Adjust the version tab if needed
      if (updatedLeader.analysisVersions && updatedLeader.analysisVersions.length > 0) {
        // If we deleted the last tab, select the new last tab
        if (versionTab >= updatedLeader.analysisVersions.length) {
          setVersionTab(updatedLeader.analysisVersions.length - 1);
        }
      } else {
        // If we deleted the only version, reset to tab 0
        setVersionTab(0);
      }
      
      closeDeleteDialog();
    } catch (err) {
      console.error('Error deleting version:', err);
      setError('Failed to delete version. Please try again later.');
      closeDeleteDialog();
    }
  };

  // Navigate to timestamp in video - use original timestamp for accuracy
  const navigateToTimestamp = (timestamp) => {
    if (videoPlayerRef.current && timestamp) {
      videoPlayerRef.current.seekToTime(timestamp);
    }
  };

  // Format timestamp for better readability (remove hours if 00, remove milliseconds)
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Remove any milliseconds
    let cleanTimestamp = timestamp.split('.')[0];
    
    // If it starts with 00: (hours), remove it
    if (cleanTimestamp.startsWith('00:')) {
      cleanTimestamp = cleanTimestamp.substring(3);
    }
    
    return cleanTimestamp;
  };

  // Format timestamp for Q&A display as MM:SS
  const formatQATimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Remove any milliseconds (handle both . and , separators)
    let cleanTimestamp = timestamp.split('.')[0].split(',')[0];
    
    // Split into parts
    const parts = cleanTimestamp.split(':');
    
    if (parts.length === 3) {
      // HH:MM:SS format - convert to MM:SS
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parts[2];
      
      // Convert hours to minutes and add to existing minutes
      const totalMinutes = hours * 60 + minutes;
      return `${totalMinutes}:${seconds}`;
    } else if (parts.length === 2) {
      // Already MM:SS format
      return cleanTimestamp;
    }
    
    return cleanTimestamp;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format timestamp for display with clickable styling
  const TimestampDisplay = ({ start, end, label }) => {
    const formattedStart = formatTimestamp(start);
    const formattedEnd = end ? formatTimestamp(end) : null;
    
    return (
      <Box display="flex" gap={1}>
        <Chip 
          label={formattedStart}
          color="primary"
          variant="outlined"
          size="small"
          clickable
          onClick={() => navigateToTimestamp(start)} // Use original timestamp
          sx={{ cursor: 'pointer' }}
        />
        {formattedEnd && (
          <>
            <Typography variant="body2" color="text.secondary">-</Typography>
            <Chip 
              label={formattedEnd}
              color="primary"
              variant="outlined"
              size="small"
              clickable
              onClick={() => navigateToTimestamp(end)} // Use original timestamp
              sx={{ cursor: 'pointer' }}
            />
          </>
        )}
        {label && <Typography variant="body2" color="text.secondary">{label}</Typography>}
      </Box>
    );
  };

  // Get current active version
  const getCurrentVersion = () => {
    if (!leader?.analysisVersions || !leader.analysisVersions.length || versionTab >= leader.analysisVersions.length) {
      return null;
    }
    return leader.analysisVersions[versionTab];
  };

  // Convert timestamp to seconds for comparison
  const timestampToSeconds = (timestamp) => {
    if (!timestamp) return 0;
    const parts = timestamp.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Match Q&A segments to chapters based on timestamps
  const getQAForChapter = (chapterTimestamp, nextChapterTimestamp) => {
    const currentVersion = getCurrentVersion();
    if (!currentVersion?.qaSegments) return [];

    const chapterStartSeconds = timestampToSeconds(chapterTimestamp);
    const chapterEndSeconds = nextChapterTimestamp ? timestampToSeconds(nextChapterTimestamp) : Infinity;

    return currentVersion.qaSegments.filter(qa => {
      const qaStartSeconds = timestampToSeconds(qa.questionStart || qa.answerStart);
      return qaStartSeconds >= chapterStartSeconds && qaStartSeconds < chapterEndSeconds;
    });
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">{error}</Typography>
      </Container>
    );
  }

  const currentVersion = getCurrentVersion();
  const hasAnalysisVersions = leader.analysisVersions && leader.analysisVersions.length > 0;

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {leader.id || 'Unnamed Leader'}
      </Typography>
      {leader.title && (
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {leader.title}
        </Typography>
      )}

      {leader.videoURL && (
        <Box sx={{ my: 4 }}>
          <VideoPlayer 
            videoUrl={leader.videoURL} 
            ref={videoPlayerRef} 
            chapterMarkers={currentVersion?.chapterMarkers || []}
            noiseSegment={currentVersion?.noiseSegment || null}
          />
        </Box>
      )}

      {analyzing && (
        <Box sx={{ my: 4 }}>
          <Typography variant="h6">Analyzing Interview...</Typography>
          <LinearProgress variant="determinate" value={analysisStep * 16.6} sx={{ mt: 2 }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {analysisStep === 1 && 'Fetching transcript...'}
            {analysisStep === 2 && 'Identifying question and answer segments...'}
            {analysisStep === 3 && 'Generating chapter markers...'}
            {analysisStep === 4 && 'Processing results...'}
            {analysisStep === 5 && 'Saving analysis data...'}
            {analysisStep === 6 && 'Analysis complete!'}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleAnalyze}
          disabled={!leader.transcriptURL || analyzing}
          startIcon={<AddCircleIcon />}
        >
          Generate New Analysis
        </Button>
        
        {hasAnalysisVersions && (
          <Typography variant="body2" color="text.secondary">
            Latest analysis: {formatDate(currentVersion?.timestamp)}
          </Typography>
        )}
      </Box>

      {!hasAnalysisVersions && !analyzing && (
        <Box sx={{ my: 4 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This interview has not been analyzed yet. Click "Generate New Analysis" to create your first analysis.
          </Alert>
        </Box>
      )}

      {hasAnalysisVersions && (
        <Box sx={{ width: '100%', mt: 2 }}>
          {/* Version tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', alignItems: 'center' }}>
            <Tabs
              value={versionTab}
              onChange={handleVersionTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              textColor="secondary"
              sx={{ flex: 1 }}
            >
              {leader.analysisVersions.map((version, index) => (
                <Tab 
                  key={index} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span>{`Version ${index + 1}`}</span>
                      {version.versionId === leader.latestAnalysisVersion && (
                        <StarIcon sx={{ ml: 1, fontSize: '0.9rem', color: 'warning.main' }} />
                      )}
                    </Box>
                  }
                  iconPosition="end"
                  sx={{ minHeight: '48px' }}
                />
              ))}
            </Tabs>
            
            {/* Version actions menu */}
            <IconButton
              aria-label="more"
              aria-controls="version-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="version-menu"
              anchorEl={menuAnchorEl}
              keepMounted
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={openDeleteDialog}>
                Delete Version
              </MenuItem>
              <MenuItem onClick={openDefaultDialog}>
                Set as Default
              </MenuItem>
            </Menu>
          </Box>

          {/* Content tabs for current version */}
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Tabs
              value={contentTab}
              onChange={handleContentTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Chapter Markers" />
              {currentVersion?.noiseSegment && <Tab label="Noise Segment" />}
            </Tabs>
          </Paper>

          {/* Display a message if no versions exist after deletion */}
          {(!currentVersion) && (
            <Box sx={{ my: 4 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                No analysis versions available. Click "Generate New Analysis" to create one.
              </Alert>
            </Box>
          )}
          
          {/* Chapter Markers Tab */}
          {contentTab === 0 && currentVersion && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Chapter Markers
              </Typography>
              {currentVersion.chapterMarkers?.map((marker, index) => {
                const nextChapterTimestamp = currentVersion.chapterMarkers?.[index + 1]?.timestamp;
                const chapterQAs = getQAForChapter(marker.timestamp, nextChapterTimestamp);
                
                return (
                  <Card 
                    key={index} 
                    sx={{ 
                      mb: 2,
                      ...(marker.isNoiseSegment && {
                        borderLeft: '4px solid',
                        borderColor: 'secondary.main'
                      })
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" color="primary" fontWeight="bold">
                            {marker.title}
                          </Typography>
                          {marker.isNoiseSegment && (
                            <Chip
                              label="Noise"
                              color="secondary"
                              size="small"
                              sx={{ ml: 1, height: '20px', fontSize: '0.7rem' }}
                            />
                          )}
                          {chapterQAs.length > 0 && (
                            <Chip
                              icon={<QuestionAnswerIcon sx={{ fontSize: '0.8rem' }} />}
                              label={`${chapterQAs.length} Q&A`}
                              color="info"
                              variant="outlined"
                              size="small"
                              sx={{ ml: 1, height: '20px', fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Chip
                          label={formatTimestamp(marker.timestamp)}
                          color="primary"
                          size="small"
                          clickable
                          onClick={() => navigateToTimestamp(marker.timestamp)} // Use original timestamp
                        />
                      </Box>
                      <Typography variant="body1">
                        {marker.description}
                      </Typography>
                      {marker.isNoiseSegment && marker.contextCard && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <Card variant="outlined" sx={{ bgcolor: 'grey.100' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Context
                              </Typography>
                              <Typography variant="body1">
                                {marker.contextCard}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>
                      )}
                      
                      {/* Q&A Sections for this chapter */}
                      {chapterQAs.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Accordion sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <QuestionAnswerIcon sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="subtitle2" color="info.main">
                                  {chapterQAs.length} Question{chapterQAs.length > 1 ? 's' : ''} & Answer{chapterQAs.length > 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              {chapterQAs.map((segment, qaIndex) => (
                                <Card key={qaIndex} variant="outlined" sx={{ mb: qaIndex < chapterQAs.length - 1 ? 1 : 0 }}>
                                  <CardContent>
                                                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                       <Box sx={{ display: 'flex', alignItems: 'flex-start', mr: 2, flex: 1 }}>
                                         <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                           Q: {segment.question}
                                         </Typography>
                                         {segment.isJeopardyStyle && (
                                           <Chip
                                             label="Generated"
                                             color="secondary"
                                             size="small"
                                             sx={{ ml: 1, height: '18px', fontSize: '0.6rem' }}
                                           />
                                         )}
                                       </Box>
                                       <Chip
                                         label={formatQATimestamp(segment.questionStart)}
                                         color="primary"
                                         size="small"
                                         clickable
                                         onClick={() => navigateToTimestamp(segment.questionStart)}
                                         sx={{ cursor: 'pointer' }}
                                       />
                                     </Box>
                                     <Divider sx={{ my: 1 }} />
                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                       <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                                         A: {segment.answer}
                                       </Typography>
                                                                               <Chip
                                          label={formatQATimestamp(segment.answerStart)}
                                          color="primary"
                                          variant="outlined"
                                          size="small"
                                          clickable
                                          onClick={() => navigateToTimestamp(segment.answerStart)}
                                          sx={{ cursor: 'pointer' }}
                                        />
                                     </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {/* Official themes */}
                        {marker.themes.map((theme, themeIndex) => (
                          <Box 
                            key={`theme-${themeIndex}`}
                            sx={{ 
                              px: 1, 
                              py: 0.5, 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              borderRadius: 1,
                              fontSize: '0.8rem'
                            }}
                          >
                            {theme}
                          </Box>
                        ))}
                        
                        {/* Custom themes */}
                        {marker.customThemes?.map((theme, themeIndex) => (
                          <Box 
                            key={`custom-${themeIndex}`}
                            sx={{ 
                              px: 1, 
                              py: 0.5, 
                              bgcolor: 'secondary.light', 
                              color: 'white',
                              borderRadius: 1,
                              fontSize: '0.8rem',
                              fontStyle: 'italic'
                            }}
                          >
                            {theme}
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}

              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label="Noise"
                    color="secondary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    A chapter about filtering external influences, advice, and expectations from others
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    icon={<QuestionAnswerIcon sx={{ fontSize: '0.8rem' }} />}
                    label="Q&A"
                    color="info"
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Questions and answers identified within this chapter - click to expand
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    label="Generated"
                    color="secondary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Questions generated for content without clear interview questions
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      bgcolor: 'primary.light', 
                      color: 'white',
                      borderRadius: 1,
                      fontSize: '0.8rem',
                      mr: 1
                    }}
                  >
                    Official Theme
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Standard Roadtrip Nation themes
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      bgcolor: 'secondary.light', 
                      color: 'white',
                      borderRadius: 1,
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      mr: 1
                    }}
                  >
                    Custom Theme
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Additional themes identified by AI specific to this interview
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Noise Segment Tab */}
          {contentTab === 1 && currentVersion && currentVersion.noiseSegment && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Noise Segment
              </Typography>
              <Card 
                sx={{ 
                  mb: 2,
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" color="secondary" fontWeight="bold">
                      {currentVersion.noiseSegment.title}
                    </Typography>
                    <Chip
                      label={formatTimestamp(currentVersion.noiseSegment.timestamp)}
                      color="secondary"
                      size="small"
                      clickable
                      onClick={() => navigateToTimestamp(currentVersion.noiseSegment.timestamp)}
                    />
                  </Box>
                  <Typography variant="body1">
                    {currentVersion.noiseSegment.description}
                  </Typography>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.100' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Context
                        </Typography>
                        <Typography variant="body1">
                          {currentVersion.noiseSegment.contextCard}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {/* Official themes */}
                    {currentVersion.noiseSegment.themes?.map((theme, themeIndex) => (
                      <Box 
                        key={`theme-${themeIndex}`}
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          bgcolor: 'primary.light', 
                          color: 'white',
                          borderRadius: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        {theme}
                      </Box>
                    ))}
                    
                    {/* Custom themes */}
                    {currentVersion.noiseSegment.customThemes?.map((theme, themeIndex) => (
                      <Box 
                        key={`custom-${themeIndex}`}
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          bgcolor: 'secondary.light', 
                          color: 'white',
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          fontStyle: 'italic'
                        }}
                      >
                        {theme}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}

      {transcript && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Transcript
          </Typography>
          <Paper sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {transcript}
            </Typography>
          </Paper>
        </Box>
      )}



      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Analysis Version
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete Version {versionTab + 1}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteVersion} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set as default confirmation dialog */}
      <Dialog
        open={defaultDialogOpen}
        onClose={closeDefaultDialog}
        aria-labelledby="default-dialog-title"
        aria-describedby="default-dialog-description"
      >
        <DialogTitle id="default-dialog-title">
          Set as Default Version
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="default-dialog-description">
            Do you want to set Version {versionTab + 1} as the default version? This will be the version displayed by default when viewing this leader.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDefaultDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={setAsDefault} color="primary" autoFocus>
            Set as Default
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeaderDetail; 