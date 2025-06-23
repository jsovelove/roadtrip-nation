import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const PasswordProtection = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set your password here - in production, consider using environment variables
  const SITE_PASSWORD = 'roadtrip2024'; // Change this to your desired password

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple password check
    if (password === SITE_PASSWORD) {
      // Store authentication in sessionStorage (clears when browser closes)
      sessionStorage.setItem('isAuthenticated', 'true');
      onAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%',
          textAlign: 'center',
          borderRadius: 3
        }}
      >
        <Box sx={{ mb: 3 }}>
          <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Access Required
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please enter the password to access Roadtrip Nation
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            autoFocus
            disabled={loading}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !password.trim()}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Checking...' : 'Access Site'}
          </Button>
        </form>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          Contact the administrator if you need access
        </Typography>
      </Paper>
    </Container>
  );
};

export default PasswordProtection; 