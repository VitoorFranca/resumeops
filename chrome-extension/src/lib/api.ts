import { getClerkToken } from './auth';
import type { EvaluationResult, ApiError } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ExtensionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super((body as { message?: string }).message ?? body.error);
  }
}

export async function callEvaluate(rawText: string): Promise<EvaluationResult> {
  const token = await getClerkToken();
  if (!token) throw new ExtensionApiError(401, { error: 'Unauthorized' });

  const res = await fetch(`${BASE_URL}/api/extension/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rawText }),
  });

  const data = await res.json();
  if (!res.ok) throw new ExtensionApiError(res.status, data as ApiError);
  return data as EvaluationResult;
}
