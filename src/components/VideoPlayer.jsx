import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, Card, CardContent, Fade, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CloseIcon from '@mui/icons-material/Close';

const VideoPlayer = forwardRef(({ videoUrl, chapterMarkers = [], noiseSegment = null }, ref) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTooltip, setShowTooltip] = useState(null);
  const [showContextCard, setShowContextCard] = useState(false);
  const [noiseContext, setNoiseContext] = useState(null);
  const [hasShownContextCard, setHasShownContextCard] = useState(false);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const contextCardTimeoutRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    seekToTime: (timeString) => {
      if (videoRef.current) {
        const timeInSeconds = convertTimestampToSeconds(timeString);
        videoRef.current.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
        
        // Optionally start playing when seeking
        if (!playing) {
          videoRef.current.play();
          setPlaying(true);
        }
      }
    },
    getCurrentTime: () => currentTime,
    getDuration: () => duration
  }));

  // Convert timestamp string (HH:MM:SS or MM:SS) to seconds
  const convertTimestampToSeconds = (timestamp) => {
    if (!timestamp) return 0;
    
    // Handle potential decimal points by splitting first
    const timestampWithoutMilliseconds = timestamp.split('.')[0];
    
    // Parse the time parts
    const parts = timestampWithoutMilliseconds.split(':').map(part => parseInt(part, 10));
    
    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1 && !isNaN(parts[0])) {
      // SS format
      return parts[0];
    }
    
    console.warn('Invalid timestamp format:', timestamp);
    return 0;
  };

  // Calculate segment ranges with start and end times
  const getSegmentRanges = () => {
    if (!chapterMarkers || chapterMarkers.length === 0) return [];
    
    return chapterMarkers.map((marker, index) => {
      const startTime = convertTimestampToSeconds(marker.timestamp);
      
      // End time is either the start of the next marker or the end of the video
      const endTime = index < chapterMarkers.length - 1
        ? convertTimestampToSeconds(chapterMarkers[index + 1].timestamp)
        : duration;
      
      return {
        ...marker,
        startTime,
        endTime,
        startPosition: (startTime / duration) * 100,
        endPosition: (endTime / duration) * 100,
        width: ((endTime - startTime) / duration) * 100
      };
    });
  };

  // Find the noise segment (either from integrated chapters or separate noise segment)
  const getNoiseSegment = () => {
    // First check if there's a separate noise segment passed as prop
    if (noiseSegment) {
      const startTime = convertTimestampToSeconds(noiseSegment.timestamp);
      // Since separate noise segments don't have a defined end, use 60 seconds by default
      const endTime = startTime + 60; 
      
      return {
        ...noiseSegment,
        isNoiseSegment: true,
        startTime,
        endTime,
        startPosition: (startTime / duration) * 100,
        endPosition: (endTime / duration) * 100,
        width: ((endTime - startTime) / duration) * 100
      };
    }
    
    // Otherwise, look for a noise segment in the chapter markers
    const segments = getSegmentRanges();
    return segments.find(segment => segment.isNoiseSegment);
  };

  // Show context card 30 seconds before noise segment
  useEffect(() => {
    if (!playing || hasShownContextCard) return;
    
    const noiseSegmentData = getNoiseSegment();
    if (!noiseSegmentData || !noiseSegmentData.contextCard) return;
    
    const timeBeforeNoise = noiseSegmentData.startTime - 30; // 30 seconds before
    
    // Clear any existing timeout
    if (contextCardTimeoutRef.current) {
      clearTimeout(contextCardTimeoutRef.current);
    }
    
    // If we're within 30 seconds of the noise segment and haven't shown the card yet
    if (currentTime >= timeBeforeNoise && currentTime < noiseSegmentData.startTime && !hasShownContextCard) {
      setNoiseContext(noiseSegmentData.contextCard);
      setShowContextCard(true);
      setHasShownContextCard(true);
    } 
    // If we're more than 30 seconds before the noise segment, set up a timeout
    else if (currentTime < timeBeforeNoise && !hasShownContextCard) {
      const timeToWait = (timeBeforeNoise - currentTime) * 1000;
      contextCardTimeoutRef.current = setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          setNoiseContext(noiseSegmentData.contextCard);
          setShowContextCard(true);
          setHasShownContextCard(true);
        }
      }, timeToWait);
    }
    
    return () => {
      if (contextCardTimeoutRef.current) {
        clearTimeout(contextCardTimeoutRef.current);
      }
    };
  }, [currentTime, playing, hasShownContextCard, chapterMarkers, noiseSegment]);

  // Reset context card when video is seeked or restarted
  useEffect(() => {
    if (currentTime < 1) {
      setHasShownContextCard(false);
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const seekTo = (e) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const seekPosition = (offsetX / rect.width) * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = seekPosition;
      setCurrentTime(seekPosition);
    }
  };

  const handleChapterClick = (timeInSeconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
      if (!playing) {
        videoRef.current.play();
        setPlaying(true);
      }
    }
  };

  const showMarkerTooltip = (markerId) => {
    setShowTooltip(markerId);
  };

  const hideMarkerTooltip = () => {
    setShowTooltip(null);
  };

  const closeContextCard = () => {
    setShowContextCard(false);
  };

  const segmentRanges = duration > 0 ? getSegmentRanges() : [];
  const noiseSegmentData = getNoiseSegment();

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <video
        ref={videoRef}
        src={videoUrl}
        width="100%"
        height="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        style={{ cursor: 'pointer' }}
      />
      
      {showContextCard && noiseContext && (
        <Fade in={showContextCard}>
          <Card 
            sx={{ 
              position: 'absolute', 
              bottom: '70px', // Position above the controls
              right: '20px',
              zIndex: 10,
              maxWidth: '350px',
              boxShadow: 5
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" gutterBottom>
                  Context
                </Typography>
                <IconButton size="small" onClick={closeContextCard}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body1">
                {noiseContext}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                Noise segment coming up in {Math.max(0, Math.floor(noiseSegmentData?.startTime - currentTime))} seconds
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      )}
      
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          color: 'white',
          padding: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <IconButton color="inherit" onClick={togglePlay}>
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        
        <IconButton color="inherit" onClick={toggleMute}>
          {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        
        <Typography variant="body2" sx={{ mx: 1 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
        
        <Box 
          ref={progressBarRef}
          sx={{ 
            flexGrow: 1, 
            height: '10px', 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            cursor: 'pointer',
            borderRadius: '2px',
            mx: 1,
            position: 'relative'
          }}
          onClick={seekTo}
        >
          {/* Segment highlight areas */}
          {segmentRanges.map((segment, index) => (
            segment.isNoiseSegment && (
              <Box
                key={`segment-${index}`}
                sx={{
                  position: 'absolute',
                  left: `${segment.startPosition}%`,
                  width: `${segment.width}%`,
                  height: '100%',
                  backgroundColor: 'rgba(255, 99, 71, 0.3)', // Transparent red for noise segment
                  zIndex: 1,
                  borderRadius: '2px'
                }}
              />
            )
          ))}
          
          {/* Separate noise segment highlight */}
          {noiseSegment && !segmentRanges.some(s => s.isNoiseSegment) && noiseSegmentData && (
            <Box
              sx={{
                position: 'absolute',
                left: `${noiseSegmentData.startPosition}%`,
                width: `${noiseSegmentData.width}%`,
                height: '100%',
                backgroundColor: 'rgba(255, 99, 71, 0.3)', // Transparent red for noise segment
                zIndex: 1,
                borderRadius: '2px'
              }}
            />
          )}
          
          {/* Progress bar */}
          <Box 
            sx={{ 
              width: `${(currentTime / duration) * 100}%`, 
              height: '100%', 
              backgroundColor: 'primary.main',
              borderRadius: '2px',
              position: 'relative',
              zIndex: 2
            }} 
          />
          
          {/* Chapter markers */}
          {segmentRanges.map((segment, index) => (
            <Tooltip
              key={`marker-${index}`}
              title={segment.title}
              open={showTooltip === index}
              placement="top"
              arrow
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${segment.startPosition}%`,
                  top: '-5px',
                  width: '3px',
                  height: '20px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  zIndex: 3,
                  '&:hover': {
                    backgroundColor: 'secondary.main',
                    width: '5px'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChapterClick(segment.startTime);
                }}
                onMouseEnter={() => showMarkerTooltip(index)}
                onMouseLeave={hideMarkerTooltip}
              />
            </Tooltip>
          ))}
          
          {/* Separate noise segment marker */}
          {noiseSegment && !segmentRanges.some(s => s.isNoiseSegment) && noiseSegmentData && (
            <Tooltip
              title={noiseSegmentData.title || "Noise Segment"}
              open={showTooltip === "noise"}
              placement="top"
              arrow
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${noiseSegmentData.startPosition}%`,
                  top: '-5px',
                  width: '3px',
                  height: '20px',
                  backgroundColor: 'secondary.main',
                  cursor: 'pointer',
                  zIndex: 3,
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    width: '5px'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChapterClick(noiseSegmentData.startTime);
                }}
                onMouseEnter={() => showMarkerTooltip("noise")}
                onMouseLeave={hideMarkerTooltip}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default VideoPlayer; 