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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
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
import HistoryIcon from '@mui/icons-material/History';
import StorefrontIcon from '@mui/icons-material/Storefront';
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
    return { label: 'Out of Stock', color: 'error', canRedeem: false, reason: 'This reward is currently out of stock.' };
  }
  if (balance < reward.pointsRequired) {
    return {
      label: `Need ${(reward.pointsRequired - balance).toLocaleString()} more XP`,
      color: 'warning',
      canRedeem: false,
      reason: `You need ${(reward.pointsRequired - balance).toLocaleString()} more XP to redeem this reward.`,
    };
  }
  return { label: 'Available', color: 'success', canRedeem: true };
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function RewardCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="rounded" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={22} />
            <Skeleton width="35%" height={18} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Skeleton width={80} height={26} />
          <Skeleton width={70} height={26} />
        </Box>
      </CardContent>
      <Box sx={{ px: 2, pb: 2 }}>
        <Skeleton width="100%" height={36} />
      </Box>
    </Card>
  );
}

// ── Reward icon fallback ───────────────────────────────────────────────────────

function RewardIconFallback({ canRedeem }: { canRedeem: boolean }) {
  return (
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 2,
        bgcolor: canRedeem ? 'primary.main' : 'action.disabledBackground',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <CardGiftcardIcon
        sx={{
          color: canRedeem ? 'primary.contrastText' : 'text.disabled',
          fontSize: 28,
        }}
      />
    </Box>
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
  const lowStock = reward.stock > 0 && reward.stock <= 5;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: reward.status === 'Inactive' ? 0.65 : 1,
        transition: 'box-shadow 0.15s, transform 0.1s',
        '&:hover': canRedeem
          ? { boxShadow: (t) => t.palette.mode === 'dark' ? '0 4px 20px rgba(56,189,248,0.15)' : '0 4px 16px rgba(74,107,138,0.14)', transform: 'translateY(-1px)' }
          : {},
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Header row: icon + name/status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
          <RewardIconFallback canRedeem={canRedeem} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Category — API does not provide category; shown as placeholder */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
              Reward
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ lineHeight: 1.3 }}>
              {reward.name}
            </Typography>
            <Chip
              label={label}
              color={color}
              size="small"
              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5, minHeight: 36, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {reward.description}
        </Typography>

        {/* XP cost + stock */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={<StarIcon sx={{ fontSize: '0.85rem !important' }} />}
            label={`${reward.pointsRequired.toLocaleString()} XP`}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          />
          {reward.stock > 0 ? (
            <Chip
              label={lowStock ? `Only ${reward.stock} left!` : `${reward.stock} in stock`}
              size="small"
              variant="outlined"
              color={lowStock ? 'warning' : 'default'}
              sx={{ fontSize: '0.72rem' }}
            />
          ) : (
            <Chip label="No stock" size="small" color="error" variant="outlined" sx={{ fontSize: '0.72rem' }} />
          )}
        </Box>

        {/* Insufficient XP or other reason note */}
        {!canRedeem && reason && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, fontStyle: 'italic', lineHeight: 1.3 }}>
            {reason}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Tooltip title={canRedeem ? '' : (reason ?? '')} arrow>
          <span style={{ width: '100%' }}>
            <Button
              fullWidth
              variant={canRedeem ? 'contained' : 'outlined'}
              color="primary"
              disabled={!canRedeem}
              onClick={() => onRedeem(reward)}
              sx={{ fontWeight: 600, py: 0.75 }}
              aria-label={`Redeem ${reward.name} for ${reward.pointsRequired} XP`}
            >
              {canRedeem ? 'Redeem Reward' : 'Redeem'}
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ── XP stats banner ───────────────────────────────────────────────────────────

interface XpStatProps {
  label: string;
  value: string | number;
  loading?: boolean;
  accent?: boolean;
}

