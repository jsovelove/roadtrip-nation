import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, FormControl, InputLabel, Select, MenuItem, 
         Slider, ToggleButtonGroup, ToggleButton, Button } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import * as d3 from 'd3';
import { getAllLeaders } from '../services/leaderService';

const ThemeCorrelationNetwork = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [displayMode, setDisplayMode] = useState('official'); // 'official' or 'custom'
  const [correlationThreshold, setCorrelationThreshold] = useState(2);
  const [maxNodeCount, setMaxNodeCount] = useState(50);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const zoomRef = useRef(null);
  
  // Process the leader data to generate the correlation network
  useEffect(() => {
    const processThemeCorrelations = async () => {
      try {
        setLoading(true);
        const leaders = await getAllLeaders();
        
        // Maps to track co-occurrences between themes
        const officialThemeCoOccurrences = new Map();
        const customThemeCoOccurrences = new Map();
        
        // Maps to track individual theme frequencies
        const officialThemeFrequency = new Map();
        const customThemeFrequency = new Map();
        
        // Process all leaders and their themes
        leaders.forEach(leader => {
          // Find the default analysis version
          const defaultVersion = leader.analysisVersions?.find(
            version => version.versionId === leader.latestAnalysisVersion
          );
          
          if (!defaultVersion) return;
          
          // Collect themes from each interview
          const officialThemesInInterview = new Set();
          const customThemesInInterview = new Set();
          
          // Process chapter markers
          defaultVersion.chapterMarkers?.forEach(marker => {
            // Collect official themes
            marker.themes?.forEach(theme => {
              officialThemesInInterview.add(theme);
              officialThemeFrequency.set(theme, (officialThemeFrequency.get(theme) || 0) + 1);
            });
            
            // Collect custom themes
            marker.customThemes?.forEach(theme => {
              customThemesInInterview.add(theme);
              customThemeFrequency.set(theme, (customThemeFrequency.get(theme) || 0) + 1);
            });
          });
          
          // Process noise segment if it exists separately
          if (defaultVersion.noiseSegment) {
            defaultVersion.noiseSegment.themes?.forEach(theme => {
              officialThemesInInterview.add(theme);
              officialThemeFrequency.set(theme, (officialThemeFrequency.get(theme) || 0) + 1);
            });
            
            defaultVersion.noiseSegment.customThemes?.forEach(theme => {
              customThemesInInterview.add(theme);
              customThemeFrequency.set(theme, (customThemeFrequency.get(theme) || 0) + 1);
            });
          }
          
          // Calculate co-occurrences for official themes
          const officialThemeArray = Array.from(officialThemesInInterview);
          for (let i = 0; i < officialThemeArray.length; i++) {
            for (let j = i + 1; j < officialThemeArray.length; j++) {
              const theme1 = officialThemeArray[i];
              const theme2 = officialThemeArray[j];
              
              // Create a unique key for this theme pair (alphabetically ordered to avoid duplicates)
              const key = [theme1, theme2].sort().join('___');
              
              officialThemeCoOccurrences.set(key, (officialThemeCoOccurrences.get(key) || 0) + 1);
            }
          }
          
          // Calculate co-occurrences for custom themes
          const customThemeArray = Array.from(customThemesInInterview);
          for (let i = 0; i < customThemeArray.length; i++) {
            for (let j = i + 1; j < customThemeArray.length; j++) {
              const theme1 = customThemeArray[i];
              const theme2 = customThemeArray[j];
              
              // Create a unique key for this theme pair
              const key = [theme1, theme2].sort().join('___');
              
              customThemeCoOccurrences.set(key, (customThemeCoOccurrences.get(key) || 0) + 1);
            }
          }
        });
        
        // Generate network data for official themes
        const officialNetworkData = generateNetworkData(
          officialThemeCoOccurrences, 
          officialThemeFrequency,
          correlationThreshold,
          maxNodeCount
        );
        
        // Generate network data for custom themes
        const customNetworkData = generateNetworkData(
          customThemeCoOccurrences, 
          customThemeFrequency,
          correlationThreshold,
          maxNodeCount
        );
        
        // Set the initial network data based on display mode
        setNetworkData(displayMode === 'official' ? officialNetworkData : customNetworkData);
        
        // Store the complete data for later filtering
        setFullData({
          official: officialNetworkData,
          custom: customNetworkData,
          officialThemeCoOccurrences,
          customThemeCoOccurrences,
          officialThemeFrequency,
          customThemeFrequency
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error processing theme correlations:', err);
        setError('Failed to generate theme correlation network. Please try again later.');
        setLoading(false);
      }
    };
    
    processThemeCorrelations();
  }, []);
  
  // Store the full data for filtering
  const [fullData, setFullData] = useState({
    official: { nodes: [], links: [] },
    custom: { nodes: [], links: [] },
    officialThemeCoOccurrences: new Map(),
    customThemeCoOccurrences: new Map(),
    officialThemeFrequency: new Map(),
    customThemeFrequency: new Map()
  });
  
  // Generate network data from co-occurrence and frequency maps
  const generateNetworkData = (coOccurrenceMap, frequencyMap, threshold, maxNodes) => {
    // Convert frequency map to array and sort by frequency
    const sortedThemes = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxNodes)
      .map(([theme]) => theme);
    
    // Create a set of top themes for quick lookup
    const topThemesSet = new Set(sortedThemes);
    
    // Generate nodes
    const nodes = sortedThemes.map(theme => ({
      id: theme,
      name: theme,
      value: frequencyMap.get(theme)
    }));
    
    // Generate links that meet the threshold and connect top themes
    const links = [];
    
    coOccurrenceMap.forEach((weight, key) => {
      if (weight >= threshold) {
        const [source, target] = key.split('___');
        
        // Only include links between themes in our top themes list
        if (topThemesSet.has(source) && topThemesSet.has(target)) {
          links.push({
            source,
            target,
            value: weight
          });
        }
      }
    });
    
    return { nodes, links };
  };
  
  // Update network data when display mode or filters change
  useEffect(() => {
    if (loading || error || !fullData) return;
    
    const coOccurrenceMap = displayMode === 'official' 
      ? fullData.officialThemeCoOccurrences 
      : fullData.customThemeCoOccurrences;
      
    const frequencyMap = displayMode === 'official'
      ? fullData.officialThemeFrequency
      : fullData.customThemeFrequency;
    
    const newNetworkData = generateNetworkData(
      coOccurrenceMap,
      frequencyMap,
      correlationThreshold,
      maxNodeCount
    );
    
    setNetworkData(newNetworkData);
  }, [displayMode, correlationThreshold, maxNodeCount, fullData]);
  
  // Render the force-directed graph
  useEffect(() => {
    if (loading || error || !networkData.nodes.length || !svgRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = 700; // Fixed height
    
    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("viewBox", [0, 0, containerWidth, containerHeight]);
    
    // Create a group for all graph elements - this will be transformed during zoom
    const graphGroup = svg.append("g")
      .attr("class", "graph-group");
    
    // Create a tooltip div if it doesn't exist
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select(containerRef.current)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("box-shadow", "0px 2px 4px rgba(0,0,0,0.2)")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "10");
    }
    
    // Define color scale for nodes based on value (frequency)
    const colorScale = d3.scaleLinear()
      .domain([
        d3.min(networkData.nodes, d => d.value),
        d3.max(networkData.nodes, d => d.value)
      ])
      .range(displayMode === 'official' ? ["#8ADDA9", "#1DB954"] : ["#A7B3FF", "#6b7fff"]);
    
    // Define scale for node radius based on value
    const radiusScale = d3.scaleSqrt()
      .domain([
        d3.min(networkData.nodes, d => d.value),
        d3.max(networkData.nodes, d => d.value)
      ])
      .range([5, 20]);
    
    // Define scale for link stroke width based on value
    const linkWidthScale = d3.scaleLinear()
      .domain([
        d3.min(networkData.links, d => d.value),
        d3.max(networkData.links, d => d.value)
      ])
      .range([1, 5]);
    
    // Create a simulation with forces
    const simulation = d3.forceSimulation(networkData.nodes)
      .force("link", d3.forceLink(networkData.links)
        .id(d => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(containerWidth / 2, containerHeight / 2))
      .force("collision", d3.forceCollide().radius(d => radiusScale(d.value) + 5));
    
    // Create links
    const link = graphGroup.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(networkData.links)
      .join("line")
      .attr("stroke-width", d => linkWidthScale(d.value));
    
    // Create nodes
    const node = graphGroup.append("g")
      .selectAll("g")
      .data(networkData.nodes)
      .join("g")
      .call(drag(simulation));
    
    // Add circles to nodes
    node.append("circle")
      .attr("r", d => radiusScale(d.value))
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", displayMode === 'official' ? "#158c3f" : "#4e5dc7")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event, d) => {
        // Show tooltip
        tooltipRef.current
          .style("visibility", "visible")
          .html(`
            <strong>${d.name}</strong><br/>
            Frequency: ${d.value} ${d.value === 1 ? 'interview' : 'interviews'}<br/>
            Connected to ${networkData.links.filter(link => 
              link.source.id === d.id || link.target.id === d.id
            ).length} other themes
          `);
      })
      .on("mousemove", (event) => {
        // Position tooltip near cursor
        tooltipRef.current
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        // Hide tooltip
        tooltipRef.current.style("visibility", "hidden");
      });
    
    // Add labels to nodes
    node.append("text")
      .attr("x", 0)
      .attr("y", d => -radiusScale(d.value) - 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text(d => {
        // Truncate long names
        return d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name;
      })
      .attr("pointer-events", "none")
      .attr("fill", "#333")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("paint-order", "stroke");
    
    // Define zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.25, 5]) // Set min/max zoom scale
      .on("zoom", (event) => {
        // Apply transform to the graph group
        graphGroup.attr("transform", event.transform);
        
        // Update tooltip position
        if (tooltipRef.current && tooltipRef.current.style("visibility") === "visible") {
          const tooltipNode = d3.select(document.querySelector(".tooltip"));
          if (!tooltipNode.empty()) {
            tooltipNode
              .style("top", (event.sourceEvent.pageY - 10) + "px")
              .style("left", (event.sourceEvent.pageX + 10) + "px");
          }
        }
      });
    
    // Apply zoom behavior to SVG
    svg.call(zoom);
    
    // Store zoom reference for external controls
    zoomRef.current = zoom;
    
    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Drag behavior for nodes
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [networkData, loading, error, displayMode]);
  
  // Handle display mode change
  const handleDisplayModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
    }
  };
  
  // Handle threshold change
  const handleThresholdChange = (event, newValue) => {
    setCorrelationThreshold(newValue);
  };
  
  // Handle max node count change
  const handleNodeCountChange = (event) => {
    setMaxNodeCount(event.target.value);
  };
  
  // Zoom control functions
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        zoomRef.current.scaleBy, 1.5
      );
    }
  };
  
  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        zoomRef.current.scaleBy, 0.67
      );
    }
  };
  
  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform, d3.zoomIdentity
      );
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
  
  const hasOfficialThemes = fullData.official.nodes.length > 0;
  const hasCustomThemes = fullData.custom.nodes.length > 0;
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Theme Correlation Network
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This visualization shows how themes are connected based on their co-occurrence in interviews.
          Larger nodes represent more frequent themes, and thicker lines indicate stronger connections.
        </Typography>
        
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
              Roadtrip Nation Themes
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
              AI-identified Themes
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ width: 250 }}>
              <Typography id="correlation-threshold-slider" gutterBottom variant="body2">
                Minimum Co-occurrence: {correlationThreshold}
              </Typography>
              <Slider
                value={correlationThreshold}
                onChange={handleThresholdChange}
                aria-labelledby="correlation-threshold-slider"
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="max-nodes-select-label">Max Themes</InputLabel>
              <Select
                labelId="max-nodes-select-label"
                id="max-nodes-select"
                value={maxNodeCount}
                label="Max Themes"
                onChange={handleNodeCountChange}
              >
                <MenuItem value={20}>20 Themes</MenuItem>
                <MenuItem value={30}>30 Themes</MenuItem>
                <MenuItem value={50}>50 Themes</MenuItem>
                <MenuItem value={100}>100 Themes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
      
      <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: 700 }}>
        {networkData.nodes.length === 0 ? (
          <Typography variant="body1" sx={{ p: 5, color: 'text.secondary', textAlign: 'center' }}>
            No theme connections found with current settings. Try lowering the minimum co-occurrence threshold.
          </Typography>
        ) : (
          <>
            <Box sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              zIndex: 100, 
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '8px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleZoomIn}
                startIcon={<ZoomInIcon />}
              >
                Zoom In
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleZoomOut}
                startIcon={<ZoomOutIcon />}
              >
                Zoom Out
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleResetZoom}
                startIcon={<RestartAltIcon />}
              >
                Reset
              </Button>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                bottom: 10, 
                left: 10, 
                color: 'text.secondary',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              Use mouse wheel to zoom, drag to pan, click and drag nodes to rearrange
            </Typography>
            <svg 
              ref={svgRef} 
              style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab' }}
            ></svg>
          </>
        )}
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {networkData.nodes.length} themes and {networkData.links.length} connections.
          Drag nodes to rearrange the network. Hover over nodes for more information.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ThemeCorrelationNetwork; 