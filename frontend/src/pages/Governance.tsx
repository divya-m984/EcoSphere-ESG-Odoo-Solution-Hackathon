import { Grid, Typography, Box } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderCard from '@/components/PlaceholderCard';
import PlaceholderChart from '@/components/PlaceholderChart';

export default function Governance() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Governance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Policies, audits and compliance tracking
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Policy Acknowledgement Rate"
            value="—"
            subtitle="Acknowledged / active employees"
            color="primary.main"
            icon={<VerifiedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Open Compliance Issues"
            value="—"
            subtitle="Active unresolved issues"
            color="error.main"
            icon={<ReportProblemIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Audits This Period"
            value="—"
            subtitle="Planned / In Progress / Completed"
            color="warning.main"
            icon={<GavelIcon />}
          />
        </Grid>

        <Grid item xs={12} md={7}>
          <PlaceholderChart
            title="Compliance Issues Over Time"
            subtitle="Open vs Resolved by month"
            height={260}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <PlaceholderChart
            title="Issue Severity Breakdown"
            subtitle="Critical / High / Medium / Low"
            height={260}
          />
        </Grid>

        <Grid item xs={12}>
          <PlaceholderChart
            title="Policy Acknowledgement Progress"
            subtitle="Per-policy acknowledgement rate across departments"
            height={220}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
