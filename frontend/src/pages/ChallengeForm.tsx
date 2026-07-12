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
  TextField,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate, useParams } from 'react-router-dom';

interface BadgeItem {
  id: string;
  name: string;
  criteria: string;
}

export default function ChallengeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  // States for Challenge Form
  const [status, setStatus] = useState<'Draft' | 'Active' | 'Under_Review' | 'Completed'>('Draft');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Environmental');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [xpReward, setXpReward] = useState('500');
  const [evidenceRequired, setEvidenceRequired] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participationMode, setParticipationMode] = useState<'Solo' | 'Team'>('Solo');
  const [minTeamSize, setMinTeamSize] = useState('3');
  const [badges, setBadges] = useState<BadgeItem[]>([
    { id: '1', name: 'Green Champion', criteria: 'Complete 100% of tasks' },
  ]);
  const [badgeSearch, setBadgeSearch] = useState('');

  // States for Badge Modal
  const [openBadgeModal, setOpenBadgeModal] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDesc, setNewBadgeDesc] = useState('');
  const [newBadgeFamily, setNewBadgeFamily] = useState('None');
  const [newBadgeTier, setNewBadgeTier] = useState('1');
  const [newBadgeUnlock, setNewBadgeUnlock] = useState<'Linked_Challenge' | 'Linked_Task' | 'Manual_XP'>('Manual_XP');
  const [newBadgeXP, setNewBadgeXP] = useState('1000');
  const [newBadgeTimeLimited, setNewBadgeTimeLimited] = useState(true);
  const [newBadgeStart, setNewBadgeStart] = useState('2024-06-01');
  const [newBadgeEnd, setNewBadgeEnd] = useState('2024-06-30');
  const [newBadgeScope, setNewBadgeScope] = useState<'Solo' | 'Team'>('Solo');

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/challenges/${id}`)
        .then((res) => {
          if (res.data) {
            setTitle(res.data.title || '');
            setCategory(res.data.category?.name || 'Environmental');
            setDescription(res.data.description || '');
            setDifficulty(res.data.difficulty || 'Medium');
            setXpReward(String(res.data.xpReward || 500));
            setEvidenceRequired(res.data.evidenceRequired ?? true);
            if (res.data.deadline) {
              setEndDate(new Date(res.data.deadline).toISOString().split('T')[0]);
            }
            setStatus(res.data.status || 'Draft');
          }
        })
        .catch((err) => {
          console.error('Failed to load challenge details', err);
        });
    }
  }, [isEdit, id]);

  const handleSave = () => {
    const payload = {
      title,
      category,
      description,
      xpReward: parseInt(xpReward) || 0,
      difficulty,
      evidenceRequired,
      deadline: endDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status,
    };

    const request = isEdit
      ? api.put(`/challenges/${id}`, payload)
      : api.post('/challenges', payload);

    request
      .then(() => {
        navigate('/gamification/challenges');
      })
      .catch((err) => {
        console.error('Failed to save challenge', err);
        navigate('/gamification/challenges');
      });
  };

  const handleDeleteBadge = (badgeId: string) => {
    setBadges((prev) => prev.filter((b) => b.id !== badgeId));
  };

  const handleSaveBadge = () => {
    if (newBadgeName) {
      const criteriaText = newBadgeUnlock === 'Manual_XP'
        ? `Reach ${newBadgeXP} XP`
        : newBadgeUnlock === 'Linked_Challenge'
        ? 'Complete challenge'
        : 'Complete task milestones';

      api.post('/badges', {
        name: newBadgeName,
        description: newBadgeDesc || criteriaText,
        icon: 'trophy',
        unlockRule: {
          criteria: criteriaText,
          xpThreshold: parseInt(newBadgeXP) || 0,
          scope: newBadgeScope,
        },
      }).then((res) => {
        setBadges((prev) => [
          ...prev,
          {
            id: res.data.id || Date.now().toString(),
            name: newBadgeName,
            criteria: criteriaText,
          },
        ]);
      }).catch((err) => {
        console.error('Failed to create badge via API, using local fallback', err);
        setBadges((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            name: newBadgeName,
            criteria: criteriaText,
          },
        ]);
      }).finally(() => {
        setOpenBadgeModal(false);
        setNewBadgeName('');
        setNewBadgeDesc('');
      });
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Top Breadcrumbs & Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification/challenges'); }}>
            Challenges
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit' : 'New'}</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            sx={{ px: 3, borderRadius: '8px', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/gamification/challenges')}
            sx={{ px: 3, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
          >
            Discard
          </Button>
        </Box>
      </Box>

      {/* Audit bar & Status selection */}
      <Card sx={{ p: 1.5, mb: 3, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" sx={{ borderRadius: '6px', color: 'text.primary', borderColor: 'divider' }}>Action</Button>
            <Button size="small" variant="outlined" sx={{ borderRadius: '6px', color: 'text.primary', borderColor: 'divider' }}>Print</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: '#F4F6F8', p: 0.5, borderRadius: '20px' }}>
            {(['Draft', 'Active', 'Under_Review', 'Completed'] as const).map((s) => {
              const active = status === s;
              const formattedLabel = s.replace('_', ' ');
              return (
                <Box
                  key={s}
                  onClick={() => setStatus(s)}
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    bgcolor: active ? '#2E7D32' : 'transparent',
                    color: active ? '#FFFFFF' : 'text.secondary',
                    '&:hover': {
                      bgcolor: active ? '#2E7D32' : 'rgba(0,0,0,0.04)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {formattedLabel}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Card>

      {/* Main Form Area */}
      <Card
        sx={{
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: 'none',
          p: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Archived Banner (Corner) */}
        {isEdit && (
          <Box
            sx={{
              position: 'absolute',
              top: 25,
              right: -35,
              width: 140,
              bgcolor: 'error.main',
              color: 'white',
              transform: 'rotate(45deg)',
              textAlign: 'center',
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              zIndex: 1,
            }}
          >
            ARCHIVED
          </Box>
        )}

        {/* Large Input for Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            Challenge Title
          </Typography>
          <TextField
            fullWidth
            placeholder="e.g. Q3 Energy Reduction Initiative"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: false,
              style: { fontSize: '1.6rem', fontWeight: 600, paddingBottom: '4px' },
            }}
            sx={{
              '& .MuiInput-root:after': { borderBottomColor: '#2E7D32' },
            }}
          />
        </Box>

        <Grid container spacing={4}>
          {/* Left Column: Basic Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Basic Info
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Category
              </Typography>
              <Select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                size="small"
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value="Environmental">Environmental</MenuItem>
                <MenuItem value="Social">Social</MenuItem>
                <MenuItem value="Governance">Governance</MenuItem>
                <MenuItem value="Community">Community</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Describe the challenge goals and requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                }}
              />
            </Box>
          </Grid>

          {/* Right Column: Configuration */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Configuration
            </Typography>

            {/* Difficulty Segmented Button */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Difficulty
              </Typography>
              <Box sx={{ display: 'flex', bgcolor: '#F4F6F8', p: 0.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                  const active = difficulty === diff;
                  return (
                    <Box
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      sx={{
                        flex: 1,
                        py: 0.8,
                        textAlign: 'center',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        bgcolor: active ? '#FFFFFF' : 'transparent',
                        color: active ? 'text.primary' : 'text.secondary',
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.1s',
                      }}
                    >
                      {diff}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* XP Reward & Evidence Req. toggler */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  XP Reward
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">XP</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Evidence Req.
                </Typography>
                <Box sx={{ height: 40, display: 'flex', alignItems: 'center' }}>
                  <Switch
                    checked={evidenceRequired}
                    onChange={(e) => setEvidenceRequired(e.target.checked)}
                    color="primary"
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Limited Time Event Box */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '10px',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                bgcolor: 'rgba(46, 125, 50, 0.02)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  📅 Limited-Time Event
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.3,
                    borderRadius: '4px',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  Starts in 2 days
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Start Date
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    End Date
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        {/* Participation Section */}
        <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Participation
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Mode
              </Typography>
              <Box sx={{ display: 'flex', bgcolor: '#F4F6F8', p: 0.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)', width: 220 }}>
                {(['Solo', 'Team'] as const).map((mode) => {
                  const active = participationMode === mode;
                  return (
                    <Box
                      key={mode}
                      onClick={() => setParticipationMode(mode)}
                      sx={{
                        flex: 1,
                        py: 0.8,
                        textAlign: 'center',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        bgcolor: active ? '#FFFFFF' : 'transparent',
                        color: active ? 'text.primary' : 'text.secondary',
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.1s',
                      }}
                    >
                      {mode}
                    </Box>
                  );
                })}
              </Box>
            </Grid>

            {participationMode === 'Team' && (
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Minimum Team Size
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(e.target.value)}
                  sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Exclusive Badges Section */}
        <Box sx={{ mt: 5, pt: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Exclusive Badges
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Note: These badges become unobtainable once the event ends.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setOpenBadgeModal(true)}
              sx={{ borderRadius: '6px', fontWeight: 600, borderColor: 'divider', color: 'text.primary' }}
            >
              + Create Badge
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">Badge Name</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">Criteria</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">Action</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {badges.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'success.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} />
                      {b.name}
                    </TableCell>
                    <TableCell>{b.criteria}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleDeleteBadge(b.id)} size="small" sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Search / Add input row */}
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search and add existing badge..."
                      value={badgeSearch}
                      onChange={(e) => setBadgeSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      {/* CREATE NEW BADGE MODAL DIALOG (matches Image 5) */}
      <Dialog
        open={openBadgeModal}
        onClose={() => setOpenBadgeModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', p: 1 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              New Badge Definition
            </Typography>
            <IconButton onClick={() => setOpenBadgeModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={4}>
            {/* Modal Left Column */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Badge Name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., Sustainability Champion"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Briefly describe what this badge represents..."
                  value={newBadgeDesc}
                  onChange={(e) => setNewBadgeDesc(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Icon Asset
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'rgba(0,0,0,0.01)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Click to upload icon
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    SVG or PNG, max 1MB
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Modal Right Column */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                    Family
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={newBadgeFamily}
                    onChange={(e) => setNewBadgeFamily(e.target.value)}
                    sx={{ borderRadius: '8px' }}
                  >
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="Environmental">Environmental</MenuItem>
                    <MenuItem value="Social">Social</MenuItem>
                    <MenuItem value="Governance">Governance</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                    Tier
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    value={newBadgeTier}
                    onChange={(e) => setNewBadgeTier(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>

              {/* Unlock Source Radio Buttons */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Unlock Source
                </Typography>
                <RadioGroup
                  value={newBadgeUnlock}
                  onChange={(e) => setNewBadgeUnlock(e.target.value as any)}
                >
                  <FormControlLabel value="Linked_Challenge" control={<Radio size="small" />} label={<Typography variant="body2">Linked Challenge</Typography>} />
                  <FormControlLabel value="Linked_Task" control={<Radio size="small" />} label={<Typography variant="body2">Linked Task Milestone</Typography>} />
                  <FormControlLabel value="Manual_XP" control={<Radio size="small" />} label={<Typography variant="body2">Manual XP Threshold</Typography>} />
                </RadioGroup>
              </Box>

              {/* Conditional XP input */}
              {newBadgeUnlock === 'Manual_XP' && (
                <Box sx={{ mb: 3, p: 2, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    XP Required
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    value={newBadgeXP}
                    onChange={(e) => setNewBadgeXP(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFFFFF' } }}
                  />
                </Box>
              )}

              {/* Time limited switch & dates */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Exclusive time-limited
                  </Typography>
                  <Switch
                    checked={newBadgeTimeLimited}
                    onChange={(e) => setNewBadgeTimeLimited(e.target.checked)}
                    color="primary"
                  />
                </Box>

                {newBadgeTimeLimited && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Start Date
                      </Typography>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={newBadgeStart}
                        onChange={(e) => setNewBadgeStart(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        End Date
                      </Typography>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={newBadgeEnd}
                        onChange={(e) => setNewBadgeEnd(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>

              {/* Target Scope Segmented Button */}
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Target Scope
                </Typography>
                <Box sx={{ display: 'flex', bgcolor: '#F4F6F8', p: 0.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  {(['Solo', 'Team'] as const).map((scope) => {
                    const active = newBadgeScope === scope;
                    return (
                      <Box
                        key={scope}
                        onClick={() => setNewBadgeScope(scope)}
                        sx={{
                          flex: 1,
                          py: 0.8,
                          textAlign: 'center',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          bgcolor: active ? '#2E7D32' : 'transparent',
                          color: active ? '#FFFFFF' : 'text.secondary',
                          boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all 0.1s',
                        }}
                      >
                        {scope}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setOpenBadgeModal(false)}
            sx={{ px: 3, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveBadge}
            sx={{ px: 3, borderRadius: '8px', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
          >
            Save Badge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
