export type RewardStatus = 'Active' | 'Inactive' | 'Out_Of_Stock';

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status: RewardStatus;
  createdAt: string;
  updatedAt: string;
  redemptionCount?: number; // admin view only
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  rewardDescription: string;
  pointsDeducted: number;
  redeemedAt: string;
  status: 'Completed';
}

export interface XpBalance {
  employeeId: string;
  balance: number;
}

export interface RedeemResult {
  redemption: {
    id: string;
    rewardId: string;
    employeeId: string;
    pointsDeducted: number;
    redeemedAt: string;
  };
  reward: {
    id: string;
    name: string;
    pointsRequired: number;
    stock: number;
    status: RewardStatus;
  };
  balance: {
    previous: number;
    current: number;
    deducted: number;
  };
  idempotent?: boolean;
}

export interface PaginatedRewards {
  data: Reward[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Admin form shape
export interface CreateRewardPayload {
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status?: RewardStatus;
}

export interface UpdateRewardPayload {
  name?: string;
  description?: string;
  pointsRequired?: number;
  stock?: number;
  status?: RewardStatus;
}

export interface QueryRewardsParams {
  search?: string;
  status?: RewardStatus;
  availableOnly?: boolean;
  minPoints?: number;
  maxPoints?: number;
  sortByPoints?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
