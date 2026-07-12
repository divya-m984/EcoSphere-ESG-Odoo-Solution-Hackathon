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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';

interface Milestone {
  id: string;
  step: number;
  completions: string;
  badgeName: string;
  isFirst?: boolean;
}

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  // States for Task Form
  const [taskStatus, setTaskStatus] = useState<'Draft' | 'Active' | 'Inactive'>('Draft');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mobility');
  const [baseXP, setBaseXP] = useState('15');
  const [cadence, setCadence] = useState<'Daily' | 'Repeatable'>('Daily');
  const [participation, setParticipation] = useState<'Solo' | 'Team'>('Solo');
  const [description, setDescription] = useState('');

  // Milestone Ladder State
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', step: 1, completions: '1', badgeName: 'Starter Badge', isFirst: true },
    { id: '2', step: 2, completions: '10', badgeName: 'Bronze Mover' },
    { id: '3', step: 3, completions: '50', badgeName: '' },
  ]);

  // States for Badge Modal
  const [openBadgeModal, setOpenBadgeModal] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
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
      api.get(`/tasks/${id}`)
        .then((res) => {
          if (res.data) {
            setTitle(res.data.title || '');
            setDescription(res.data.description || '');
            setCategory(res.data.categoryName || 'Mobility');
            setBaseXP(String(res.data.xpPerCompletion || 15));
            setCadence(res.data.cadence || 'Daily');
            setParticipation(res.data.participation || 'Solo');
            setTaskStatus(res.data.status || 'Draft');
            if (res.data.milestones) {
              // Parse milestones string back or keep defaults
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load task details', err);
        });
    }
  }, [isEdit, id]);

  const handleSave = () => {
    const milestoneSummary = milestones.map((m) => `${m.completions} completions -> ${m.badgeName || 'None'}`).join(', ');
    const payload = {
      title,
      description,
      xpPerCompletion: parseInt(baseXP) || 15,
      evidenceRequired: false,
      cadence,
      participation,
      milestones: milestoneSummary,
      status: taskStatus,
      category,
    };

    const request = isEdit
      ? api.put(`/tasks/${id}`, payload)
      : api.post('/tasks', payload);

    request
      .then(() => {
        navigate('/gamification/tasks');
      })
      .catch((err) => {
        console.error('Failed to save task', err);
        navigate('/gamification/tasks');
      });
  };

  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        step: prev.length + 1,
        completions: '',
        badgeName: '',
      },
    ]);
  };

  const handleMilestoneCompletionsChange = (milestoneId: string, val: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, completions: val } : m))
    );
  };

  const handleMilestoneBadgeChange = (milestoneId: string, val: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, badgeName: val } : m))
    );
  };

  const handleTriggerCreateBadge = (milestoneId: string) => {
    setActiveMilestoneId(milestoneId);
    setOpenBadgeModal(true);
  };

  const handleSaveBadge = () => {
    if (newBadgeName && activeMilestoneId) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === activeMilestoneId ? { ...m, badgeName: newBadgeName } : m))
      );
      setOpenBadgeModal(false);
      setNewBadgeName('');
      setNewBadgeDesc('');
      setActiveMilestoneId(null);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Top Breadcrumb & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification/tasks'); }}>
            Tasks
          </Link>
          <Typography color="text.primary">{isEdit ? 'Edit' : 'New'}</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
            onClick={() => navigate('/gamification/tasks')}
            sx={{ px: 3, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
          >
            Discard
          </Button>

          {/* Status Indicator Chevron Bar */}
          <Box sx={{ display: 'flex', ml: 2, bgcolor: '#F4F6F8', p: 0.5, borderRadius: '6px' }}>
            {(['Draft', 'Active', 'Inactive'] as const).map((status) => {
              const active = taskStatus === status;
              return (
                <Box
                  key={status}
                  onClick={() => setTaskStatus(status)}
                  sx={{
                    px: 2,
                    py: 0.6,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    bgcolor: active ? '#1B5E20' : 'transparent',
                    color: active ? '#FFFFFF' : 'text.secondary',
                    transition: 'all 0.1s',
                  }}
                >
                  {status}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Main Container Card */}
      <Card sx={{ p: 4, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none' }}>
        <Grid container spacing={5}>
          {/* Left Column - Core Task Inputs */}
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                Task Title
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. Clean Energy Report Submission"
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

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6}>
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
                  <MenuItem value="Mobility">Mobility</MenuItem>
                  <MenuItem value="Recycling">Recycling</MenuItem>
                  <MenuItem value="Energy">Energy</MenuItem>
                  <MenuItem value="Compliance">Compliance</MenuItem>
                </Select>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  Base XP per Completion
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={baseXP}
                  onChange={(e) => setBaseXP(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+</InputAdornment>,
                    endAdornment: <InputAdornment position="end">XP</InputAdornment>,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>
            </Grid>

            {/* Cadence Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Cadence
              </Typography>
              <Box sx={{ display: 'flex', bgcolor: '#F4F6F8', p: 0.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)', width: 220 }}>
                {(['Daily', 'Repeatable'] as const).map((cad) => {
                  const active = cadence === cad;
                  return (
                    <Box
                      key={cad}
                      onClick={() => setCadence(cad)}
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
                      {cad}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Participation Mode Selection */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Participation
              </Typography>
              <Box sx={{ display: 'flex', bgcolor: '#F4F6F8', p: 0.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)', width: 220 }}>
                {(['Solo', 'Team'] as const).map((part) => {
                  const active = participation === part;
                  return (
                    <Box
                      key={part}
                      onClick={() => setParticipation(part)}
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
                      {part}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder="Log your commute using public transit, cycling, or walking instead..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>
          </Grid>

          {/* Right Column - Milestone Ladder */}
          <Grid item xs={12} md={5} sx={{ borderLeft: { md: '1px solid rgba(0,0,0,0.06)' }, pl: { md: 5 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Milestone Ladder
            </Typography>

            <Box sx={{ position: 'relative', pl: 4 }}>
              {/* Vertical dotted timeline connector line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 11,
                  top: 15,
                  bottom: 15,
                  width: '2px',
                  borderLeft: '2px dashed rgba(0,0,0,0.12)',
                  zIndex: 0,
                }}
              />

              {milestones.map((milestone, idx) => (
                <Box
                  key={milestone.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: idx === milestones.length - 1 ? 0 : 4,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Circle Step Number */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -40,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: milestone.isFirst ? 'success.main' : '#FFFFFF',
                      color: milestone.isFirst ? '#FFFFFF' : 'text.secondary',
                      border: milestone.isFirst ? 'none' : '2px solid rgba(0,0,0,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {milestone.isFirst ? <CheckCircleIcon sx={{ fontSize: 24, color: 'success.main', bgcolor: '#FFFFFF', borderRadius: '50%' }} /> : milestone.step}
                  </Box>

                  {/* Milestone Settings Card Row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                    {milestone.isFirst ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 2,
                          py: 1.2,
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.08)',
                          bgcolor: 'rgba(0,0,0,0.01)',
                          flexGrow: 1,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          First completion
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            🛡️ Starter Badge
                          </Typography>
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: '0.9rem' }} />
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                        <TextField
                          size="small"
                          value={milestone.completions}
                          onChange={(e) => handleMilestoneCompletionsChange(milestone.id, e.target.value)}
                          sx={{ width: 65, '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          completions ➔
                        </Typography>

                        {milestone.badgeName ? (
                          <Select
                            value={milestone.badgeName}
                            onChange={(e) => handleMilestoneBadgeChange(milestone.id, e.target.value)}
                            size="small"
                            sx={{ borderRadius: '6px', minWidth: 150, color: 'primary.main', fontWeight: 700 }}
                          >
                            <MenuItem value="Bronze Mover">🥉 Bronze Mover</MenuItem>
                            <MenuItem value="Silver Runner">🥈 Silver Runner</MenuItem>
                            <MenuItem value="Gold Champion">🥇 Gold Champion</MenuItem>
                            <MenuItem value={milestone.badgeName}>{milestone.badgeName}</MenuItem>
                          </Select>
                        ) : (
                          <Button
                            variant="outlined"
                            onClick={() => handleTriggerCreateBadge(milestone.id)}
                            sx={{
                              borderStyle: 'dashed',
                              borderRadius: '6px',
                              py: 0.6,
                              px: 2,
                              color: 'text.secondary',
                              borderColor: 'divider',
                              fontSize: '0.8rem',
                            }}
                          >
                            + Create Badge
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddMilestone}
              sx={{ color: '#2E7D32', mt: 4, fontWeight: 700, ml: 4 }}
            >
              Add Milestone
            </Button>
          </Grid>
        </Grid>
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
