import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { ROUTES } from '@/utils/constants';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.default',
        p: 4,
        textAlign: 'center',
      }}
    >
      <SearchOffIcon sx={{ fontSize: 80, color: 'grey.300' }} />
      <Typography variant="h2" fontWeight={700} color="text.primary">
        404
      </Typography>
      <Typography variant="h5" color="text.secondary">
        Page not found
      </Typography>
      <Typography variant="body2" color="text.disabled" maxWidth={400}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate(ROUTES.DASHBOARD)} sx={{ mt: 1 }}>
        Back to Dashboard
      </Button>
    </Box>
  );
}
