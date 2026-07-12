import { Box, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import EcoIcon from '@mui/icons-material/EnergySavingsLeaf';
import { APP_NAME } from '@/utils/constants';

export default function LoginLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Top bar */}
      <Box
        component="header"
        sx={{
          px: 4,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'primary.main',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EcoIcon sx={{ color: 'white', fontSize: 18 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} color="primary.contrastText">
          {APP_NAME}
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.6)" sx={{ ml: 0.5 }}>
          ESG Management Platform
        </Typography>
      </Box>

      {/* Centered content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          &copy; {new Date().getFullYear()} {APP_NAME} &middot; ESG Management Platform
        </Typography>
      </Box>
    </Box>
  );
}
