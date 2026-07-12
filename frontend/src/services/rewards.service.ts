import api from './api';
import type {
  CreateRewardPayload,
  PaginatedRewards,
  QueryRewardsParams,
  RedeemResult,
  Reward,
  RewardRedemption,
  UpdateRewardPayload,
  XpBalance,
} from '../types/rewards';

// ── Employee endpoints ────────────────────────────────────────────────────────

export async function fetchRewards(
  params: QueryRewardsParams = {},
  signal?: AbortSignal,
): Promise<PaginatedRewards> {
  const { data } = await api.get<PaginatedRewards>('/rewards', { params, signal });
  return data;
}

export async function fetchReward(id: string, signal?: AbortSignal): Promise<Reward> {
  const { data } = await api.get<Reward>(`/rewards/${id}`, { signal });
  return data;
}

export async function fetchBalance(signal?: AbortSignal): Promise<XpBalance> {
  const { data } = await api.get<XpBalance>('/rewards/balance', { signal });
  return data;
}

/**
 * Redeem a reward. Pass idempotencyKey (a UUID generated once per dialog session)
 * so the server can deduplicate retries — the same key is safe to resend.
 */
export async function redeemReward(rewardId: string, idempotencyKey?: string): Promise<RedeemResult> {
  const { data } = await api.post<RedeemResult>(`/rewards/${rewardId}/redeem`, {
    ...(idempotencyKey ? { idempotencyKey } : {}),
  });
  return data;
}

export async function fetchMyRedemptions(signal?: AbortSignal): Promise<RewardRedemption[]> {
  const { data } = await api.get<RewardRedemption[]>('/rewards/redemptions/me', { signal });
  return data;
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

export async function adminFetchRewards(
  params: QueryRewardsParams = {},
  signal?: AbortSignal,
): Promise<PaginatedRewards> {
  const { data } = await api.get<PaginatedRewards>('/admin/rewards', { params, signal });
  return data;
}

export async function adminCreateReward(payload: CreateRewardPayload): Promise<Reward> {
  const { data } = await api.post<Reward>('/admin/rewards', payload);
  return data;
}

export async function adminUpdateReward(id: string, payload: UpdateRewardPayload): Promise<Reward> {
  const { data } = await api.patch<Reward>(`/admin/rewards/${id}`, payload);
  return data;
}

export async function adminUpdateRewardStatus(
  id: string,
  status: string,
): Promise<Reward> {
  const { data } = await api.patch<Reward>(`/admin/rewards/${id}/status`, { status });
  return data;
}

export async function adminFetchRedemptions(rewardId: string, signal?: AbortSignal) {
  const { data } = await api.get(`/admin/rewards/${rewardId}/redemptions`, { signal });
  return data;
}

// ── Error message helper ──────────────────────────────────────────────────────

export function extractErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (err && typeof err === 'object') {
    const e = err as any;
    const serverMessage = e?.response?.data?.message;
    if (typeof serverMessage === 'string') return serverMessage;
    if (Array.isArray(serverMessage)) return serverMessage.join('; ');
  }
  return fallback;
}
