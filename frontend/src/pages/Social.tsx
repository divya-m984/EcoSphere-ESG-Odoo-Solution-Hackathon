import { Grid, Typography, Box } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import SchoolIcon from '@mui/icons-material/School';
import BalanceIcon from '@mui/icons-material/Balance';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderCard from '@/components/PlaceholderCard';
import PlaceholderChart from '@/components/PlaceholderChart';

export default function Social() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Social</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        CSR activities, employee participation and diversity metrics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="CSR Participation Rate"
            value="—"
            subtitle="Approved participants / headcount"
            color="info.main"
            icon={<VolunteerActivismIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Training Completion Rate"
            value="—"
            subtitle="Completed / total training records"
            color="secondary.main"
            icon={<SchoolIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Diversity Index"
            value="—"
            subtitle="Gender balance score (0–100)"
            color="success.main"
            icon={<BalanceIcon />}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PlaceholderChart
            title="CSR Activity Participation"
            subtitle="Approved vs Pending vs Rejected"
            height={260}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlaceholderChart
            title="Diversity Metrics by Department"
            subtitle="Female / Male / Other headcount"
            height={260}
          />
        </Grid>

        <Grid item xs={12}>
          <PlaceholderChart
            title="Training Completion Trend"
            subtitle="Completion rate over time by department"
            height={220}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
