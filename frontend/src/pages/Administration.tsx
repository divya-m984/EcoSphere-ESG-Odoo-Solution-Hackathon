import type { ReactNode } from 'react';
import {
  Box, Typography, Grid, Card, CardContent,
  Switch, FormControlLabel, Divider, Button,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CategoryIcon from '@mui/icons-material/Category';
import Breadcrumb from '@/components/Breadcrumb';

function ConfigCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {icon}
          <Typography variant="h6" fontWeight={600}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

const NOTIFICATION_EVENTS = [
  'Compliance Issue Raised',
  'Participation Decision',
  'Policy Ack Reminder',
  'Badge Unlocked',
];

export default function Administration() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Administration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        System configuration and platform settings
      </Typography>

      <Grid container spacing={3}>
        {/* ESG Configuration */}
        <Grid item xs={12} md={6}>
          <ConfigCard title="ESG Configuration" icon={<TuneIcon color="primary" />}>
            <FormControlLabel
              control={<Switch disabled />}
              label="Auto Emission Calculation"
              sx={{ display: 'flex', mb: 1 }}
            />
            <FormControlLabel
              control={<Switch disabled />}
              label="Evidence Requirement"
              sx={{ display: 'flex', mb: 1 }}
            />
            <FormControlLabel
              control={<Switch disabled />}
              label="Badge Auto-Award"
              sx={{ display: 'flex', mb: 2.5 }}
            />
            <Button variant="outlined" size="small" disabled>Save Configuration</Button>
          </ConfigCard>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <ConfigCard title="Notification Settings" icon={<NotificationsIcon color="primary" />}>
            {NOTIFICATION_EVENTS.map((event) => (
              <Box
                key={event}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
              >
                <Typography variant="body2">{event}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControlLabel
                    control={<Switch size="small" disabled />}
                    label="In-App"
                    labelPlacement="start"
                    sx={{ m: 0, gap: 0.5 }}
                  />
                  <FormControlLabel
                    control={<Switch size="small" disabled />}
                    label="Email"
                    labelPlacement="start"
                    sx={{ m: 0, gap: 0.5 }}
                  />
                </Box>
              </Box>
            ))}
          </ConfigCard>
        </Grid>

        {/* Category Management */}
        <Grid item xs={12} md={6}>
          <ConfigCard title="Category Management" icon={<CategoryIcon color="primary" />}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage shared categories used by CSR Activities and Challenges.
            </Typography>
            <Button variant="outlined" size="small" disabled>Manage Categories</Button>
          </ConfigCard>
        </Grid>
      </Grid>
    </Box>
  );
}
