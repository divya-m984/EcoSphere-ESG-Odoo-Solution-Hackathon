import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { PAGE_TITLES } from '@/utils/constants';

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Page';

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <Link
        component={RouterLink}
        to="/dashboard"
        underline="hover"
        color="text.secondary"
        sx={{ fontSize: '0.82rem' }}
      >
        Home
      </Link>
      <Typography color="text.primary" sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
        {pageTitle}
      </Typography>
    </Breadcrumbs>
  );
}
