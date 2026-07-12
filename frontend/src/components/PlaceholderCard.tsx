import type { ReactNode } from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';

interface PlaceholderCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  color?: string;
  loading?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

export default function PlaceholderCard({
  title,
  value,
  subtitle,
  color = 'primary.main',
  loading = false,
  icon,
  onClick,
}: PlaceholderCardProps) {
  const clickable = Boolean(onClick);

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': clickable ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        } : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography variant="h4" fontWeight={700} color={color}>
                {value ?? '—'}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {loading ? <Skeleton width={120} /> : subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: `${color}18`,
                color,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
