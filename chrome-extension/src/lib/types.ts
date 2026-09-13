export interface JobExtraction {
  title: string | null;
  company: string | null;
  rawText: string;
  sourceUrl: string;
}

export interface Gap {
  requirement: string;
  isBlocker: boolean;
  profileHas: string | null;
  mitigation: string;
}

export interface TopChange {
  section: string;
  proposed: string;
  reason: string;
}

export type Legitimacy = 'HIGH_CONFIDENCE' | 'PROCEED_WITH_CAUTION' | 'SUSPICIOUS';

export interface EvaluationResult {
  jobId: string;
  title: string;
  company: string;
  archetype: string;
  globalScore: number;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  scoreExplanations: { A: string; B: string; C: string; D: string };
  gaps: Gap[];
  topChanges: TopChange[];
  legitimacy: Legitimacy;
  legitimacyNotes: string;
}

export type ApiError =
  | { error: 'Unauthorized' | 'Invalid token' }
  | { error: 'quota_exceeded'; limit: number; plan: string }
  | { error: 'profile_not_found'; message: string }
  | { error: 'evaluation_failed'; message: string }
  | { error: 'rawText too short' }
  | { error: string; message?: string };

export type MessageToBackground =
  | { type: 'JOB_FOUND'; payload: JobExtraction }
  | { type: 'GET_JOB' }
  | { type: 'BADGE_HINT' };

export type MessageToPopup = { type: 'JOB_DATA'; payload: JobExtraction | null };
