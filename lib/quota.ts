import { db } from './db/client';

const LIMITS = {
  FREE: { evaluations: 3, resumes: 0 },
  PRO: { evaluations: 999, resumes: 999 },
} as const;

export class QuotaError extends Error {
  constructor(
    public type: string,
    public limit: number,
    public plan: string,
  ) {
    super(`Quota exceeded: ${type} (limit: ${limit}, plan: ${plan})`);
    this.name = 'QuotaError';
  }
}

export class PaywallError extends Error {
  constructor() {
    super('Pro plan required');
    this.name = 'PaywallError';
  }
}

export async function enforceQuota(userId: string, type: 'evaluations' | 'resumes') {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const plan = user.plan as keyof typeof LIMITS;
  const limit = LIMITS[plan]?.[type] ?? 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await db.job.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });

  if (count >= limit) {
    throw new QuotaError(type, limit, user.plan);
  }
}

export async function requirePlan(userId: string, requiredPlan: 'PRO') {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.plan !== requiredPlan) {
    throw new PaywallError();
  }
}
