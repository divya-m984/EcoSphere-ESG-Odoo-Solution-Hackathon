import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type Period = 'week' | 'month' | 'all';
type Movement = 'up' | 'down' | 'same';

interface LeaderboardEntry {
  id: string;
  name: string;
  department: string;
  xp: number;
  streak: number;
  movement: Movement;
  initials: string;
  isCurrentUser?: boolean;
}

const FALLBACK_ENTRIES: LeaderboardEntry[] = [
  { id: 'olivia', name: 'Olivia Chen', department: 'Operations', xp: 12480, streak: 18, movement: 'up', initials: 'OC' },
  { id: 'arjun', name: 'Arjun Mehta', department: 'Engineering', xp: 11720, streak: 13, movement: 'up', initials: 'AM' },
  { id: 'maya', name: 'Maya Iyer', department: 'People & Culture', xp: 10890, streak: 9, movement: 'same', initials: 'MI' },
  { id: 'samir', name: 'Samir Patel', department: 'Finance', xp: 9820, streak: 7, movement: 'up', initials: 'SP' },
  { id: 'neha', name: 'Neha Kapoor', department: 'Marketing', xp: 9250, streak: 5, movement: 'down', initials: 'NK' },
  { id: 'david', name: 'David Wilson', department: 'Product', xp: 8870, streak: 4, movement: 'same', initials: 'DW' },
  { id: 'sofia', name: 'Sofia Martinez', department: 'Legal', xp: 8110, streak: 2, movement: 'up', initials: 'SM' },
  { id: 'kiran', name: 'Kiran Rao', department: 'Customer Success', xp: 7680, streak: 0, movement: 'down', initials: 'KR' },
];

function fallbackEntriesFor(name?: string): LeaderboardEntry[] {
  if (!name || FALLBACK_ENTRIES.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) return FALLBACK_ENTRIES;
  return [
    ...FALLBACK_ENTRIES,
    { id: 'current-user', name, department: 'Your team', xp: 7350, streak: 3, movement: 'up', initials: initialLetters(name), isCurrentUser: true },
  ];
}

const PERIOD_LABELS: Record<Period, string> = { week: 'This week', month: 'This month', all: 'All time' };
const MEDAL_COLOURS = ['#E2AA28', '#8D9BA6', '#B9784B'];

