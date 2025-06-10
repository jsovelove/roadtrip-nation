import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import * as d3 from 'd3';
import { getAllLeaders } from '../services/leaderService';

const ThemesBubbleChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [themeData, setThemeData] = useState({ official: [], custom: [] });
  const [displayMode, setDisplayMode] = useState('official'); // 'official' or 'custom'
  const svgRef = useRef(null);
  
  useEffect(() => {
    const fetchThemeData = async () => {
      try {
        setLoading(true);
        const leaders = await getAllLeaders();
        
        // Count theme frequencies across all default analysis versions
        const officialThemes = {};
        const customThemes = {};
        
        leaders.forEach(leader => {
          // Find the default analysis version
          const defaultVersion = leader.analysisVersions?.find(
            version => version.versionId === leader.latestAnalysisVersion
          );
          
          if (!defaultVersion) return;
          
          // Process chapter markers
          defaultVersion.chapterMarkers?.forEach(marker => {
            // Process official themes
            marker.themes?.forEach(theme => {
              officialThemes[theme] = (officialThemes[theme] || 0) + 1;
            });
            
            // Process custom themes
            marker.customThemes?.forEach(theme => {
              customThemes[theme] = (customThemes[theme] || 0) + 1;
            });
          });
          
          // Process noise segment if it exists separately
          if (defaultVersion.noiseSegment) {
            defaultVersion.noiseSegment.themes?.forEach(theme => {
              officialThemes[theme] = (officialThemes[theme] || 0) + 1;
            });
            
            defaultVersion.noiseSegment.customThemes?.forEach(theme => {
              customThemes[theme] = (customThemes[theme] || 0) + 1;
            });
          }
        });
        
        // Convert to array format for D3
        const officialThemesArray = Object.entries(officialThemes).map(([name, value]) => ({
          name,
          value,
          type: 'official'
        }));
        
        const customThemesArray = Object.entries(customThemes).map(([name, value]) => ({
          name,
          value,
          type: 'custom'
        }));
        
        setThemeData({
          official: officialThemesArray,
          custom: customThemesArray
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching theme data:', err);
        setError('Failed to load theme data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchThemeData();
  }, []);
  
  useEffect(() => {
    if (loading || error) return;
    
    // Select data based on display mode
    const data = displayMode === 'official' ? themeData.official : themeData.custom;
    
    if (data.length === 0) return;
    
    // Even larger dimensions for better spacing
    const width = 2200;
    const height = 1800;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 16px sans-serif;");
    
    // Create a pack layout with much larger padding
    const pack = d3.pack()
      .size([width - 200, height - 200])
      .padding(80); // Dramatically increased padding to prevent overlaps
    
    // Create the hierarchy from data with greatly amplified values
    const root = d3.hierarchy({ children: data })
      // Use exponential scaling to make frequency differences more dramatic
      .sum(d => {
        // Apply a power scale to create more dramatic size differences
        // Square the value and add a small minimum to ensure small values are still visible
        return Math.pow(d.value, 1.8) * 5 + 15;
      })
      .sort((a, b) => b.value - a.value);
    
    // Generate the pack layout
    const nodes = pack(root).leaves();
    
    // Create a group for each bubble
    const node = svg.selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);
    
    // Use color based on display mode
    const fillColor = displayMode === 'official' ? '#1DB954' : '#6b7fff';
    const strokeColor = displayMode === 'official' ? '#158c3f' : '#4e5dc7';
    
    // Add circles for each bubble with adjusted sizing to prevent overlap
    node.append("circle")
      .attr("r", d => Math.max(d.r * 0.85, 45)) // Slightly reduce radius but keep a smaller minimum size
      .attr("fill", fillColor)
      .attr("fill-opacity", 0.9)
      .attr("stroke", strokeColor)
      .attr("stroke-width", 3);
    
    // Add text labels for all bubbles
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => {
        // Larger baseline font sizes, adjusted for the slightly smaller bubbles
        const nameLength = d.data.name.length;
        const radius = Math.max(d.r * 0.85, 45);
        const baseFontSize = radius / 3.5;
        
        // Less aggressive scaling down for longer text
        let fontSize = baseFontSize;
        if (nameLength > 10) fontSize *= 0.95;
        if (nameLength > 15) fontSize *= 0.9;
        
        // Higher minimum font size
        return `${Math.min(Math.max(fontSize, 14), 40)}px`;
      })
      .each(function(d) {
        const text = d3.select(this);
        const name = d.data.name;
        const radius = Math.max(d.r * 0.85, 45); // Use the actual displayed radius
        
        // For smaller bubbles, show more text
        if (radius < 60) {
          if (name.length > 10) {
            text.text(name.substring(0, 6) + "...");
          } else {
            text.text(name);
          }
          return;
        }
        
        // For medium bubbles, show more text
        if (radius < 100) {
          if (name.length > 20) {
            text.text(name.substring(0, 16) + "...");
          } else {
            text.text(name);
          }
          return;
        }
        
        // For larger bubbles, use multiline text if needed
        if (name.length > 20) {
          // Split into multiple lines
          const words = name.split(/\s+/);
          let lines = [];
          let currentLine = [];
          let currentLength = 0;
          
          words.forEach(word => {
            if (currentLength + word.length > 20) {
              lines.push(currentLine.join(' '));
              currentLine = [word];
              currentLength = word.length;
            } else {
              currentLine.push(word);
              currentLength += word.length + 1;
            }
          });
          
          if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
          }
          
          // Allow up to 3 lines for very large bubbles
          const maxLines = radius > 150 ? 3 : 2;
          
          if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            lines[maxLines-1] += '...';
          }
          
          // Add each line as a tspan with improved spacing
          text.text(null); // Clear existing text
          lines.forEach((line, i) => {
            text.append("tspan")
              .attr("x", 0)
              .attr("y", 0)
              .attr("dy", `${i * 1.3 - (lines.length - 1) * 0.65}em`)
              .text(line);
          });
        } else {
          // For shorter text, just display it directly
          text.text(name);
        }
      });
    
    // Add tooltips using title elements
    node.append("title")
      .text(d => {
        // Extract the original value from the data
        const originalValue = d.data.value;
        return `${d.data.name}\nFrequency: ${originalValue} interview${originalValue !== 1 ? 's' : ''}\nType: ${displayMode === 'official' ? 'Roadtrip Nation Theme' : 'AI-identified Theme'}`;
      });
      
    // Add theme count text
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "#666")
      .text(`Showing ${data.length} ${displayMode === 'official' ? 'Roadtrip Nation' : 'AI-identified'} themes`);
      
  }, [loading, error, themeData, displayMode]);
  
  const handleDisplayModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
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
  
  const hasOfficialThemes = themeData.official.length > 0;
  const hasCustomThemes = themeData.custom.length > 0;
  
  return (
    <Paper sx={{ p: 3, mb: 4, overflow: 'hidden' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Theme Frequency Visualization
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This bubble chart shows the frequency of themes across all interviews. 
          Bubble size indicates how frequently each theme appears.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={displayMode}
            exclusive
            onChange={handleDisplayModeChange}
            aria-label="theme display mode"
            color="primary"
          >
            <ToggleButton 
              value="official" 
              disabled={!hasOfficialThemes}
              sx={{ 
                px: 3, 
                py: 1.5,
                borderRadius: '8px 0 0 8px',
                '&.Mui-selected': { 
                  backgroundColor: '#1DB954',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#158c3f',
                  }
                }
              }}
            >
              Roadtrip Nation Themes ({themeData.official.length})
            </ToggleButton>
            <ToggleButton 
              value="custom" 
              disabled={!hasCustomThemes}
              sx={{ 
                px: 3, 
                py: 1.5,
                borderRadius: '0 8px 8px 0',
                '&.Mui-selected': { 
                  backgroundColor: '#6b7fff',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#4e5dc7',
                  }
                }
              }}
            >
              AI-identified Themes ({themeData.custom.length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        overflow: 'auto',
        maxHeight: '1000px'
      }}>
        {((displayMode === 'official' && !hasOfficialThemes) || 
          (displayMode === 'custom' && !hasCustomThemes)) ? (
          <Typography variant="body1" sx={{ p: 5, color: 'text.secondary' }}>
            No {displayMode === 'official' ? 'Roadtrip Nation' : 'AI-identified'} themes available
          </Typography>
        ) : (
          <svg ref={svgRef} />
        )}
      </Box>
    </Paper>
  );
};

export default ThemesBubbleChart; 