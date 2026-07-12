import {
  Box, Typography, Card, CardContent, Grid,
  TextField, Button, Divider, Switch, FormControlLabel,
} from '@mui/material';
import Breadcrumb from '@/components/Breadcrumb';

export default function Settings() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account and notification preferences
      </Typography>

      <Grid container spacing={3}>
        {/* Account */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Account Settings</Typography>
              <Divider sx={{ mb: 2.5 }} />
              <TextField fullWidth label="Display Name"    size="small" sx={{ mb: 2 }} disabled />
              <TextField fullWidth label="Email Address"   size="small" type="email" sx={{ mb: 2 }} disabled />
              <TextField fullWidth label="Current Password" size="small" type="password" sx={{ mb: 2 }} disabled />
              <TextField fullWidth label="New Password"    size="small" type="password" sx={{ mb: 3 }} disabled />
              <Button variant="contained" disabled>Save Changes</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Preferences</Typography>
              <Divider sx={{ mb: 2.5 }} />
              <FormControlLabel
                control={<Switch disabled />}
                label="Email Notifications"
                sx={{ display: 'flex', mb: 1.5 }}
              />
              <FormControlLabel
                control={<Switch disabled />}
                label="In-App Notifications"
                sx={{ display: 'flex', mb: 1.5 }}
              />
              <FormControlLabel
                control={<Switch disabled />}
                label="Dark Mode"
                sx={{ display: 'flex', mb: 3 }}
              />
              <Button variant="outlined" disabled>Save Preferences</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