function initialLetters(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function movementIcon(movement: Movement) {
  if (movement === 'up') return <TrendingUpIcon fontSize="small" sx={{ color: '#20804B' }} />;
  if (movement === 'down') return <TrendingDownIcon fontSize="small" sx={{ color: '#C16148' }} />;
  return <TrendingFlatIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
}

function EntryAvatar({ entry, size = 38 }: { entry: LeaderboardEntry; size?: number }) {
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: '#DDECE1', color: '#1C6240', fontSize: size / 2.65, fontWeight: 700 }}>
      {entry.initials}
    </Avatar>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const userName = user?.name;
  const [period, setPeriod] = useState<Period>('month');
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => fallbackEntriesFor(userName));
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api.get('/leaderboard', { params: { period } })
      .then((response) => {
        const data = Array.isArray(response.data) ? response.data : response.data?.data;
        if (!Array.isArray(data) || data.length === 0) throw new Error('No leaderboard data');
        if (!active) return;
        setEntries(data.map((item: Partial<LeaderboardEntry>, index: number) => ({
          id: item.id ?? String(index),
          name: item.name ?? 'Team member',
          department: item.department ?? 'Unassigned',
          xp: Number(item.xp ?? 0),
          streak: Number(item.streak ?? 0),
          movement: item.movement ?? 'same',
          initials: item.initials ?? initialLetters(item.name ?? 'Team member'),
          isCurrentUser: item.isCurrentUser,
        })));
        setUsingSampleData(false);
      })
      .catch(() => {
        if (!active) return;
        setEntries(fallbackEntriesFor(userName));
        setUsingSampleData(true);
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [period, userName]);

  const rankedEntries = useMemo(() => [...entries].sort((a, b) => b.xp - a.xp), [entries]);
  const currentUserEntry = rankedEntries.find((entry) => entry.isCurrentUser)
    ?? rankedEntries.find((entry) => userName && entry.name.toLowerCase() === userName.toLowerCase());
  const topThree = rankedEntries.slice(0, 3);
  const nextEntry = currentUserEntry
    ? rankedEntries[rankedEntries.findIndex((entry) => entry.id === currentUserEntry.id) - 1]
    : undefined;

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={750} sx={{ color: '#174F35', letterSpacing: '-0.03em' }}>Community leaderboard</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Celebrate consistent sustainability actions—ranked by earned XP.</Typography>
        </Box>
        <ToggleButtonGroup exclusive value={period} onChange={(_, value: Period | null) => value && setPeriod(value)} size="small" aria-label="Leaderboard period">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => <ToggleButton key={key} value={key} sx={{ px: { xs: 1.25, sm: 2 }, textTransform: 'none', fontWeight: 700 }}>{PERIOD_LABELS[key]}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {usingSampleData && <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>Showing preview data while the leaderboard service is unavailable.</Alert>}

      {loading ? <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : <>
        <Card variant="outlined" sx={{ overflow: 'hidden', borderColor: '#D9E9DD', bgcolor: '#FCFFFC', boxShadow: 'none', mb: 3 }}>
          <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: 3.5, pb: 1.5, background: 'linear-gradient(115deg, #EDF8EF 0%, #FBFDF7 58%, #FFF8E8 100%)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <EmojiEventsOutlinedIcon sx={{ color: '#C68712' }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#5C6D5F', letterSpacing: '.06em', textTransform: 'uppercase' }}>Top contributors</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">{PERIOD_LABELS[period]} · XP from approved challenges and activities</Typography>
          </Box>
          <Grid container spacing={0} sx={{ px: { xs: 1, sm: 3 }, pb: 3, alignItems: 'end' }}>
            {[topThree[1], topThree[0], topThree[2]].map((entry, displayIndex) => {
              if (!entry) return null;
              const rank = displayIndex === 0 ? 2 : displayIndex === 1 ? 1 : 3;
              const champion = rank === 1;
              return <Grid item xs={12} sm={4} key={entry.id}>
                <Box sx={{ minHeight: { xs: 'auto', sm: champion ? 230 : 195 }, mt: { xs: 1, sm: champion ? 0 : 4 }, mx: 1, p: 2.25, borderRadius: 3, textAlign: 'center', border: `1px solid ${champion ? '#F0C65C' : '#DCE7DE'}`, bgcolor: champion ? '#FFFBEF' : '#FFFFFF', position: 'relative' }}>
                  <Avatar sx={{ width: champion ? 64 : 54, height: champion ? 64 : 54, mx: 'auto', mb: 1.25, bgcolor: champion ? '#F7E4AA' : '#E5F0E7', color: '#1C6240', fontWeight: 800, fontSize: champion ? 22 : 18, border: champion ? '3px solid #E0A21A' : '2px solid #BDD4C2' }}>{entry.initials}</Avatar>
                  <Chip label={`#${rank}`} size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: `${MEDAL_COLOURS[rank - 1]}20`, color: MEDAL_COLOURS[rank - 1], fontWeight: 800 }} />
                  <Typography fontWeight={800}>{entry.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{entry.department}</Typography>
                  <Typography sx={{ fontSize: champion ? '1.8rem' : '1.45rem', lineHeight: 1.2, mt: 1.2, color: '#174F35', fontWeight: 800 }}>{entry.xp.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">XP earned</Typography>
                  <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ mt: 1 }}><LocalFireDepartmentOutlinedIcon sx={{ color: '#E36B2C', fontSize: 17 }} /><Typography variant="caption" sx={{ color: '#BD5825', fontWeight: 800 }}>{entry.streak} day streak</Typography></Stack>
                </Box>
              </Grid>;
            })}
          </Grid>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card variant="outlined" sx={{ borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box><Typography fontWeight={800}>All participants</Typography><Typography variant="body2" color="text.secondary">Your daily streak is counted when you log an approved action.</Typography></Box>
                <Chip label={`${rankedEntries.length} people`} size="small" sx={{ bgcolor: '#EFF6F0', color: '#287044', fontWeight: 700 }} />
              </Box>
              <Divider />
              {rankedEntries.map((entry, index) => <Box key={entry.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '36px minmax(0, 1fr) 66px', sm: '54px minmax(160px, 1fr) minmax(100px, .65fr) 96px 80px' }, gap: 1.25, alignItems: 'center', px: { xs: 2, sm: 3 }, py: 1.5, bgcolor: entry.isCurrentUser ? '#F1F9F2' : 'transparent', borderBottom: index === rankedEntries.length - 1 ? 'none' : '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={800} color={index < 3 ? '#B57B09' : 'text.secondary'}>#{index + 1}</Typography>
                <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}><EntryAvatar entry={entry} /><Box minWidth={0}><Typography fontWeight={entry.isCurrentUser ? 800 : 700} noWrap>{entry.name}{entry.isCurrentUser && ' (you)'}</Typography><Typography variant="caption" color="text.secondary" noWrap>{entry.department}</Typography></Box></Stack>
                <Chip icon={<LocalFireDepartmentOutlinedIcon sx={{ fontSize: '15px !important' }} />} label={`${entry.streak} days`} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' }, justifySelf: 'start', color: entry.streak ? '#C05621' : 'text.secondary', bgcolor: entry.streak ? '#FFF1E9' : '#F4F5F4', fontWeight: 700 }} />
                <Typography fontWeight={800} textAlign="right">{entry.xp.toLocaleString()}<Typography component="span" variant="caption" color="text.secondary"> XP</Typography></Typography>
                <Tooltip title={entry.movement === 'same' ? 'No rank change' : `Rank moved ${entry.movement}`}><Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>{movementIcon(entry.movement)}</Box></Tooltip>
              </Box>)}
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card variant="outlined" sx={{ p: 3, borderColor: '#D8E9DB', boxShadow: 'none', height: '100%', background: 'linear-gradient(160deg, #F3FAF4, #FFFFFF 60%)' }}>
              <Stack direction="row" spacing={1} alignItems="center"><Box sx={{ p: 1, borderRadius: 2, bgcolor: '#FFE8DB', color: '#D55C25', display: 'grid', placeItems: 'center' }}><LocalFireDepartmentOutlinedIcon /></Box><Box><Typography fontWeight={800}>Your daily streak</Typography><Typography variant="caption" color="text.secondary">Keep your momentum alive</Typography></Box></Stack>
              <Box sx={{ my: 3 }}><Typography sx={{ fontSize: '2.7rem', lineHeight: 1, fontWeight: 850, color: '#174F35' }}>{currentUserEntry?.streak ?? 0}<Typography component="span" sx={{ fontSize: '1rem', ml: 0.75, fontWeight: 700 }}>days</Typography></Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Complete one approved sustainability action today to protect your streak.</Typography></Box>
              <Typography variant="caption" color="text.secondary">Next streak milestone</Typography>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, mb: 0.75 }}><Typography fontWeight={800}>7-day momentum</Typography><Typography variant="body2" color="text.secondary">{Math.min(currentUserEntry?.streak ?? 0, 7)} / 7</Typography></Stack>
              <LinearProgress variant="determinate" value={Math.min(((currentUserEntry?.streak ?? 0) / 7) * 100, 100)} sx={{ height: 8, borderRadius: 5, bgcolor: '#DDEEDF', '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: '#2C7B4B' } }} />
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={1.25} alignItems="center"><WorkspacePremiumOutlinedIcon sx={{ color: '#BE8516' }} /><Typography variant="body2">{nextEntry ? `${(nextEntry.xp - (currentUserEntry?.xp ?? 0)).toLocaleString()} XP to move up one rank.` : 'You are leading the board—brilliant work!'}</Typography></Stack>
              <Button fullWidth variant="contained" href="/gamification/tasks" sx={{ mt: 3, bgcolor: '#1F6A42', '&:hover': { bgcolor: '#174F35' } }}>Find an action to complete</Button>
            </Card>
          </Grid>
        </Grid>
      </>}
    </Box>
  );
}
