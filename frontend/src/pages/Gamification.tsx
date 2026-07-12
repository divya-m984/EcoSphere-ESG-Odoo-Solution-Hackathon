import { Grid, Typography, Box } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderCard from '@/components/PlaceholderCard';
import PlaceholderChart from '@/components/PlaceholderChart';

export default function Gamification() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Gamification</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Challenges, XP, badges, rewards and leaderboards
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Active Challenges"
            value="—"
            subtitle="Currently running challenges"
            color="primary.main"
            icon={<EmojiEventsIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Badges Awarded"
            value="—"
            subtitle="Total badges unlocked org-wide"
            color="warning.main"
            icon={<StarBorderIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <PlaceholderCard
            title="Rewards Redeemed"
            value="—"
            subtitle="Total reward redemptions"
            color="secondary.main"
            icon={<CardGiftcardIcon />}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PlaceholderChart
            title="Individual Leaderboard"
            subtitle="Top employees by XP balance"
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlaceholderChart
            title="Department Leaderboard"
            subtitle="Average XP per department"
            height={300}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <PlaceholderChart
            title="Challenge Participation Trends"
            subtitle="Submissions per challenge over time"
            height={220}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PlaceholderChart
            title="Badge Wall"
            subtitle="Unlocked achievements"
            height={220}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
