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
  Divider,
  Drawer,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Select,
  Slider,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
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

const FILTER_DRAWER_WIDTH = 220;

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: RewardStatus }) {
  const map: Record<RewardStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
    Active:       { label: 'Active',        color: 'success' },
    Inactive:     { label: 'Inactive',      color: 'default' },
    Out_Of_Stock: { label: 'Out of Stock',  color: 'error'   },
  };
  const { label, color } = map[status] ?? { label: status, color: 'default' };
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{ fontSize: '0.7rem', fontWeight: 700 }}
    />
  );
}

// ── Reward form dialog ────────────────────────────────────────────────────────

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
    defaultValues: { name: '', description: '', pointsRequired: 100, stock: 10, status: 'Active' },
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
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {editing ? 'Edit Reward' : 'Create New Reward'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {editing ? 'Update reward details and configuration' : 'Define a new reward employees can redeem'}
          </Typography>
        </Box>
        {!saving && (
          <IconButton size="small" onClick={onClose} aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Reward icon / image — API does not support image URLs yet; using icon placeholder */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: 'primary.contrastText', fontSize: 28 }}>🎁</Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary">Reward Icon</Typography>
              <Typography variant="caption" color="text.secondary">
                Image upload not yet supported by the API. Icon is auto-generated.
              </Typography>
            </Box>
          </Box>

          {/* Name */}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Reward name is required', minLength: { value: 1, message: 'Name is required' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Reward Name"
                size="small"
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name?.message}
                placeholder="e.g. Eco Water Bottle"
              />
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            rules={{ required: 'Description is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                size="small"
                fullWidth
                multiline
                rows={3}
                required
                error={!!errors.description}
                helperText={errors.description?.message}
                placeholder="Describe what this reward offers and how to use it"
              />
            )}
          />

          {/* Points + Stock */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller
                name="pointsRequired"
                control={control}
                rules={{ required: 'Required', min: { value: 1, message: 'Must be at least 1 XP' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="XP Cost"
                    type="number"
                    size="small"
                    fullWidth
                    required
                    error={!!errors.pointsRequired}
                    helperText={errors.pointsRequired?.message ?? 'XP points required to redeem'}
                    inputProps={{ min: 1 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">XP</InputAdornment>,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="stock"
                control={control}
                rules={{ required: 'Required', min: { value: 0, message: 'Cannot be negative' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Available Stock"
                    type="number"
                    size="small"
                    fullWidth
                    required
                    error={!!errors.stock}
                    helperText={errors.stock?.message ?? 'Set to 0 to mark out of stock'}
                    inputProps={{ min: 0 }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Status */}
          <Controller
            name="status"
            control={control}
            rules={{ required: 'Status is required' }}
            render={({ field }) => (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} fontWeight={600}>
                  Status *
                </Typography>
                <Select {...field} size="small" fullWidth>
                  <MenuItem value="Active">Active — visible to employees</MenuItem>
                  <MenuItem value="Inactive">Inactive — hidden from catalogue</MenuItem>
                  <MenuItem value="Out_Of_Stock">Out of Stock — visible but not redeemable</MenuItem>
                </Select>
                {errors.status && <FormHelperText error>{errors.status.message}</FormHelperText>}
              </Box>
            )}
          />

          {/* Note about unsupported fields */}
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            <strong>API note:</strong> Category, redemption instructions, and image URL are not yet supported by the backend schema. Only fields above are stored.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={saving}
            sx={{ px: 3, color: 'text.secondary', borderColor: 'divider' }}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={saving}
            sx={{ px: 3, fontWeight: 700 }}
          >
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Redemption History</Typography>
          <Typography variant="caption" color="text.secondary">{rewardName}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="close"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && redemptions.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={6}>
            No redemptions yet for this reward.
          </Typography>
        )}
        {!loading && !error && redemptions.length > 0 && (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Employee', 'XP Deducted', 'Date', 'Status'].map((h) => (
                    <TableCell key={h} align={h === 'XP Deducted' ? 'right' : 'left'}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {redemptions.map((r: any) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.employeeName}</TableCell>
                    <TableCell align="right">
                      <Typography color="error.main" fontWeight={700} variant="body2">
                        -{r.pointsDeducted.toLocaleString()} XP
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(r.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={r.status} color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: 'divider', color: 'text.secondary' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  statusFilter: RewardStatus | 'All';
  onStatusChange: (v: RewardStatus | 'All') => void;
  pointsRange: [number, number];
  onPointsChange: (v: [number, number]) => void;
  onClear: () => void;
  resultCount: number;
}

function FilterPanel({ statusFilter, onStatusChange, pointsRange, onPointsChange, onClear, resultCount }: FilterPanelProps) {
  const hasFilters = statusFilter !== 'All' || pointsRange[0] !== 0 || pointsRange[1] !== 5000;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Count + clear */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </Typography>
        {hasFilters && (
          <Button size="small" onClick={onClear} sx={{ fontSize: '0.75rem', p: 0, minWidth: 0, color: 'text.secondary' }}>
            Clear all
          </Button>
        )}
      </Box>

      <Divider />

      {/* Status filter */}
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 1 }}>
          Status
        </Typography>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_e, v) => { if (v !== null) onStatusChange(v); }}
          orientation="vertical"
          fullWidth
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              justifyContent: 'flex-start',
              border: 'none',
              borderRadius: '6px !important',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
              px: 1.5,
              py: 0.75,
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                fontWeight: 700,
              },
            },
          }}
        >
          <ToggleButton value="All">All Rewards</ToggleButton>
          <ToggleButton value="Active">Active</ToggleButton>
          <ToggleButton value="Inactive">Inactive</ToggleButton>
          <ToggleButton value="Out_Of_Stock">Out of Stock</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider />

      {/* Points range */}
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', mb: 2 }}>
          XP Range
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={pointsRange}
            min={0}
            max={5000}
            step={50}
            onChange={(_e, v) => onPointsChange(v as [number, number])}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v} XP`}
            color="primary"
            size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{pointsRange[0]} XP</Typography>
            <Typography variant="caption" color="text.secondary">{pointsRange[1]} XP</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function AdminRewards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<RewardStatus | 'All'>('All');
  const [pointsRange, setPointsRange] = useState<[number, number]>([0, 5000]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [redemptionsDialogOpen, setRedemptionsDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Role guard
  useEffect(() => {
    if (user && user.role === 'Employee') {
      navigate('/gamification/rewards', { replace: true });
    }
  }, [user, navigate]);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    adminFetchRewards(
      {
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        minPoints: pointsRange[0] > 0 ? pointsRange[0] : undefined,
        maxPoints: pointsRange[1] < 5000 ? pointsRange[1] : undefined,
      },
      signal,
    )
      .then((result) => setRewards(result.data))
      .catch((err: unknown) => {
        if ((err as any)?.name === 'CanceledError') return;
        setError(extractErrorMessage(err, 'Failed to load rewards'));
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, pointsRange]);

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

  const handleClearFilters = () => {
    setStatusFilter('All');
    setPointsRange([0, 5000]);
    setSearch('');
  };

  const filterPanel = (
    <FilterPanel
      statusFilter={statusFilter}
      onStatusChange={(v) => setStatusFilter(v)}
      pointsRange={pointsRange}
      onPointsChange={setPointsRange}
      onClear={handleClearFilters}
      resultCount={rewards.length}
    />
  );

  return (
    <Box>
      {/* Breadcrumb + Create button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" href="#"
            onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}
            sx={{ fontSize: '0.875rem' }}>
            Gamification
          </Link>
          <Link underline="hover" color="inherit" href="#"
            onClick={(e) => { e.preventDefault(); navigate('/gamification/rewards'); }}
            sx={{ fontSize: '0.875rem' }}>
            Rewards
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.875rem' }}>Inventory</Typography>
        </Breadcrumbs>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => { setEditingReward(null); setFormOpen(true); }}
          sx={{ fontWeight: 700 }}
        >
          Create New Reward
        </Button>
      </Box>

      {/* Page title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          Rewards Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create, configure and manage rewards available to employees in the ESG catalogue
        </Typography>
      </Box>

      {/* Body: filter panel + inventory table */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* Desktop filter panel */}
        {!isMobile && (
          <Box
            sx={{
              width: FILTER_DRAWER_WIDTH,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
            }}
          >
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                Filters
              </Typography>
              {filterPanel}
            </Card>
          </Box>
        )}

        {/* Main inventory panel */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ overflow: 'hidden' }}>
            {/* Table toolbar */}
            <Box sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* Mobile filter toggle */}
                {isMobile && (
                  <Tooltip title="Filters">
                    <IconButton
                      size="small"
                      onClick={() => setMobileFilterOpen(true)}
                      aria-label="open filters"
                    >
                      <FilterListIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {!loading && (
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {rewards.length} reward{rewards.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>

              <TextField
                size="small"
                placeholder="Search rewards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 220 } }}
              />
            </Box>

            {/* Loading */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error */}
            {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

            {/* Table */}
            {!loading && !error && (
              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {[
                        { label: 'Reward',       align: 'left'  as const },
                        { label: 'XP Cost',      align: 'right' as const },
                        { label: 'Stock',        align: 'right' as const },
                        { label: 'Status',       align: 'left'  as const },
                        { label: 'Redemptions',  align: 'right' as const },
                        { label: 'Updated',      align: 'left'  as const },
                        { label: 'Actions',      align: 'right' as const },
                      ].map((col) => (
                        <TableCell key={col.label} align={col.align}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {col.label}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rewards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography color="text.secondary" fontWeight={600}>No rewards found</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {search || statusFilter !== 'All' ? 'Try adjusting filters' : 'Create your first reward'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rewards.map((reward) => (
                        <TableRow key={reward.id} hover>
                          <TableCell sx={{ maxWidth: { xs: 140, sm: 260 } }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{reward.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                              {reward.description}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="warning.main">
                              {reward.pointsRequired.toLocaleString()} XP
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={reward.stock === 0 ? 'error.main' : reward.stock <= 5 ? 'warning.main' : 'text.primary'}
                            >
                              {reward.stock}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <StatusChip status={reward.status} />
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {(reward.redemptionCount ?? 0).toLocaleString()}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(reward.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                              <Tooltip title="View redemptions" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => { setSelectedReward(reward); setRedemptionsDialogOpen(true); }}
                                  aria-label={`View redemptions for ${reward.name}`}
                                >
                                  <ListAltIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit reward" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => { setEditingReward(reward); setFormOpen(true); }}
                                  aria-label={`Edit ${reward.name}`}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={reward.status === 'Active' ? 'Deactivate' : 'Activate'} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleStatus(reward)}
                                  color={reward.status === 'Active' ? 'error' : 'success'}
                                  aria-label={reward.status === 'Active' ? `Deactivate ${reward.name}` : `Activate ${reward.name}`}
                                >
                                  <PowerSettingsNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      </Box>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="left"
        open={isMobile && mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{ sx: { width: 280, p: 2.5 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Filters</Typography>
          <IconButton size="small" onClick={() => setMobileFilterOpen(false)} aria-label="close filters">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        {filterPanel}
        <Box sx={{ mt: 3 }}>
          <Button fullWidth variant="contained" color="primary" onClick={() => setMobileFilterOpen(false)}>
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Create/Edit dialog */}
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
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
