import { Card, CardContent, CardHeader, Box, Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

interface PlaceholderChartProps {
  title: string;
  subtitle?: string;
  height?: number;
}

export default function PlaceholderChart({ title, subtitle, height = 260 }: PlaceholderChartProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        subheader={subtitle}
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box
          sx={{
            height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'grey.200',
            gap: 1.5,
          }}
        >
          <BarChartIcon sx={{ fontSize: 52, color: 'grey.300' }} />
          <Typography variant="body2" color="text.disabled">
            Chart — connects when backend is ready
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