function XpStat({ label, value, loading, accent }: XpStatProps) {
  return (
    <Box sx={{ textAlign: 'center', px: 2 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block' }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={80} height={32} sx={{ mx: 'auto' }} />
      ) : (
        <Typography variant="h5" fontWeight={800} color={accent ? 'primary.main' : 'text.primary'} sx={{ lineHeight: 1.2 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          <Typography component="span" variant="body2" fontWeight={600} color="text.secondary" sx={{ ml: 0.5 }}>
            XP
          </Typography>
        </Typography>
      )}
    </Box>
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
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Confirm Redemption</Typography>
        {!loading && (
          <IconButton size="small" onClick={onCancel} aria-label="close dialog">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Reward preview */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            bgcolor: 'action.hover', borderRadius: 2,
          }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 40, height: 40 }}>
              <CardGiftcardIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{reward.name}</Typography>
              <Typography variant="caption" color="text.secondary">{reward.description}</Typography>
            </Box>
          </Box>

          {/* Cost + balance grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>Cost</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="warning.main">
                -{reward.pointsRequired.toLocaleString()} XP
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>Current Balance</Typography>
              <Typography variant="subtitle1" fontWeight={800}>{balance.toLocaleString()} XP</Typography>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }} fontWeight={600}>
              Balance after redemption
            </Typography>
            <Typography variant="h4" fontWeight={800} color={after >= 0 ? 'success.main' : 'error.main'}>
              {after.toLocaleString()}
              <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 0.5 }}>XP</Typography>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          sx={{ flex: 1, color: 'text.secondary', borderColor: 'divider' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={loading}
          sx={{ flex: 1, fontWeight: 700 }}
          aria-label="Confirm redemption"
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Redemption'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Redemption history ────────────────────────────────────────────────────────

interface HistoryProps {
  redemptions: RewardRedemption[];
  loading: boolean;
  error: string | null;
}

function RedemptionHistory({ redemptions, loading, error }: HistoryProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (redemptions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CardGiftcardIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>No redemptions yet</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          Redeem your first reward from the Catalogue tab
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', sm: 'block' }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Reward', 'XP Cost', 'Date', 'Status', 'Ref'].map((h) => (
                <TableCell key={h} align={h === 'XP Cost' ? 'right' : 'left'}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {redemptions.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{r.rewardName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 260 }}>
                    {r.rewardDescription}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color="error.main" fontWeight={700} variant="body2">-{r.pointsDeducted.toLocaleString()} XP</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(r.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={r.status} color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
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
          <Card key={r.id} sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{r.rewardName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(r.redeemedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
              <Typography color="error.main" fontWeight={700} variant="body2">-{r.pointsDeducted.toLocaleString()} XP</Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Chip label={r.status} color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
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

  // Tab: 0 = Catalogue, 1 = My Redemptions
  const [tab, setTab] = useState(0);

  // Catalogue state
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

  // Redemptions state (loaded eagerly for stats)
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [redemptionsError, setRedemptionsError] = useState<string | null>(null);

  // Dialog state
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Idempotency key — one UUID per dialog session, reused on retry
  const pendingIdempotencyKeyRef = useRef<string | null>(null);

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadBalance = useCallback((signal?: AbortSignal) => {
    setLoadingBalance(true);
    fetchBalance(signal)
      .then((b) => setBalance(b))
      .catch(() => {})
      .finally(() => setLoadingBalance(false));
  }, []);

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
          setTotalCount(result.meta.total);
        })
        .catch((err: unknown) => {
          if ((err as any)?.name === 'CanceledError') return;
          setRewardsError(extractErrorMessage(err, 'Failed to load rewards'));
        })
        .finally(() => setLoadingRewards(false));
    },
    [search, availableOnly, sortByPoints, page],
  );

  // Initial load
  useEffect(() => {
    const controller = new AbortController();
    loadRewards(controller.signal);
    if (user) {
      loadBalance(controller.signal);
      loadRedemptions(controller.signal); // load eagerly for stats
    }
    return () => controller.abort();
  }, [loadRewards, loadBalance, loadRedemptions, user]);

  // Search debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setPage(1), 400);
  };

  // ── Redemption flow ──────────────────────────────────────────────────────

  const handleRedeem = (reward: Reward) => {
    pendingIdempotencyKeyRef.current = crypto.randomUUID();
    setConfirmReward(reward);
  };

  const handleConfirmRedeem = async () => {
    if (!confirmReward || redeemLoading) return;
    const idempotencyKey = pendingIdempotencyKeyRef.current ?? crypto.randomUUID();
    pendingIdempotencyKeyRef.current = idempotencyKey;
    setRedeemLoading(true);
    try {
      const result = await redeemReward(confirmReward.id, idempotencyKey);
      pendingIdempotencyKeyRef.current = null;
      setConfirmReward(null);
      setBalance({ employeeId: result.balance.current.toString(), balance: result.balance.current });
      loadRewards();
      loadRedemptions(); // refresh redemptions for stats
      setSnack({
        open: true,
        message: `Redeemed "${confirmReward.name}" — ${result.balance.deducted} XP deducted. New balance: ${result.balance.current.toLocaleString()} XP`,
        severity: 'success',
      });
    } catch (err) {
      // Keep dialog open so user can retry with same idempotency key
      setSnack({ open: true, message: extractErrorMessage(err), severity: 'error' });
    } finally {
      setRedeemLoading(false);
    }
  };

  // ── Derived XP stats ─────────────────────────────────────────────────────

  const availableXp = balance?.balance ?? 0;
  const redeemedXp = redemptions.reduce((sum, r) => sum + r.pointsDeducted, 0);
  const lifetimeXp = availableXp + redeemedXp;

  return (
    <Box>
      {/* Breadcrumb + manage button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}
            sx={{ fontSize: '0.875rem' }}
          >
            Gamification
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.875rem' }}>Rewards Catalogue</Typography>
        </Breadcrumbs>

        {(user?.role === 'Admin' || user?.role === 'ESG_Manager') && (
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => navigate('/gamification/rewards/manage')}
          >
            Manage Rewards
          </Button>
        )}
      </Box>

      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          Rewards Catalogue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Redeem your earned XP for eco-friendly rewards and sustainable perks
        </Typography>
      </Box>

      {/* XP stats banner (employees only) */}
      {user && (
        <Card sx={{ mb: 3, overflow: 'visible' }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              {/* Left: icon + label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 44, height: 44 }}>
                  <EmojiEventsIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">Your XP Balance</Typography>
                  <Typography variant="caption" color="text.secondary">Earned through challenges and CSR activities</Typography>
                </Box>
              </Box>

              {/* Stats */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                flexWrap: 'wrap',
              }}>
                <XpStat label="Available" value={availableXp} loading={loadingBalance} accent />

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

                <XpStat label="Redeemed" value={redeemedXp} loading={loadingRedemptions} />

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

                <XpStat label="Lifetime Earned" value={lifetimeXp} loading={loadingBalance || loadingRedemptions} />
              </Box>

              {/* History shortcut */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<HistoryIcon />}
                onClick={() => setTab(1)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                History
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab
          label="Catalogue"
          icon={<StorefrontIcon fontSize="small" />}
          iconPosition="start"
          sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
        />
        {user && (
          <Tab
            label="My Redemptions"
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
          />
        )}
      </Tabs>

      {/* ── Catalogue tab ─────────────────────────────────────────────────────── */}
      {tab === 0 && (
        <>
          {/* Filters row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search rewards..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={availableOnly}
                  onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Available only</Typography>}
            />

            <Select
              size="small"
              value={sortByPoints}
              onChange={(e) => { setSortByPoints(e.target.value as any); setPage(1); }}
              displayEmpty
              sx={{ minWidth: 170, height: 38 }}
            >
              <MenuItem value="">Sort: Default</MenuItem>
              <MenuItem value="asc">XP: Low to High</MenuItem>
              <MenuItem value="desc">XP: High to Low</MenuItem>
            </Select>

            {/* Result count */}
            {!loadingRewards && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {totalCount} reward{totalCount !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          {/* Error */}
          {rewardsError && (
            <Alert severity="error" sx={{ mb: 3 }}>{rewardsError}</Alert>
          )}

          {/* Rewards grid */}
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
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                      <CardGiftcardIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" fontWeight={600}>No rewards found</Typography>
                      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                        Try adjusting your search or filters
                      </Typography>
                    </Box>
                  </Grid>
                )
                : rewards.map((reward) => (
                  <Grid item xs={12} sm={6} lg={4} key={reward.id}>
                    <RewardCard reward={reward} balance={availableXp} onRedeem={handleRedeem} />
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

      {/* ── Redemption history tab ────────────────────────────────────────────── */}
      {tab === 1 && user && (
        <RedemptionHistory
          redemptions={redemptions}
          loading={loadingRedemptions}
          error={redemptionsError}
        />
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={Boolean(confirmReward)}
        reward={confirmReward}
        balance={availableXp}
        loading={redeemLoading}
        onConfirm={handleConfirmRedeem}
        onCancel={() => {
          if (!redeemLoading) {
            pendingIdempotencyKeyRef.current = null;
            setConfirmReward(null);
          }
        }}
      />

      {/* Snackbar */}
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
          sx={{ minWidth: 320 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
