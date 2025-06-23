import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLeader, validateURL } from '../services/leaderService';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  VideoLibrary as VideoIcon,
  Description as TranscriptIcon,
  Photo as PhotoIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

const AddLeader = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    videoURL: '',
    transcriptURL: '',
    thumbnailURL: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [validationState, setValidationState] = useState({
    videoURL: null,
    transcriptURL: null,
    thumbnailURL: null
  });
  const [validating, setValidating] = useState({
    videoURL: false,
    transcriptURL: false,
    thumbnailURL: false
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  const steps = [
    {
      label: 'Basic Information',
      description: 'Enter the leader\'s name'
    },
    {
      label: 'Media Links',
      description: 'Add video, transcript, and photo URLs'
    },
    {
      label: 'Review & Save',
      description: 'Review the information and create the leader profile'
    }
  ];

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation state when URL changes
    if (['videoURL', 'transcriptURL', 'thumbnailURL'].includes(field)) {
      setValidationState(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    // Clear any previous errors
    setError(null);
  };

  const validateField = async (field) => {
    const url = formData[field];
    if (!url) return;

    setValidating(prev => ({ ...prev, [field]: true }));
    
    try {
      const isValid = await validateURL(url);
      setValidationState(prev => ({
        ...prev,
        [field]: isValid
      }));
    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        [field]: false
      }));
    } finally {
      setValidating(prev => ({ ...prev, [field]: false }));
    }
  };

  const getValidationIcon = (field) => {
    if (validating[field]) {
      return <CircularProgress size={20} />;
    }
    
    if (validationState[field] === true) {
      return <CheckIcon color="success" />;
    } else if (validationState[field] === false) {
      return <ErrorIcon color="error" />;
    }
    
    return null;
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return formData.name.trim();
      case 1:
        return formData.videoURL && formData.transcriptURL;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.videoURL || !formData.transcriptURL) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const leaderId = await createLeader(formData);
      setSuccess(true);
      
      // Navigate to the new leader's page after a short delay
      setTimeout(() => {
        navigate(`/leaders/${leaderId}`);
      }, 2000);
    } catch (err) {
      console.error('Error creating leader:', err);
      setError(err.message || 'Failed to create leader. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Leader Created Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {formData.name} has been added to the leaders database.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to their profile...
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Add New Leader
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom sx={{ mb: 4 }}>
        Create a new leader profile for interview analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Basic Information */}
            <Step>
              <StepLabel>
                <Typography variant="h6">{steps[0].label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary" gutterBottom>
                  {steps[0].description}
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Leader Name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      required
                      placeholder="e.g., Jane Smith"
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      helperText="This will be used to create the leader's unique ID"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(0)}
                    sx={{ mr: 1 }}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Media Links */}
            <Step>
              <StepLabel>
                <Typography variant="h6">{steps[1].label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary" gutterBottom>
                  {steps[1].description}
                </Typography>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Video URL"
                      value={formData.videoURL}
                      onChange={handleInputChange('videoURL')}
                      onBlur={() => validateField('videoURL')}
                      required
                      placeholder="https://example.com/video.mp4"
                      InputProps={{
                        startAdornment: <VideoIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        endAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getValidationIcon('videoURL')}
                            <Tooltip title="Validate URL">
                              <IconButton
                                size="small"
                                onClick={() => validateField('videoURL')}
                                disabled={!formData.videoURL || validating.videoURL}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }}
                      helperText="Direct link to the interview video file"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Transcript URL"
                      value={formData.transcriptURL}
                      onChange={handleInputChange('transcriptURL')}
                      onBlur={() => validateField('transcriptURL')}
                      required
                      placeholder="https://example.com/transcript.txt"
                      InputProps={{
                        startAdornment: <TranscriptIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        endAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getValidationIcon('transcriptURL')}
                            <Tooltip title="Validate URL">
                              <IconButton
                                size="small"
                                onClick={() => validateField('transcriptURL')}
                                disabled={!formData.transcriptURL || validating.transcriptURL}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }}
                      helperText="Direct link to the interview transcript file"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Photo URL (Optional)"
                      value={formData.thumbnailURL}
                      onChange={handleInputChange('thumbnailURL')}
                      onBlur={() => validateField('thumbnailURL')}
                      placeholder="https://example.com/photo.jpg"
                      InputProps={{
                        startAdornment: <PhotoIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        endAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getValidationIcon('thumbnailURL')}
                            {formData.thumbnailURL && (
                              <Tooltip title="Validate URL">
                                <IconButton
                                  size="small"
                                  onClick={() => validateField('thumbnailURL')}
                                  disabled={validating.thumbnailURL}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )
                      }}
                      helperText="Direct link to the leader's photo (JPG, PNG, etc.)"
                    />
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> All URLs should be direct links to the files. 
                    The system will validate these links before saving.
                  </Typography>
                </Alert>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(1)}
                    sx={{ mr: 1 }}
                  >
                    Continue
                  </Button>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Review & Save */}
            <Step>
              <StepLabel>
                <Typography variant="h6">{steps[2].label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary" gutterBottom>
                  {steps[2].description}
                </Typography>

                <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar
                        src={formData.thumbnailURL}
                        sx={{ width: 80, height: 80 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6">{formData.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>

                <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? 'Creating Leader...' : 'Create Leader'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handlePreview}
                    startIcon={<PreviewIcon />}
                  >
                    Preview
                  </Button>
                  <Button onClick={handleBack} disabled={loading}>
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="sm" fullWidth>
        <DialogTitle>Leader Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              src={formData.thumbnailURL}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            >
              <PersonIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {formData.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Document ID: {formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Media Links:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              <strong>Video:</strong> {formData.videoURL || 'Not provided'}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              <strong>Transcript:</strong> {formData.transcriptURL || 'Not provided'}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              <strong>Photo:</strong> {formData.thumbnailURL || 'Not provided'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddLeader; 