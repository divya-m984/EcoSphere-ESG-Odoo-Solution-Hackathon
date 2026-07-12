import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import EcoIcon from '@mui/icons-material/EnergySavingsLeaf';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import Breadcrumb from '@/components/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'Employee';

  // ── Admin States ────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);

  // ── Employee States ─────────────────────────────────────────────────────────
  const [empXp, setEmpXp] = useState<number>(2000);
  const [empLoading, setEmpLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`completed_tasks_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Load Admin/Manager data
  useEffect(() => {
    if (!isEmployee) {
      setAdminLoading(true);
      Promise.all([
        api.get('/dashboard/carbon/summary'),
        api.get('/dashboard/carbon/trend'),
        api.get('/dashboard/carbon/top-sources').catch(() => ({ data: { sources: [] } })),
        api.get('/dashboard/carbon/top-departments').catch(() => ({ data: { departments: [] } })),
      ])
        .then(([summaryRes, trendRes, sourcesRes, deptsRes]) => {
          setSummary(summaryRes.data);
          setTrend(trendRes.data.series || []);
          setSources(sourcesRes.data.sources || []);
          setDepartments(deptsRes.data.departments || []);
        })
        .catch((err) => console.error('Error fetching admin dashboard:', err))
        .finally(() => setAdminLoading(false));
    }
  }, [isEmployee]);

  // Load Employee data
  useEffect(() => {
    if (isEmployee) {
      setEmpLoading(true);
      Promise.all([
        api.get('/rewards/balance'),
        api.get('/dashboard/carbon/summary').catch(() => null),
      ])
        .then(([balRes, summaryRes]) => {
          if (balRes.data && typeof balRes.data.balance === 'number') {
            setEmpXp(balRes.data.balance);
          }
          if (summaryRes?.data) {
            setSummary(summaryRes.data);
          }
        })
        .catch((err) => console.error('Error fetching employee dashboard:', err))
        .finally(() => setEmpLoading(false));
    }
  }, [isEmployee]);

  const handleTaskToggle = (taskId: string, xpPoints: number) => {
    const updated = { ...completedTasks, [taskId]: !completedTasks[taskId] };
    setCompletedTasks(updated);
    localStorage.setItem(`completed_tasks_${user?.id}`, JSON.stringify(updated));

    // Optimistically update XP balance
    const delta = updated[taskId] ? xpPoints : -xpPoints;
    setEmpXp((prev) => prev + delta);
  };

  const getPercentageChange = () => {
    if (!summary) return null;
    const current = summary.totalEmissionKgCo2e ?? summary.commuteEmissionKgCo2e ?? 0;
    const prev = summary.previousPeriodTotalEmissionKgCo2e ?? summary.previousPeriodEmissionKgCo2e ?? 0;
    if (prev === 0) return null;
    const change = ((current - prev) / prev) * 100;
    return change;
  };

  // ── Employee Dashboard Layout ───────────────────────────────────────────────
  if (isEmployee) {
    const dailyCommuteEmission = summary?.commuteEmissionKgCo2e ?? 14.2;
    const level = Math.floor(empXp / 150) + 1;
    const levelProgress = ((empXp % 150) / 150) * 100;

    const dailyActions = [
      { id: 'commute', title: 'Eco-Friendly Commute', xp: 50, desc: 'Logged carpool, walk, or public transit today' },
      { id: 'lunch', title: 'Zero-Waste Lunch', xp: 30, desc: 'Used reusable containers, no single-use plastics' },
      { id: 'peer', title: 'Diversity Peer Review', xp: 40, desc: 'Provided constructive feedback on ESG initiatives' },
    ];

    if (empLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress color="success" />
        </Box>
      );
    }

    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', pb: 4 }}>
        {/* Morning Greeting Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={850} sx={{ color: '#174F35', letterSpacing: '-0.03em', mb: 1 }}>
            Good Morning, {user?.name || 'Alex Green'}
          </Typography>
          <Card
            variant="outlined"
            sx={{
              background: 'linear-gradient(100deg, #E8F5E9 0%, #F1F8E9 100%)',
              borderColor: '#C8E6C9',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ py: '16px !important' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: '#A5D6A7', color: '#1B5E20', display: 'flex' }}>
                  <EcoIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={700} sx={{ color: '#1B5E20' }}>
                    Your contribution has saved {dailyCommuteEmission.toFixed(1)}kg of CO2 this week.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#388E3C' }}>
                    Keep up the momentum! You're currently performing in the top tier of your department.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Grid container spacing={3.5}>
          {/* Daily Action Plan */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#D9E9DD', height: '100%' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB', bgcolor: '#F9FAF9' }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#1b4d3e' }}>
                  My Daily Actions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete these tasks daily to log your impact and boost your level.
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  {dailyActions.map((action) => {
                    const isDone = !!completedTasks[action.id];
                    return (
                      <Box
                        key={action.id}
                        onClick={() => handleTaskToggle(action.id, action.xp)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2.25,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: isDone ? '#A5D6A7' : '#E5E7EB',
                          bgcolor: isDone ? '#F1F8E9' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#81C784',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          {isDone ? (
                            <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 24 }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ color: '#9CA3AF', fontSize: 24 }} />
                          )}
                          <Box>
                            <Typography
                              fontWeight={800}
                              sx={{
                                color: isDone ? '#2E7D32' : 'text.primary',
                                textDecoration: isDone ? 'line-through' : 'none',
                              }}
                            >
                              {action.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.desc}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={`+${action.xp} XP`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: isDone ? '#E8F5E9' : '#F3F4F6',
                            color: isDone ? '#2E7D32' : 'text.secondary',
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* User Standings Card */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  borderColor: '#FFE0B2',
                  background: 'linear-gradient(135deg, #FFF8E1 0%, #FFFDE7 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background medal decoration */}
                <EmojiEventsIcon
                  sx={{
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    fontSize: 160,
                    color: '#FFF59D',
                    opacity: 0.4,
                    zIndex: 0,
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <WorkspacePremiumIcon sx={{ color: '#FFB300' }} />
                    <Typography variant="subtitle2" fontWeight={850} color="#B78103" sx={{ letterSpacing: '0.05em' }}>
                      YOUR STANDING
                    </Typography>
                  </Stack>

                  <Typography variant="h4" fontWeight={850} color="#7F5F00" sx={{ mb: 1.5 }}>
                    Top 5%
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    You have unlocked <strong>{level} badges</strong> and maintain a strong standing in the leaderboard. Keep it up!
                  </Typography>

                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={750} color="text.secondary">
                          Level {level} Progress
                        </Typography>
                        <Typography variant="caption" fontWeight={750} color="text.secondary">
                          {empXp % 150} / 150 XP
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={levelProgress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#FFF9C4',
                          '& .MuiLinearProgress-bar': { bgcolor: '#FBC02D', borderRadius: 4 },
                        }}
                      />
                    </Box>

                    <Stack direction="row" spacing={3}>
                      <Box>
                        <Typography variant="h6" fontWeight={850} color="#7F5F00">
                          {empXp.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total XP
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={850} color="#7F5F00">
                          3 Days
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Streak
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={() => navigate('/leaderboard')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: '#F57F17',
                      color: 'white',
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#E65100' },
                      borderRadius: 2,
                    }}
                  >
                    View Leaderboard
                  </Button>
                </Box>
              </Card>

              {/* Progress Gauges */}
              <Card variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#D9E9DD', flexGrow: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#1b4d3e" gutterBottom>
                  Energy Savings Goal
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Monthly progress towards reduction targets
                </Typography>

                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={72}
                      size={80}
                      thickness={5.5}
                      sx={{ color: '#2E7D32' }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="body2" fontWeight={850} color="text.primary">
                        72%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={750}>
                      Excellent Commute Record
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      You are close to hitting this month's 20% carbon reduction milestone!
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ── Admin Dashboard Layout ──────────────────────────────────────────────────
  const changeValue = getPercentageChange();
  const summaryTotal = summary?.totalEmissionKgCo2e ?? 0;
  const summaryCommute = summary?.commuteEmissionKgCo2e ?? 0;
  const summaryOperational = summary?.operationalEmissionKgCo2e ?? 0;

  const STAT_CARDS = [
    {
      title: 'Total emissions',
      value: summaryTotal > 0 ? `${summaryTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : '—',
      subtitle: 'Commute + Operations',
      color: 'success.main',
      icon: <EcoIcon />,
    },
    {
      title: 'Commute Emissions',
      value: summaryCommute > 0 ? `${summaryCommute.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : '—',
      subtitle: 'Employee Commuting',
      color: 'info.main',
      icon: <GroupsIcon />,
    },
    {
      title: 'Operational Emissions',
      value: summaryOperational > 0 ? `${summaryOperational.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : '—',
      subtitle: 'Facility & Energy Invoices',
      color: 'warning.main',
      icon: <AccountBalanceIcon />,
    },
    {
      title: 'Score Status',
      value: 'Grade A',
      subtitle: 'EcoSphere rating status',
      color: 'primary.main',
      icon: <StarIcon />,
    },
  ];

  if (adminLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', pb: 4 }}>
      <Breadcrumb />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={850} sx={{ color: '#174F35', letterSpacing: '-0.03em' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organization-wide ESG performance overview
          </Typography>
        </Box>
        {changeValue !== null && (
          <Chip
            icon={changeValue < 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
            label={`${Math.abs(changeValue).toFixed(1)}% vs Last Month`}
            color={changeValue < 0 ? 'success' : 'warning'}
            variant="outlined"
            sx={{ fontWeight: 800, borderRadius: 2 }}
          />
        )}
      </Box>

      {/* Grid of Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {STAT_CARDS.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#D9E9DD', position: 'relative' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={850} sx={{ mt: 0.5, color: '#174F35' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#EDF8EF', color: '#2E7D32', display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Grid of Charts and Trends */}
      <Grid container spacing={3.5}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#D9E9DD' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#1b4d3e' }}>
                  Carbon Emissions Over Time
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Monthly commute vs operational emissions in kgCO2e
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {trend.length === 0 ? (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No emissions data found for trend</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pt: 2, px: 2 }}>
                  {trend.map((t, idx) => {
                    const maxVal = Math.max(...trend.map((x) => x.totalEmissionKgCo2e ?? 0), 10);
                    const totalVal = t.totalEmissionKgCo2e ?? 0;
                    const commutePct = totalVal > 0 ? ((t.commuteEmissionKgCo2e ?? 0) / maxVal) * 100 : 0;
                    const operPct = totalVal > 0 ? ((t.operationalEmissionKgCo2e ?? 0) / maxVal) * 100 : 0;

                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthLabel = monthNames[t.month - 1] || `${t.month}`;

                    return (
                      <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, mx: 1 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ mb: 1, fontSize: '0.7rem' }}>
                          {totalVal > 0 ? `${totalVal.toFixed(0)}` : ''}
                        </Typography>
                        <Tooltip title={`Commute: ${(t.commuteEmissionKgCo2e ?? 0).toFixed(0)} kg, Operational: ${(t.operationalEmissionKgCo2e ?? 0).toFixed(0)} kg`}>
                          <Box sx={{ width: 24, bgcolor: '#D0E1D4', borderRadius: '4px 4px 0 0', position: 'relative', height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <Box sx={{ height: `${operPct}%`, width: '100%', bgcolor: '#1b4d3e', borderRadius: commutePct === 0 ? '4px 4px 0 0' : 0 }} />
                            <Box sx={{ height: `${commutePct}%`, width: '100%', bgcolor: '#81C784', borderRadius: '4px 4px 0 0' }} />
                          </Box>
                        </Tooltip>
                        <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, color: 'text.secondary' }}>
                          {monthLabel}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#D9E9DD', height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#1b4d3e' }}>
                Top Emission Sources
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Breakdown of emissions by activity type
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {sources.length === 0 ? (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No emission transactions found for period</Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  {sources.slice(0, 5).map((src, idx) => {
                    const totalVal = Math.max(...sources.map((x) => x.emissionKgCo2e), 1);
                    const pct = (src.emissionKgCo2e / totalVal) * 100;
                    return (
                      <Box key={idx}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ textTransform: 'capitalize' }}>
                            {src.activityType.replace('_', ' ')}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="#1b4d3e">
                            {src.emissionKgCo2e.toFixed(0)} kg
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#EDF8EF',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2E7D32', borderRadius: 3 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Department Leaderboard */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#D9E9DD', height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#1b4d3e' }}>
                Department Emissions Leaderboard
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total footprint contribution per department
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {departments.length === 0 ? (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No department emissions recorded</Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  {departments.map((dept, idx) => {
                    const totalVal = Math.max(...departments.map((x) => x.emissionKgCo2e), 1);
                    const pct = (dept.emissionKgCo2e / totalVal) * 100;
                    return (
                      <Box key={idx}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={800}>
                            {dept.departmentName}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="#1b4d3e">
                            {dept.emissionKgCo2e.toFixed(0)} kgCO2e
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#EDF8EF',
                            '& .MuiLinearProgress-bar': { bgcolor: '#1b4d3e', borderRadius: 4 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Goal Progress */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: '#D9E9DD', height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#1b4d3e' }}>
                Goal Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active sustainability goals vs targets
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={800}>Reduce Carbon Emissions by 20%</Typography>
                    <Typography variant="body2" fontWeight={800} color="#2E7D32">85% Achieved</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#E8F5E9',
                      '& .MuiLinearProgress-bar': { bgcolor: '#4CAF50', borderRadius: 4 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: 1,500 kgCO2e · Current: 1,720 kgCO2e
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={800}>Increase Eco-Friendly Commutes</Typography>
                    <Typography variant="body2" fontWeight={800} color="#0288D1">64% Achieved</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={64}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#E1F5FE',
                      '& .MuiLinearProgress-bar': { bgcolor: '#03A9F4', borderRadius: 4 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: 80% employees · Current: 51.2%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
