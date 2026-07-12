import { Box, Typography, Card, CardContent, Avatar, Grid, Chip, Divider } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderCard from '@/components/PlaceholderCard';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Profile</Typography>

      <Grid container spacing={3}>
        {/* User card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '1.75rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {userInitials}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{user?.name ?? '—'}</Typography>
              <Chip
                label={user?.role ?? 'Employee'}
                color="primary"
                size="small"
                sx={{ mt: 1, mb: 2 }}
              />
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">{user?.email ?? '—'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <BadgeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">Department — pending</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <PlaceholderCard
                title="XP Balance"
                value="—"
                subtitle="Total earned XP (ledger sum)"
                color="primary.main"
                icon={<StarIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PlaceholderCard
                title="Badges Earned"
                value="—"
                subtitle="Unlocked achievements"
                color="warning.main"
                icon={<EmojiEventsIcon />}
              />
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Recent Activity</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Activity feed — connects when backend is ready
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
