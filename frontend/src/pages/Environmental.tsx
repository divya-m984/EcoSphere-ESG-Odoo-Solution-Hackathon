import { Grid, Typography, Box } from '@mui/material';
import Co2Icon from '@mui/icons-material/Co2';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FactoryIcon from '@mui/icons-material/Factory';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderCard from '@/components/PlaceholderCard';
import PlaceholderChart from '@/components/PlaceholderChart';

export default function Environmental() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Environmental</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Carbon accounting, emission factors and sustainability goals
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Total Emissions (YTD)"
            value="—"
            subtitle="kgCO\u2082e"
            color="error.main"
            icon={<Co2Icon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Active Goals"
            value="—"
            subtitle="Sustainability targets"
            color="success.main"
            icon={<TrackChangesIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Operation Records"
            value="—"
            subtitle="Purchase / Fleet / Manufacturing / Expense"
            color="warning.main"
            icon={<FactoryIcon />}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <PlaceholderChart
            title="Emissions by Department"
            subtitle="kgCO\u2082e per department this period"
            height={280}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PlaceholderChart
            title="Emission Sources"
            subtitle="Breakdown by operation type"
            height={280}
          />
        </Grid>

        <Grid item xs={12}>
          <PlaceholderChart
            title="Goal Progress vs Baseline"
            subtitle="Actual vs target emissions per active goal"
            height={220}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
