import { Grid, Typography, Box } from '@mui/material';
import EcoIcon from '@mui/icons-material/EnergySavingsLeaf';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderCard from '@/components/PlaceholderCard';
import PlaceholderChart from '@/components/PlaceholderChart';

const STAT_CARDS = [
  { title: 'Environmental Score', value: '—', subtitle: 'Pending backend data', color: 'success.main',  icon: <EcoIcon /> },
  { title: 'Social Score',         value: '—', subtitle: 'Pending backend data', color: 'info.main',     icon: <GroupsIcon /> },
  { title: 'Governance Score',     value: '—', subtitle: 'Pending backend data', color: 'warning.main',  icon: <AccountBalanceIcon /> },
  { title: 'Total ESG Score',      value: '—', subtitle: 'Org-wide composite',   color: 'primary.main',  icon: <StarIcon /> },
];

export default function Dashboard() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Organization-wide ESG performance overview
      </Typography>

      <Grid container spacing={3}>
        {STAT_CARDS.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <PlaceholderCard {...card} />
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <PlaceholderChart
            title="Carbon Emissions Over Time"
            subtitle="Monthly kgCO\u2082e by department"
            height={280}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PlaceholderChart
            title="ESG Score Breakdown"
            subtitle="E / S / G distribution"
            height={280}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PlaceholderChart
            title="Department Rankings"
            subtitle="Total ESG score by department"
            height={240}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlaceholderChart
            title="Goal Progress"
            subtitle="Active sustainability goals vs targets"
            height={240}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
