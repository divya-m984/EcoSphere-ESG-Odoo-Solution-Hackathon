import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  LinearProgress,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ChallengeItem {
  id: string;
  title: string;
  category: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  mode: 'Solo' | 'Team';
  description: string;
}

const INITIAL_CHALLENGES: ChallengeItem[] = [
  {
    id: '1',
    title: 'Zero Waste Week 2024',
    category: 'Environment',
    xpReward: 500,
    startDate: '01 Oct',
    endDate: '07 Oct',
    mode: 'Solo',
    description: 'Avoid single-use plastics and compost organic materials for a whole week.',
  },
  {
    id: '2',
    title: 'Community Clean-up Drive',
    category: 'Social',
    xpReward: 1200,
    startDate: '15 Oct',
    endDate: '15 Oct',
    mode: 'Team',
    description: 'Participate with your team to clean local parks and organize recyclables.',
  },
  {
    id: '3',
    title: 'Q3 Ethics Certification',
    category: 'Governance',
    xpReward: 250,
    startDate: '01 Sep',
    endDate: '30 Sep',
    mode: 'Solo',
    description: 'Review and sign off the updated corporate governance and ethics policy.',
  },
  {
    id: '4',
    title: 'Reduce Paper Usage 50%',
    category: 'Environment',
    xpReward: 800,
    startDate: '01 Aug',
    endDate: '31 Aug',
    mode: 'Solo',
    description: 'Switch to digital invoice filing and use double-sided printing options.',
  },
  {
    id: '5',
    title: '2023 Energy Audit Compliance',
    category: 'Governance',
    xpReward: 1000,
    startDate: '01 Jan',
    endDate: '31 Dec',
    mode: 'Team',
    description: 'Audit department office spaces to optimize heating and light consumption.',
  },
];

