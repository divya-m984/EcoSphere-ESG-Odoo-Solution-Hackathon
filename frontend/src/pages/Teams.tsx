import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  Grid,
  Button,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  department: string;
  membersCount: number;
  activeChallenge: string;
  totalXp: number;
}

const INITIAL_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Green Warriors',
    department: 'Engineering',
    membersCount: 8,
    activeChallenge: 'Reduce Paper Usage 50%',
    totalXp: 4500,
  },
  {
    id: '2',
    name: 'Eco Commuters',
    department: 'Operations',
    membersCount: 12,
    activeChallenge: 'Eco-Friendly Commute',
    totalXp: 8200,
  },
  {
    id: '3',
    name: 'Zero Waste Council',
    department: 'Human Resources',
    membersCount: 5,
    activeChallenge: 'Zero Waste Week 2024',
    totalXp: 3100,
  },
];

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/departments/teams')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setTeams(res.data);
        } else {
          setTeams(INITIAL_TEAMS);
        }
      })
      .catch(() => {
        setTeams(INITIAL_TEAMS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Top Breadcrumbs & Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Typography color="text.primary">Teams</Typography>
        </Breadcrumbs>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ borderRadius: '8px', px: 3, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          New Team
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Teams
      </Typography>

      <Grid container spacing={3}>
        {teams.map((team) => (
          <Grid item xs={12} sm={6} md={4} key={team.id}>
            <Card
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>
                  <GroupsIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {team.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Department: {team.department}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3, flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Active Challenge:
                </Typography>
                <Chip
                  label={team.activeChallenge}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: '6px', fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Members
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {team.membersCount} employees
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Total Contribution
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="warning.main">
                    {team.totalXp} XP
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
