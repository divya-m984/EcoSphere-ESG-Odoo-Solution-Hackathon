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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Switch,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import { useNavigate } from 'react-router-dom';

interface Badge {
  id: string;
  name: string;
  description: string;
  family: string;
  tier: number;
  source: string;
  scope: 'Solo' | 'Team';
  timeLimited: boolean;
  xpRequired?: number;
}

const INITIAL_BADGES: Badge[] = [
  {
    id: '1',
    name: 'Starter Badge',
    description: 'Awarded automatically upon completing your first sustainability task.',
    family: 'General',
    tier: 1,
    source: 'Linked Task Milestone',
    scope: 'Solo',
    timeLimited: false,
  },
  {
    id: '2',
    name: 'Bronze Mover',
    description: 'Earned by logging 10 eco-friendly commutes.',
    family: 'Mobility',
    tier: 1,
    source: 'Linked Task Milestone',
    scope: 'Solo',
    timeLimited: false,
  },
  {
    id: '3',
    name: 'Green Champion',
    description: 'Exclusive badge for completing all goals in the Zero Waste Week.',
    family: 'Environmental',
    tier: 2,
    source: 'Linked Challenge',
    scope: 'Solo',
    timeLimited: true,
  },
];

export default function Badges() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Badge Modal
  const [openBadgeModal, setOpenBadgeModal] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDesc, setNewBadgeDesc] = useState('');
  const [newBadgeFamily, setNewBadgeFamily] = useState('None');
  const [newBadgeTier, setNewBadgeTier] = useState('1');
  const [newBadgeUnlock, setNewBadgeUnlock] = useState<'Linked_Challenge' | 'Linked_Task' | 'Manual_XP'>('Manual_XP');
  const [newBadgeXP, setNewBadgeXP] = useState('1000');
  const [newBadgeTimeLimited, setNewBadgeTimeLimited] = useState(false);
  const [newBadgeStart, setNewBadgeStart] = useState('2024-06-01');
  const [newBadgeEnd, setNewBadgeEnd] = useState('2024-06-30');
  const [newBadgeScope, setNewBadgeScope] = useState<'Solo' | 'Team'>('Solo');

  const fetchBadges = () => {
    api.get('/badges')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((item: any) => {
            const rule = item.unlockRule || {};
            return {
              id: item.id,
              name: item.name,
              description: item.description,
              family: rule.family || 'General',
              tier: rule.tier || 1,
              source: rule.criteria || 'Manual XP',
              scope: rule.scope || 'Solo',
              timeLimited: rule.timeLimited || false,
              xpRequired: rule.xpThreshold || undefined,
            };
          });
          setBadges(mapped);
        } else {
          setBadges(INITIAL_BADGES);
        }
      })
      .catch(() => {
        setBadges(INITIAL_BADGES);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleSaveBadge = () => {
    if (newBadgeName) {
      const payload = {
        name: newBadgeName,
        description: newBadgeDesc || 'No description provided.',
        icon: 'trophy',
        unlockRule: {
          family: newBadgeFamily,
          tier: Number(newBadgeTier),
          criteria: newBadgeUnlock.replace('_', ' '),
          scope: newBadgeScope,
          timeLimited: newBadgeTimeLimited,
          xpThreshold: newBadgeUnlock === 'Manual_XP' ? Number(newBadgeXP) : undefined,
        },
      };

      api.post('/badges', payload)
        .then(() => {
          fetchBadges();
        })
        .catch((err) => {
          console.error('Failed to create badge via API', err);
          // Local fallback
          setBadges((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: newBadgeName,
              description: newBadgeDesc || 'No description provided.',
              family: newBadgeFamily,
              tier: Number(newBadgeTier),
              source: newBadgeUnlock.replace('_', ' '),
              scope: newBadgeScope,
              timeLimited: newBadgeTimeLimited,
              xpRequired: newBadgeUnlock === 'Manual_XP' ? Number(newBadgeXP) : undefined,
            },
          ]);
        })
        .finally(() => {
          setOpenBadgeModal(false);
          setNewBadgeName('');
          setNewBadgeDesc('');
        });
    }
  };

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
          <Typography color="text.primary">Badges</Typography>
        </Breadcrumbs>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenBadgeModal(true)}
          sx={{ borderRadius: '8px', px: 3, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          New Badge
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Badges
      </Typography>

      <Grid container spacing={3}>
        {badges.map((badge) => (
          <Grid item xs={12} sm={6} md={4} key={badge.id}>
            <Card
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Badge Icon Asset area */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: badge.timeLimited ? 'warning.light' : 'primary.light', width: 48, height: 48 }}>
                  <MilitaryTechIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {badge.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Family: {badge.family} &middot; Tier {badge.tier}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                {badge.description}
              </Typography>

              {/* Badges footer tags */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={badge.source} size="small" variant="outlined" sx={{ borderRadius: '6px', fontSize: '0.75rem' }} />
                <Chip
                  label={badge.scope}
                  size="small"
                  sx={{
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    bgcolor: badge.scope === 'Team' ? 'rgba(121, 85, 72, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                    color: badge.scope === 'Team' ? '#5D4037' : 'text.secondary',
                  }}
                />
                {badge.timeLimited && (
                  <Chip label="Time Limited" size="small" color="warning" sx={{ borderRadius: '6px', fontSize: '0.75rem' }} />
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

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