export default function Challenges() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.role === 'Employee';

  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['Active']);
  const [selectedModes, setSelectedModes] = useState<string[]>(['Solo', 'Team']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Environment', 'Social', 'Governance']);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');

  // Proof submission dialog state
  const [openProofDialog, setOpenProofDialog] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [proofText, setProofText] = useState('');

  // Local storage trackers for employee engagement
  const [joinedChallenges, setJoinedChallenges] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`joined_challenges_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [completedChallenges, setCompletedChallenges] = useState<Record<string, 'Active' | 'Review' | 'Completed'>>(() => {
    const saved = localStorage.getItem(`completed_challenges_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    api.get('/challenges')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category?.name || 'Environment',
            xpReward: item.xpReward,
            startDate: new Date(item.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
            endDate: new Date(item.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
            mode: item.evidenceRequired ? 'Solo' : 'Team',
            description: item.description || 'Actionable sustainable compliance challenge.',
          }));
          setChallenges(mapped);
        } else {
          setChallenges(INITIAL_CHALLENGES);
        }
      })
      .catch(() => {
        setChallenges(INITIAL_CHALLENGES);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleStatusChange = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleModeChange = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedStatus([]);
    setSelectedModes([]);
    setSelectedCategories([]);
  };

  const handleJoinChallenge = (id: string) => {
    const updated = { ...joinedChallenges, [id]: !joinedChallenges[id] };
    setJoinedChallenges(updated);
    localStorage.setItem(`joined_challenges_${user?.id}`, JSON.stringify(updated));

    // Update status to Active/In Progress if joined
    if (updated[id]) {
      const statusUpdate = { ...completedChallenges, [id]: 'Active' as const };
      setCompletedChallenges(statusUpdate);
      localStorage.setItem(`completed_challenges_${user?.id}`, JSON.stringify(statusUpdate));
    } else {
      const statusUpdate = { ...completedChallenges };
      delete statusUpdate[id];
      setCompletedChallenges(statusUpdate);
      localStorage.setItem(`completed_challenges_${user?.id}`, JSON.stringify(statusUpdate));
    }
  };

  const handleOpenProof = (id: string) => {
    setActiveChallengeId(id);
    setProofText('');
    setOpenProofDialog(true);
  };

  const handleSubmitProof = () => {
    if (!activeChallengeId) return;
    setSubmittingProof(true);

    // Simulate backend submission delays
    setTimeout(() => {
      const statusUpdate = { ...completedChallenges, [activeChallengeId]: 'Review' as const };
      setCompletedChallenges(statusUpdate);
      localStorage.setItem(`completed_challenges_${user?.id}`, JSON.stringify(statusUpdate));
      setSubmittingProof(false);
      setOpenProofDialog(false);
    }, 1200);
  };

  const filteredChallenges = challenges.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(c.category);
    const matchesMode = selectedModes.length === 0 || selectedModes.includes(c.mode);
    return matchesSearch && matchesCategory && matchesMode;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  // ── Employee Challenges Grid View ───────────────────────────────────────────
  if (isEmployee) {
    return (
      <Box sx={{ maxWidth: 1240, mx: 'auto', pb: 4 }}>
        {/* Navigation Breadcrumb */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
              Dashboard
            </Link>
            <Typography color="text.primary">My Challenges</Typography>
          </Breadcrumbs>
        </Box>

        <Typography variant="h4" fontWeight={850} sx={{ color: '#174F35', letterSpacing: '-0.03em', mb: 1 }}>
          Sustainability Challenges
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Join active ESG campaigns, fulfill targets, and submit your completion proofs for verified XP rewards.
        </Typography>

        <Grid container spacing={3.5}>
          {/* Left Categories Sidebar / Filter */}
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: '#D9E9DD', bgcolor: '#F9FAF9' }}>
              <Typography variant="subtitle2" fontWeight={850} sx={{ color: '#1b4d3e', mb: 2, letterSpacing: '0.04em' }}>
                FILTER BY CATEGORY
              </Typography>
              <FormGroup>
                {['Environment', 'Social', 'Governance'].map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        color="success"
                        size="small"
                      />
                    }
                    label={<Typography variant="body2" fontWeight={600}>{category}</Typography>}
                    sx={{ my: -0.1 }}
                  />
                ))}
              </FormGroup>

              <Button
                fullWidth
                size="small"
                onClick={clearFilters}
                sx={{ mt: 3, fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}
              >
                Clear Filters
              </Button>
            </Card>
          </Grid>

          {/* Challenges Grid */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              {filteredChallenges.map((row) => {
                const isJoined = !!joinedChallenges[row.id];
                const status = completedChallenges[row.id] || 'Not Joined';

                let statusLabel = 'Join Campaign';
                let chipColor: 'default' | 'primary' | 'warning' | 'success' = 'default';

                if (status === 'Active') {
                  statusLabel = 'In Progress';
                  chipColor = 'primary';
                } else if (status === 'Review') {
                  statusLabel = 'Under Review';
                  chipColor = 'warning';
                } else if (status === 'Completed') {
                  statusLabel = 'Verified Completed';
                  chipColor = 'success';
                }

                return (
                  <Grid item xs={12} sm={6} key={row.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: isJoined ? '#A5D6A7' : '#E5E7EB',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Chip
                            label={row.category}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              bgcolor:
                                row.category === 'Environment'
                                  ? '#E2F0D9'
                                  : row.category === 'Social'
                                  ? '#FFF2CC'
                                  : '#FCE4D6',
                              color:
                                row.category === 'Environment'
                                  ? '#385723'
                                  : row.category === 'Social'
                                  ? '#7F6000'
                                  : '#C65911',
                            }}
                          />
                          <Typography variant="body2" fontWeight={850} color="warning.main">
                            +{row.xpReward} XP
                          </Typography>
                        </Stack>

                        <Typography variant="h6" fontWeight={800} sx={{ color: '#174F35', mb: 1, lineHeight: 1.25 }}>
                          {row.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, minHeight: 40 }}>
                          {row.description}
                        </Typography>

                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <QueryBuilderIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Deadline: {row.endDate}
                          </Typography>
                        </Stack>

                        {isJoined && (
                          <Box sx={{ mt: 2 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                Campaign Status
                              </Typography>
                              <Typography variant="caption" color={`${chipColor}.main`} fontWeight={800}>
                                {statusLabel}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={status === 'Completed' ? 100 : status === 'Review' ? 70 : 25}
                              color={chipColor === 'default' ? 'success' : chipColor}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 1.5 }}>
                        {!isJoined ? (
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleJoinChallenge(row.id)}
                            sx={{
                              bgcolor: '#1b4d3e',
                              fontWeight: 800,
                              borderRadius: 2,
                              '&:hover': { bgcolor: '#113027' },
                            }}
                          >
                            Join Challenge
                          </Button>
                        ) : (
                          <>
                            {status === 'Active' && (
                              <Button
                                fullWidth
                                variant="contained"
                                color="warning"
                                onClick={() => handleOpenProof(row.id)}
                                startIcon={<CloudUploadIcon />}
                                sx={{ fontWeight: 800, borderRadius: 2 }}
                              >
                                Submit Proof
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleJoinChallenge(row.id)}
                              sx={{ fontWeight: 800, borderRadius: 2 }}
                            >
                              Leave
                            </Button>
                          </>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>

        {/* Proof Submission Dialog */}
        <Dialog open={openProofDialog} onClose={() => setOpenProofDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#174F35' }}>Submit Challenge Evidence</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Provide description or text detailing the actions you took to fulfill this ESG challenge. Auditor will verify to award XP.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="e.g. Completed Zero Waste lunch audit, replaced paper bags with fabric bags."
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenProofDialog(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitProof}
              disabled={!proofText.trim() || submittingProof}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              {submittingProof ? <CircularProgress size={20} color="inherit" /> : 'Submit Evidence'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ── Admin Challenges Table View ─────────────────────────────────────────────
  return (
    <Box sx={{ p: 1 }}>
      {/* Top Breadcrumbs & Action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Typography color="text.primary">Challenges</Typography>
        </Breadcrumbs>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/gamification/challenges/new')}
          sx={{ borderRadius: '8px', px: 3 }}
        >
          New Challenge
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Challenges
      </Typography>

      <Grid container spacing={3}>
        {/* Filters Left Sidebar */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" /> Filters
              </Typography>
              <Button size="small" onClick={clearFilters} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Clear
              </Button>
            </Box>

            {/* Status section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              STATUS
            </Typography>
            <FormGroup sx={{ mb: 3 }}>
              {['Draft', 'Active', 'Under Review', 'Completed', 'Archived'].map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={selectedStatus.includes(status)}
                      onChange={() => handleStatusChange(status)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{status}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>

            {/* Participation mode section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              PARTICIPATION MODE
            </Typography>
            <FormGroup sx={{ mb: 3 }}>
              {['Solo', 'Team'].map((mode) => (
                <FormControlLabel
                  key={mode}
                  control={
                    <Checkbox
                      checked={selectedModes.includes(mode)}
                      onChange={() => handleModeChange(mode)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{mode}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>

            {/* Category section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              CATEGORY
            </Typography>
            <FormGroup>
              {['Environment', 'Social', 'Governance', 'Community'].map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{category}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>
          </Card>
        </Grid>

        {/* Challenges Table Right Panel */}
        <Grid item xs={12} md={9}>
          <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Showing 1-{filteredChallenges.length} of {filteredChallenges.length} Challenges
              </Typography>
              <TextField
                size="small"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" color="primary" />
                    </TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">TITLE</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">CATEGORY</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">XP REWARD</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">DURATION</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">PARTICIPATION</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredChallenges.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => navigate(`/gamification/challenges/${row.id}`)}
                      sx={{ cursor: 'pointer', '&:last-child cell': { border: 0 } }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" color="primary" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell sx={{ color: 'warning.main', fontWeight: 700 }}>+{row.xpReward} XP</TableCell>
                      <TableCell>{row.startDate} - {row.endDate}</TableCell>
                      <TableCell>{row.mode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Table Footer */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                bgcolor: 'rgba(0,0,0,0.01)'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Rows per page:
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: '6px',
                  height: '32px',
                  fontSize: '0.8rem',
                  '& .MuiSelect-select': { py: 0.5, px: 1 },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={15}>15</MenuItem>
                <MenuItem value={30}>30</MenuItem>
              </Select>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
