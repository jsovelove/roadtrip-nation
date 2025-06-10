import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  List,
  ListItem,
  ListItemText,
  Link,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import { Link as RouterLink } from 'react-router-dom';
import * as d3 from 'd3';
import { generateTopicAnalysisReport, categorizeChaptersByTopic } from '../services/topicAnalysisService';
import { getAllLeaders } from '../services/leaderService';

const TopicAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [categorizingChapters, setCategorizingChapters] = useState(false);
  const [categorizeResults, setCategorizeResults] = useState(null);
  const [chaptersByTopic, setChaptersByTopic] = useState({});
  const [leaders, setLeaders] = useState([]);
  const [refreshingAnalysis, setRefreshingAnalysis] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const pieChartRef = useRef(null);
  
  useEffect(() => {
    fetchAnalysisData();
  }, []);
  
  const fetchAnalysisData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate the topic analysis report
      const data = await generateTopicAnalysisReport(forceRefresh);
      setAnalysisData(data);
      
      // Fetch all leaders
      const leadersData = await getAllLeaders();
      setLeaders(leadersData);
      
      // Prepare chapters by topic if analysis has been categorized
      if (data.categorizedAt) {
        prepareChaptersByTopic(leadersData);
      }
    } catch (err) {
      console.error('Error generating topic analysis:', err);
      setError('Failed to generate topic analysis. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshingAnalysis(false);
    }
  };
  
  const prepareChaptersByTopic = (leadersData) => {
    // Create a map to store chapters by topic
    const topicChaptersMap = {};
    
    // Process all leaders to collect chapters by topics
    leadersData.forEach(leader => {
      if (!leader.latestAnalysisVersion || !leader.analysisVersions) return;
      
      // Get the default analysis version
      const defaultVersion = leader.analysisVersions.find(
        version => version.versionId === leader.latestAnalysisVersion
      );
      
      if (!defaultVersion || !defaultVersion.chapterMarkers) return;
      
      // Add chapters to their matched topics
      defaultVersion.chapterMarkers.forEach(marker => {
        if (!marker.matchedTopics || marker.matchedTopics.length === 0) return;
        
        marker.matchedTopics.forEach(topicName => {
          if (!topicChaptersMap[topicName]) {
            topicChaptersMap[topicName] = [];
          }
          
          topicChaptersMap[topicName].push({
            leaderId: leader.id,
            leaderTitle: leader.title || leader.id,
            chapterTitle: marker.title,
            timestamp: marker.timestamp
          });
        });
      });
    });
    
    setChaptersByTopic(topicChaptersMap);
  };
  
  const handleCategorizeChapters = async () => {
    setCategorizingChapters(true);
    setCategorizeResults(null);
    
    try {
      const results = await categorizeChaptersByTopic(useAI);
      setCategorizeResults(results);
      
      // Refresh analysis data
      const updatedData = await generateTopicAnalysisReport();
      setAnalysisData(updatedData);
      
      // Refresh leaders data
      const leadersData = await getAllLeaders();
      setLeaders(leadersData);
      
      // Update chapters by topic
      prepareChaptersByTopic(leadersData);
    } catch (err) {
      console.error('Error categorizing chapters:', err);
      setError('Failed to categorize chapters. Please try again later.');
    } finally {
      setCategorizingChapters(false);
    }
  };
  
  const handleUseAIToggle = (event) => {
    setUseAI(event.target.checked);
  };
  
  const handleRefreshAnalysis = async () => {
    setRefreshingAnalysis(true);
    setCategorizeResults(null);
    await fetchAnalysisData(true); // Force refresh
  };
  
  // Format timestamp to a readable date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };
  
  // Format video timestamp for display
  const formatVideoTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Remove any milliseconds
    let cleanTimestamp = timestamp.split('.')[0];
    
    // If it starts with 00: (hours), remove it
    if (cleanTimestamp.startsWith('00:')) {
      cleanTimestamp = cleanTimestamp.substring(3);
    }
    
    return cleanTimestamp;
  };
  
  useEffect(() => {
    if (loading || error || !analysisData?.topicDistribution) return;
    
    renderPieChart();
  }, [loading, error, analysisData]);
  
  const renderPieChart = () => {
    // Clear previous chart
    d3.select(pieChartRef.current).selectAll("*").remove();
    
    const data = analysisData.topicDistribution;
    // Increase dimensions for better spacing
    const width = 1100;
    const height = 700;
    const margin = 200;
    
    // The radius of the pie chart
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG element
    const svg = d3.select(pieChartRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Set colors
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.topic))
      .range(["#00bcd4", "#2196f3", "#3f51b5", "#673ab7", "#9c27b0", "#e91e63", "#f44336", "#ff9800", "#4caf50", "#8bc34a"]);
    
    // Compute the position of each group on the pie
    const pie = d3.pie()
      .sort(null) // Do not sort by size
      .value(d => d.percentage);
    
    const pieData = pie(data);
    
    // Shape helper to build arcs
    const arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
    
    // Build the pie chart
    svg.selectAll('pieces')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', d => colorScale(d.data.topic))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8);
    
    // Calculate initial label positions
    const labelPositions = [];
    pieData.forEach((d, i) => {
      const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
      const pos = d3.arc()
        .innerRadius(radius * 1.05)
        .outerRadius(radius * 1.05)
        .centroid(d);
      
      // Place text further away from the pie
      pos[0] = radius * 1.5 * (midangle < Math.PI ? 1 : -1);
      
      // Initial position - we'll adjust these later
      labelPositions.push({
        x: pos[0],
        y: pos[1],
        angle: midangle,
        data: d,
        index: i,
        width: 0,
        height: 0,
        side: midangle < Math.PI ? 'left' : 'right'
      });
    });
    
    // Function to check if two labels overlap
    function checkOverlap(a, b) {
      const padding = 8; // Minimum padding between labels
      
      // Check if a and b are on the same side (left or right)
      if (a.side !== b.side) return false;
      
      const aTop = a.y - a.height / 2 - padding;
      const aBottom = a.y + a.height / 2 + padding;
      const bTop = b.y - b.height / 2 - padding;
      const bBottom = b.y + b.height / 2 + padding;
      
      return !(aBottom < bTop || aTop > bBottom);
    }
    
    // Sort labels by angle for more natural ordering
    labelPositions.sort((a, b) => a.angle - b.angle);
    
    // First pass: Add connector lines before calculating text dimensions
    svg.selectAll('label-lines')
      .data(labelPositions)
      .enter()
      .append('polyline')
      .attr('stroke', 'black')
      .style('fill', 'none')
      .attr('stroke-width', 1)
      .attr('points', function(d) {
        const posA = arcGenerator.centroid(d.data); // line insertion in the slice
        const posB = d3.arc()
          .innerRadius(radius * 0.8)
          .outerRadius(radius * 0.8)
          .centroid(d.data); // line break
        
        // Calculate label position
        const posC = [d.x, d.y]; // This will be updated later
        
        return [posA, posB, posC];
      })
      .attr('class', d => `line-${d.index}`); // Add class for later update
    
    // Create text label groups with approximate positions first
    const labelGroups = svg.selectAll('label-text-groups')
      .data(labelPositions)
      .enter()
      .append('g')
      .attr('class', d => `label-group-${d.index}`)
      .attr('transform', d => `translate(${d.x},${d.y})`);
    
    // Add background and text elements to each group
    labelGroups.each(function(d) {
      const g = d3.select(this);
      const textAnchor = d.side === 'left' ? 'start' : 'end';
      
      // Create background rectangle first
      const bgRect = g.append("rect")
        .attr("fill", "white")
        .attr("fill-opacity", 0.9)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "label-bg");
      
      // Add the text element
      const text = g.append("text")
        .attr("text-anchor", textAnchor)
        .attr("dy", 0)
        .attr("font-weight", "bold")
        .attr("font-size", "13px")
        .attr("class", "label-text");
      
      const topicText = d.data.data.topic;
      const percentText = `(${d.data.data.percentage.toFixed(1)}%)`;
      
      // Handle long text vs short text differently
      if (topicText.length > 15) {
        // Split long text into multiple lines
        const words = topicText.split(' ');
        const lines = [];
        let currentLine = [];
        let currentLength = 0;
        
        // Break text into lines
        words.forEach(word => {
          if (currentLength + word.length > 15) {
            lines.push(currentLine.join(' '));
            currentLine = [word];
            currentLength = word.length;
          } else {
            currentLine.push(word);
            currentLength += word.length + 1;
          }
        });
        
        // Add any remaining text
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        
        // Add each line as a tspan
        lines.forEach((line, i) => {
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? 0 : "1.2em")
            .attr("text-anchor", textAnchor)
            .text(line);
        });
        
        // Add percentage on a new line
        text.append("tspan")
          .attr("x", 0)
          .attr("dy", "1.2em")
          .attr("text-anchor", textAnchor)
          .attr("font-weight", "normal")
          .text(percentText);
      } else {
        // For shorter text, keep on one line
        text.append("tspan")
          .attr("x", 0)
          .attr("dy", 0)
          .text(topicText);
        
        text.append("tspan")
          .attr("dx", 5)
          .attr("dy", 0)
          .attr("font-weight", "normal")
          .text(percentText);
      }
      
      // Get the text dimensions and store them
      const bbox = text.node().getBBox();
      
      // Size the background to fit the text
      bgRect
        .attr("x", bbox.x - 6)
        .attr("y", bbox.y - 3)
        .attr("width", bbox.width + 12)
        .attr("height", bbox.height + 6);
      
      // Store the dimensions for collision detection
      d.width = bbox.width + 12;
      d.height = bbox.height + 6;
    });
    
    // Second pass: Adjust positions to avoid overlaps
    // Split the labels into left and right sides
    const leftLabels = labelPositions.filter(d => d.side === 'left');
    const rightLabels = labelPositions.filter(d => d.side === 'right');
    
    // Sort by vertical position (angle)
    leftLabels.sort((a, b) => a.angle - b.angle);
    rightLabels.sort((a, b) => a.angle - b.angle);
    
    // Function to adjust positions within a group
    function adjustPositions(labels) {
      if (labels.length <= 1) return;
      
      // Start from second label and adjust
      for (let i = 1; i < labels.length; i++) {
        let currentLabel = labels[i];
        let prevLabel = labels[i-1];
        
        // Check overlap with the previous label
        if (checkOverlap(currentLabel, prevLabel)) {
          // Calculate required shift
          const overlap = (prevLabel.y + prevLabel.height/2 + 8) - (currentLabel.y - currentLabel.height/2);
          
          // Push current label down
          currentLabel.y += overlap;
          
          // Check if this adjustment causes overlap with the next label
          // If so, we'll handle it in the next iteration
        }
      }
      
      // Now check from bottom to top to ensure no overlaps
      for (let i = labels.length - 2; i >= 0; i--) {
        let currentLabel = labels[i];
        let nextLabel = labels[i+1];
        
        if (checkOverlap(currentLabel, nextLabel)) {
          // Calculate required shift
          const overlap = (currentLabel.y + currentLabel.height/2 + 8) - (nextLabel.y - nextLabel.height/2);
          
          // Push current label up
          currentLabel.y -= overlap;
        }
      }
    }
    
    // Adjust positions for both sides
    adjustPositions(leftLabels);
    adjustPositions(rightLabels);
    
    // Update the label positions
    labelPositions.forEach(d => {
      // Update the label group position
      svg.select(`.label-group-${d.index}`)
        .attr('transform', `translate(${d.x},${d.y})`);
      
      // Update the connector line end point
      const line = svg.select(`.line-${d.index}`);
      const points = line.attr('points').split(',');
      const newEndPoint = `${d.x},${d.y}`;
      
      // Replace the last point with the new position
      const lastCommaIndex = points.lastIndexOf(',');
      const updatedPoints = points.slice(0, lastCommaIndex-1).join(',') + ',' + newEndPoint;
      line.attr('points', updatedPoints);
    });
    
    // Add title to the chart
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -height/2 + 30)
      .attr('x', 0)
      .text('Overall Topic Distribution Across the Full Corpus')
      .style('font-size', '24px')
      .style('font-weight', 'bold');
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
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={fetchAnalysisData}
        >
          Try Again
        </Button>
      </Box>
    );
  }
  
  if (!analysisData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">No analysis data available.</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={fetchAnalysisData}
        >
          Generate Topic Analysis
        </Button>
      </Box>
    );
  }
  
  const { topicDistribution, keyTopics, topicInsights, timestamp, categorizedAt } = analysisData;
  
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
        Interview Corpus Topic Analysis
      </Typography>
      
      {timestamp && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ textAlign: 'center', mb: 3 }}
        >
          Analysis last updated: {formatTimestamp(timestamp)}
          {categorizedAt && (
            <>
              <br />
              Chapters categorized: {formatTimestamp(categorizedAt)}
            </>
          )}
        </Typography>
      )}
      
      {/* Hide the action buttons by wrapping them in a conditional */}
      {showAdminControls && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              disabled={refreshingAnalysis}
              onClick={handleRefreshAnalysis}
              sx={{ borderRadius: 2 }}
            >
              {refreshingAnalysis ? 'Generating New Analysis...' : 'Generate New Topic Analysis'}
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              disabled={categorizingChapters}
              onClick={handleCategorizeChapters}
              sx={{ borderRadius: 2 }}
            >
              {categorizingChapters ? 'Categorizing Chapters...' : (categorizedAt ? 'Recategorize Chapters' : 'Categorize Chapters by Topic')}
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useAI}
                  onChange={handleUseAIToggle}
                  color="primary"
                  disabled={categorizingChapters}
                />
              }
              label="Use AI for smarter categorization"
            />
            <Tooltip title="AI categorization is more accurate but takes longer. It ensures all key topics have chapters assigned to them.">
              <InfoIcon color="action" fontSize="small" sx={{ ml: 1 }} />
            </Tooltip>
          </Box>
        </Box>
      )}
      
      {categorizeResults && showAdminControls && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Successfully categorized {categorizeResults.totalChaptersProcessed} chapters across {categorizeResults.leadersProcessed.length} leaders 
          using {useAI ? 'AI-powered' : 'pattern matching'} categorization.
        </Alert>
      )}
      
      {/* Pie chart visualization */}
      <Paper sx={{ p: 3, mb: 4, overflow: 'hidden', textAlign: 'center' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          }
        }}>
          <svg ref={pieChartRef} />
        </Box>
      </Paper>
      
      {/* Overall insights */}
      {topicInsights && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Overall Topic Insights
          </Typography>
          <Typography variant="body1">
            {topicInsights}
          </Typography>
        </Paper>
      )}
      
      {/* Topic distribution summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Topic Distribution Summary
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {topicDistribution.map((topic, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ 
                height: '100%', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    {topic.topic} ({topic.percentage.toFixed(1)}%)
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    {topic.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Key topics with accordion for details */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Key Topics Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Explore detailed analysis of key topics identified across interviews. Each topic includes 
          related interviews and chapters categorized under this topic.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          {keyTopics.map((topic, index) => (
            <Accordion key={index} sx={{ 
              mb: 2, 
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              '&:before': {
                display: 'none',
              }
            }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                <Typography variant="h6">{topic.topic}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  <strong>Description:</strong> {topic.description}
                </Typography>
                
                {topic.insights && (
                  <Typography variant="body1" paragraph>
                    <strong>Insights:</strong> {topic.insights}
                  </Typography>
                )}
                
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Related Interviews:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {topic.relatedInterviews.map((interview, i) => (
                    <Chip 
                      key={i} 
                      label={interview} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                      component={RouterLink}
                      to={`/leaders/${interview}`}
                      clickable
                    />
                  ))}
                </Box>
                
                {/* Display chapters for this topic */}
                {chaptersByTopic[topic.topic] && chaptersByTopic[topic.topic].length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Chapters about this topic:
                    </Typography>
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                      {chaptersByTopic[topic.topic].map((chapter, i) => (
                        <ListItem 
                          key={i}
                          component={RouterLink}
                          to={`/leaders/${chapter.leaderId}`}
                          state={{ timestamp: chapter.timestamp }}
                          sx={{ 
                            borderBottom: i < chaptersByTopic[topic.topic].length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <ListItemText 
                            primary={chapter.chapterTitle} 
                            secondary={
                              <>
                                {chapter.leaderTitle} • {formatVideoTimestamp(chapter.timestamp)}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                
                {categorizedAt && !chaptersByTopic[topic.topic] && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No chapters found for this topic.
                  </Alert>
                )}
                
                {!categorizedAt && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Click "Categorize Chapters by Topic" above to see chapters related to this topic.
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default TopicAnalysis; 