import {
  Box, Typography, Grid, Card, CardContent, Stack,
  TextField, MenuItem, Button, Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import Breadcrumb from '@/components/Breadcrumb';
import PlaceholderChart from '@/components/PlaceholderChart';

const REPORT_TYPES = [
  'Environmental Report',
  'Social Report',
  'Governance Report',
  'ESG Summary Report',
];

export default function Reports() {
  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>Reports</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate and export ESG reports with custom filters
      </Typography>

      {/* Filter panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="h6" fontWeight={600}>Report Filters</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth label="Report Type" defaultValue="" size="small">
                <MenuItem value="">All Reports</MenuItem>
                {REPORT_TYPES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth label="Department" defaultValue="" size="small">
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem disabled value="ph">— connect backend —</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth label="ESG Category" defaultValue="" size="small">
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="E">Environmental</MenuItem>
                <MenuItem value="S">Social</MenuItem>
                <MenuItem value="G">Governance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth label="Date From" type="date" size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth label="Date To" type="date" size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Employee" defaultValue="" size="small">
                <MenuItem value="">All Employees</MenuItem>
                <MenuItem disabled value="ph">— connect backend —</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Challenge" defaultValue="" size="small">
                <MenuItem value="">All Challenges</MenuItem>
                <MenuItem disabled value="ph">— connect backend —</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
            <Button variant="contained" startIcon={<DownloadIcon />} disabled>
              Export CSV
            </Button>
            <Button variant="outlined" disabled>Export PDF</Button>
            <Button variant="outlined" disabled>Export Excel</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Report previews */}
      <Grid container spacing={3}>
        {REPORT_TYPES.map((r) => (
          <Grid item xs={12} md={6} key={r}>
            <PlaceholderChart title={r} subtitle="Data loads when backend is connected" height={200} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
