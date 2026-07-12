import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  adminCreateReward,
  adminFetchRedemptions,
  adminFetchRewards,
  adminUpdateReward,
  adminUpdateRewardStatus,
  extractErrorMessage,
} from '@/services/rewards.service';
import type { CreateRewardPayload, Reward, RewardStatus, UpdateRewardPayload } from '@/types/rewards';

// ── Status chip helper ────────────────────────────────────────────────────────

function StatusChip({ status }: { status: RewardStatus }) {
  const map: Record<RewardStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
    Active: { label: 'Active', color: 'success' },
    Inactive: { label: 'Inactive', color: 'default' },
    Out_Of_Stock: { label: 'Out of Stock', color: 'error' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'default' };
  return <Chip label={label} color={color} size="small" sx={{ borderRadius: '6px', fontSize: '0.72rem' }} />;
}

// ── Reward form (create / edit) ───────────────────────────────────────────────

interface RewardFormData {
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status: RewardStatus;
}

interface RewardFormDialogProps {
  open: boolean;
  editing: Reward | null;
  onClose: () => void;
  onSaved: () => void;
}

function RewardFormDialog({ open, editing, onClose, onSaved }: RewardFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<RewardFormData>({
    defaultValues: {
      name: '',
      description: '',
      pointsRequired: 100,
      stock: 10,
      status: 'Active',
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      reset(
        editing
          ? {
            name: editing.name,
            description: editing.description,
            pointsRequired: editing.pointsRequired,
            stock: editing.stock,
            status: editing.status,
          }
          : { name: '', description: '', pointsRequired: 100, stock: 10, status: 'Active' },
      );
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: RewardFormData) => {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const payload: UpdateRewardPayload = {
          name: data.name,
          description: data.description,
          pointsRequired: Number(data.pointsRequired),
          stock: Number(data.stock),
          status: data.status,
        };
        await adminUpdateReward(editing.id, payload);
      } else {
        const payload: CreateRewardPayload = {
          name: data.name,
          description: data.description,
          pointsRequired: Number(data.pointsRequired),
          stock: Number(data.stock),
          status: data.status,
        };
        await adminCreateReward(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          {editing ? 'Edit Reward' : 'New Reward'}
        </Typography>
        {!saving && (
          <IconButton size="small" onClick={onClose} aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}

          <Controller name="name" control={control} rules={{ required: 'Name is required', minLength: { value: 1, message: 'Name is required' } }}
            render={({ field }) => (
              <TextField {...field} label="Reward Name" size="small" fullWidth error={!!errors.name}
                helperText={errors.name?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            )} />

          <Controller name="description" control={control} rules={{ required: 'Description is required' }}
            render={({ field }) => (
              <TextField {...field} label="Description" size="small" fullWidth multiline rows={3} error={!!errors.description}
                helperText={errors.description?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            )} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller name="pointsRequired" control={control}
                rules={{ required: 'Required', min: { value: 1, message: 'Min 1 XP' } }}
                render={({ field }) => (
                  <TextField {...field} label="Points Required (XP)" type="number" size="small" fullWidth
                    error={!!errors.pointsRequired} helperText={errors.pointsRequired?.message}
                    inputProps={{ min: 1 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                )} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="stock" control={control}
                rules={{ required: 'Required', min: { value: 0, message: 'Min 0' } }}
                render={({ field }) => (
                  <TextField {...field} label="Stock" type="number" size="small" fullWidth
                    error={!!errors.stock} helperText={errors.stock?.message}
                    inputProps={{ min: 0 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                )} />
            </Grid>
          </Grid>

          <Controller name="status" control={control} rules={{ required: 'Status is required' }}
            render={({ field }) => (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Status</Typography>
                <Select {...field} size="small" fullWidth sx={{ borderRadius: '8px' }}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Out_Of_Stock">Out of Stock</MenuItem>
                </Select>
                {errors.status && <FormHelperText error>{errors.status.message}</FormHelperText>}
              </Box>
            )} />
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={saving}
            sx={{ px: 3, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}>
            Discard
          </Button>
          <Button variant="contained" type="submit" disabled={saving}
            sx={{ px: 3, borderRadius: '8px', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : (editing ? 'Save Changes' : 'Create Reward')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ── Redemptions viewer dialog ─────────────────────────────────────────────────

interface RedemptionsDialogProps {
  open: boolean;
  rewardId: string | null;
  rewardName: string;
  onClose: () => void;
}

function RedemptionsDialog({ open, rewardId, rewardName, onClose }: RedemptionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !rewardId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    adminFetchRedemptions(rewardId, controller.signal)
      .then(setRedemptions)
      .catch((err: unknown) => {
        if ((err as any)?.name === 'CanceledError') return;
        setError(extractErrorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, rewardId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Redemptions</Typography>
          <Typography variant="caption" color="text.secondary">{rewardName}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && redemptions.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={4}>No redemptions yet for this reward.</Typography>
        )}
        {!loading && !error && redemptions.length > 0 && (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">EMPLOYEE</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">XP DEDUCTED</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">DATE</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">STATUS</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {redemptions.map((r: any) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.employeeName}</TableCell>
                    <TableCell align="right">
                      <Typography color="error.main" fontWeight={700} variant="body2">-{r.pointsDeducted} XP</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(r.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={r.status} color="success" size="small" sx={{ borderRadius: '6px', fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: '8px' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function AdminRewards() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [redemptionsDialogOpen, setRedemptionsDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Role guard — redirect non-admin users
  useEffect(() => {
    if (user && user.role === 'Employee') {
      navigate('/gamification/rewards', { replace: true });
    }
  }, [user, navigate]);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    adminFetchRewards({ search: search || undefined }, signal)
      .then((result) => setRewards(result.data))
      .catch((err: unknown) => {
        if ((err as any)?.name === 'CanceledError') return;
        setError(extractErrorMessage(err, 'Failed to load rewards'));
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleToggleStatus = async (reward: Reward) => {
    const newStatus: RewardStatus = reward.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await adminUpdateRewardStatus(reward.id, newStatus);
      load();
      setSnack({ open: true, message: `Reward "${reward.name}" set to ${newStatus}`, severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: extractErrorMessage(err), severity: 'error' });
    }
  };

  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingReward(null);
    setFormOpen(true);
  };

  const openRedemptions = (reward: Reward) => {
    setSelectedReward(reward);
    setRedemptionsDialogOpen(true);
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Breadcrumbs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" href="#"
            onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Link underline="hover" color="inherit" href="#"
            onClick={(e) => { e.preventDefault(); navigate('/gamification/rewards'); }}>
            Rewards
          </Link>
          <Typography color="text.primary">Manage</Typography>
        </Breadcrumbs>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ borderRadius: '8px', px: 3, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
          New Reward
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>Manage Rewards</Typography>

      {/* Search */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {rewards.length} reward{rewards.length !== 1 ? 's' : ''}
          </Typography>
          <TextField size="small" placeholder="Search rewards..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
            }}
            sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        )}

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {!loading && !error && (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">NAME</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">XP COST</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">STOCK</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">STATUS</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">REDEMPTIONS</Typography></TableCell>
                  <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">ACTIONS</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rewards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No rewards found. Create the first one!</Typography>
                    </TableCell>
                  </TableRow>
                ) : rewards.map((reward) => (
                  <TableRow key={reward.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{reward.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                        {reward.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="warning.main">{reward.pointsRequired} XP</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={reward.stock === 0 ? 'error.main' : 'text.primary'}>
                        {reward.stock}
                      </Typography>
                    </TableCell>
                    <TableCell><StatusChip status={reward.status} /></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {(reward.redemptionCount ?? 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="View redemptions">
                          <IconButton size="small" onClick={() => openRedemptions(reward)}>
                            <ListAltIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(reward)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={reward.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(reward)}
                            color={reward.status === 'Active' ? 'error' : 'success'}
                          >
                            <PowerSettingsNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Reward form dialog */}
      <RewardFormDialog
        open={formOpen}
        editing={editingReward}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      {/* Redemptions viewer */}
      <RedemptionsDialog
        open={redemptionsDialogOpen}
        rewardId={selectedReward?.id ?? null}
        rewardName={selectedReward?.name ?? ''}
        onClose={() => setRedemptionsDialogOpen(false)}
      />

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: '8px' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
