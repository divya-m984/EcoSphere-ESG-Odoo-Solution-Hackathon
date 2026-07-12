import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SearchIcon from '@mui/icons-material/Search';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  extractErrorMessage,
  fetchBalance,
  fetchMyRedemptions,
  fetchRewards,
  redeemReward,
} from '@/services/rewards.service';
import type { Reward, RewardRedemption, XpBalance } from '@/types/rewards';

// ── Reward status helpers ──────────────────────────────────────────────────────

function rewardChipProps(reward: Reward, balance: number): {
  label: string;
  color: 'success' | 'warning' | 'default' | 'error';
  canRedeem: boolean;
  reason?: string;
} {
  if (reward.status === 'Inactive') {
    return { label: 'Unavailable', color: 'default', canRedeem: false, reason: 'This reward is not currently available.' };
  }
  if (reward.status === 'Out_Of_Stock' || reward.stock === 0) {
    return { label: 'Out of stock', color: 'error', canRedeem: false, reason: 'This reward is currently out of stock.' };
  }
  if (balance < reward.pointsRequired) {
    return {
      label: `Need ${reward.pointsRequired - balance} more XP`,
      color: 'warning',
      canRedeem: false,
      reason: `You need ${reward.pointsRequired - balance} more XP to redeem this reward.`,
    };
  }
  return { label: 'Available', color: 'success', canRedeem: true };
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function RewardCardSkeleton() {
  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={24} />
            <Skeleton width="40%" height={18} />
          </Box>
        </Box>
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Skeleton width={80} height={28} />
          <Skeleton width={80} height={28} />
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Reward card ───────────────────────────────────────────────────────────────

interface RewardCardProps {
  reward: Reward;
  balance: number;
  onRedeem: (reward: Reward) => void;
}

function RewardCard({ reward, balance, onRedeem }: RewardCardProps) {
  const { label, color, canRedeem, reason } = rewardChipProps(reward, balance);

  return (
    <Card
      sx={{
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: reward.status === 'Inactive' ? 0.6 : 1,
        transition: 'box-shadow 0.15s',
        '&:hover': canRedeem ? { boxShadow: '0 4px 16px rgba(46,125,50,0.12)' } : {},
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: canRedeem ? 'primary.light' : 'action.disabledBackground', width: 48, height: 48 }}>
            <CardGiftcardIcon sx={{ color: canRedeem ? 'primary.main' : 'text.disabled' }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {reward.name}
            </Typography>
            <Chip label={label} color={color} size="small" sx={{ borderRadius: '6px', fontSize: '0.72rem', mt: 0.5 }} />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
          {reward.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<StarIcon sx={{ fontSize: '0.9rem !important' }} />}
            label={`${reward.pointsRequired} XP`}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ borderRadius: '6px', fontSize: '0.75rem' }}
          />
          <Chip
            label={reward.stock > 0 ? `${reward.stock} left` : 'No stock'}
            size="small"
            variant="outlined"
            sx={{ borderRadius: '6px', fontSize: '0.75rem', color: 'text.secondary' }}
          />
        </Box>

        {!canRedeem && reason && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontStyle: 'italic' }}>
            {reason}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Tooltip title={canRedeem ? '' : (reason ?? '')}>
          <span style={{ width: '100%' }}>
            <Button
              fullWidth
              variant={canRedeem ? 'contained' : 'outlined'}
              color="primary"
              disabled={!canRedeem}
              onClick={() => onRedeem(reward)}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor: canRedeem ? '#2E7D32' : undefined,
                '&:hover': canRedeem ? { bgcolor: '#1B5E20' } : undefined,
                '&.Mui-disabled': { bgcolor: 'transparent' },
              }}
            >
              Redeem
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ── Confirmation dialog ───────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  reward: Reward | null;
  balance: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, reward, balance, loading, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!reward) return null;
  const after = balance - reward.pointsRequired;

  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Confirm Redemption</Typography>
        {!loading && (
          <IconButton size="small" onClick={onCancel} aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'rgba(46,125,50,0.06)', borderRadius: '8px' }}>
            <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
              <CardGiftcardIcon color="primary" />
            </Avatar>
            <Typography variant="subtitle2" fontWeight={700}>{reward.name}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '8px', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Cost</Typography>
              <Typography variant="subtitle1" fontWeight={700} color="warning.main">
                -{reward.pointsRequired} XP
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '8px', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">Current Balance</Typography>
              <Typography variant="subtitle1" fontWeight={700}>{balance} XP</Typography>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Balance after redemption
            </Typography>
            <Typography variant="h5" fontWeight={700} color={after >= 0 ? 'success.main' : 'error.main'}>
              {after} XP
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} disabled={loading}
          sx={{ flex: 1, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{ flex: 1, borderRadius: '8px', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Redemption history table ──────────────────────────────────────────────────

interface HistoryProps {
  redemptions: RewardRedemption[];
  loading: boolean;
  error: string | null;
}

function RedemptionHistory({ redemptions, loading, error }: HistoryProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>;
  }

  if (redemptions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CardGiftcardIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No redemptions yet</Typography>
        <Typography variant="caption" color="text.disabled">Redeem your first reward to see it here</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">REWARD</Typography></TableCell>
              <TableCell align="right"><Typography variant="caption" fontWeight={700} color="text.secondary">POINTS</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">DATE</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">STATUS</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">REF</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {redemptions.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.rewardName}</TableCell>
                <TableCell align="right">
                  <Typography color="error.main" fontWeight={700}>-{r.pointsDeducted} XP</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(r.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={r.status} color="success" size="small" sx={{ borderRadius: '6px', fontSize: '0.72rem' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                    {r.id.slice(0, 8)}…
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile list */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {redemptions.map((r) => (
          <Card key={r.id} sx={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none', p: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{r.rewardName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(r.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
              <Typography color="error.main" fontWeight={700} variant="body2">-{r.pointsDeducted} XP</Typography>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Chip label={r.status} color="success" size="small" sx={{ borderRadius: '6px', fontSize: '0.7rem' }} />
            </Box>
          </Card>
        ))}
      </Box>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Rewards() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab
  const [tab, setTab] = useState(0);

  // Catalogue state
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortByPoints, setSortByPoints] = useState<'asc' | 'desc' | ''>('');

  // Balance state
  const [balance, setBalance] = useState<XpBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Redemptions state
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [redemptionsError, setRedemptionsError] = useState<string | null>(null);

  // Dialog state
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Idempotency: one UUID is generated per dialog session and reused on retry.
  // Cleared on success or explicit cancel; kept across retries after a network error.
  const pendingIdempotencyKeyRef = useRef<string | null>(null);

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Debounce search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBalance = useCallback((signal?: AbortSignal) => {
    setLoadingBalance(true);
    fetchBalance(signal)
      .then((b) => setBalance(b))
      .catch(() => {})
      .finally(() => setLoadingBalance(false));
  }, []);

  const loadRewards = useCallback(
    (signal?: AbortSignal) => {
      setLoadingRewards(true);
      setRewardsError(null);
      fetchRewards(
        {
          search: search || undefined,
          availableOnly: availableOnly || undefined,
          sortByPoints: sortByPoints || undefined,
          page,
          limit: 12,
        },
        signal,
      )
        .then((result) => {
          setRewards(result.data);
          setTotalPages(result.meta.totalPages);
        })
        .catch((err: unknown) => {
          if ((err as any)?.name === 'CanceledError') return;
          setRewardsError(extractErrorMessage(err, 'Failed to load rewards'));
        })
        .finally(() => setLoadingRewards(false));
    },
    [search, availableOnly, sortByPoints, page],
  );

  const loadRedemptions = useCallback((signal?: AbortSignal) => {
    setLoadingRedemptions(true);
    setRedemptionsError(null);
    fetchMyRedemptions(signal)
      .then(setRedemptions)
      .catch((err: unknown) => {
        if ((err as any)?.name === 'CanceledError') return;
        setRedemptionsError(extractErrorMessage(err, 'Failed to load redemption history'));
      })
      .finally(() => setLoadingRedemptions(false));
  }, []);

  // Initial load
  useEffect(() => {
    const controller = new AbortController();
    loadRewards(controller.signal);
    if (user) {
      loadBalance(controller.signal);
    }
    return () => controller.abort();
  }, [loadRewards, loadBalance, user]);

  // Load redemptions when switching to history tab
  useEffect(() => {
    if (tab === 1 && user) {
      const controller = new AbortController();
      loadRedemptions(controller.signal);
      return () => controller.abort();
    }
  }, [tab, user, loadRedemptions]);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setPage(1), 400);
  };

  const handleRedeem = (reward: Reward) => {
    // Generate a fresh idempotency key when the dialog opens for a new redemption
    pendingIdempotencyKeyRef.current = crypto.randomUUID();
    setConfirmReward(reward);
  };

  const handleConfirmRedeem = async () => {
    if (!confirmReward || redeemLoading) return;
    // Reuse the same key if the user retries after a network error (dialog stays open)
    const idempotencyKey = pendingIdempotencyKeyRef.current ?? crypto.randomUUID();
    pendingIdempotencyKeyRef.current = idempotencyKey;
    setRedeemLoading(true);
    try {
      const result = await redeemReward(confirmReward.id, idempotencyKey);
      // Success — clear key and close dialog
      pendingIdempotencyKeyRef.current = null;
      setConfirmReward(null);
      setBalance({ employeeId: result.balance.current.toString(), balance: result.balance.current });
      // Refresh rewards to show updated stock
      loadRewards();
      if (tab === 1) loadRedemptions();
      setSnack({
        open: true,
        message: `Redeemed "${confirmReward.name}" — ${result.balance.deducted} XP deducted. New balance: ${result.balance.current} XP`,
        severity: 'success',
      });
    } catch (err) {
      // Keep dialog open so the user can retry with the same idempotency key.
      // The snackbar shows the error inline without closing the dialog.
      setSnack({ open: true, message: extractErrorMessage(err), severity: 'error' });
    } finally {
      setRedeemLoading(false);
    }
  };

  const currentBalance = balance?.balance ?? 0;

  return (
    <Box sx={{ p: 1 }}>
      {/* Breadcrumbs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link underline="hover" color="inherit" href="#"
            onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Typography color="text.primary">Rewards</Typography>
        </Breadcrumbs>

        {(user?.role === 'Admin' || user?.role === 'ESG_Manager') && (
          <Button variant="outlined" size="small" sx={{ borderRadius: '8px' }}
            onClick={() => navigate('/gamification/rewards/manage')}>
            Manage Rewards
          </Button>
        )}
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Rewards</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Redeem your earned XP for eco-friendly rewards
      </Typography>

      {/* XP Balance banner */}
      {user && (
        <Card sx={{ mb: 3, p: 2, borderRadius: '12px', border: '1px solid rgba(46,125,50,0.2)', bgcolor: 'rgba(46,125,50,0.04)', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ bgcolor: '#2E7D32', width: 44, height: 44 }}>
              <EmojiEventsIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Your XP Balance</Typography>
              {loadingBalance ? (
                <Skeleton width={100} height={32} />
              ) : (
                <Typography variant="h5" fontWeight={800} color="#2E7D32">
                  {currentBalance.toLocaleString()} XP
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Tab label="Catalogue" sx={{ fontWeight: 600, textTransform: 'none' }} />
        {user && <Tab label="My Redemptions" sx={{ fontWeight: 600, textTransform: 'none' }} />}
      </Tabs>

      {/* ── Catalogue tab ── */}
      {tab === 0 && (
        <>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search rewards..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
              }}
              sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <FormControlLabel
              control={<Switch checked={availableOnly} onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }} color="primary" size="small" />}
              label={<Typography variant="body2">Available only</Typography>}
            />
            <Select
              size="small"
              value={sortByPoints}
              onChange={(e) => { setSortByPoints(e.target.value as any); setPage(1); }}
              displayEmpty
              sx={{ borderRadius: '8px', height: '38px', minWidth: 160 }}
            >
              <MenuItem value="">Sort: Default</MenuItem>
              <MenuItem value="asc">Points: Low to High</MenuItem>
              <MenuItem value="desc">Points: High to Low</MenuItem>
            </Select>
          </Box>

          {/* Error state */}
          {rewardsError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {rewardsError}
            </Alert>
          )}

          {/* Grid */}
          <Grid container spacing={2.5}>
            {loadingRewards
              ? Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <RewardCardSkeleton />
                </Grid>
              ))
              : rewards.length === 0
                ? (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <CardGiftcardIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                      <Typography color="text.secondary" variant="h6">No rewards found</Typography>
                      <Typography variant="caption" color="text.disabled">Try adjusting your filters</Typography>
                    </Box>
                  </Grid>
                )
                : rewards.map((reward) => (
                  <Grid item xs={12} sm={6} lg={4} key={reward.id}>
                    <RewardCard reward={reward} balance={currentBalance} onRedeem={handleRedeem} />
                  </Grid>
                ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, p) => setPage(p)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* ── History tab ── */}
      {tab === 1 && user && (
        <RedemptionHistory redemptions={redemptions} loading={loadingRedemptions} error={redemptionsError} />
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={Boolean(confirmReward)}
        reward={confirmReward}
        balance={currentBalance}
        loading={redeemLoading}
        onConfirm={handleConfirmRedeem}
        onCancel={() => {
          if (!redeemLoading) {
            pendingIdempotencyKeyRef.current = null;
            setConfirmReward(null);
          }
        }}
      />

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          iconMapping={{ success: <CheckCircleOutlineIcon /> }}
          sx={{ borderRadius: '8px', minWidth: 320 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
