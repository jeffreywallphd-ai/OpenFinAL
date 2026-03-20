import {
  INVESTMENT_GOALS,
  InvestmentGoal,
  KNOWLEDGE_LEVELS,
  KnowledgeLevel,
  LearnerProfile,
  ProgressMarker,
  RISK_PREFERENCES,
  RiskPreference,
} from '@domain/adaptive-learning';

export const LEARNER_PROFILE_VERSION = 1;
export const PROFILE_COMPLETED_MARKER_KEY = 'learner-profile-completed';
export const SELF_REPORTED_MODULES_MARKER_KEY = 'self-reported-learning-modules-completed';
export const SELF_REPORTED_TRADES_MARKER_KEY = 'self-reported-practice-trades-completed';

export const EXPERIENCE_MARKERS = [
  'opened-investment-account',
  'owns-investments',
  'completed-learning-module',
  'placed-practice-trade',
  'uses-financial-news',
  'tracks-a-budget',
] as const;
export type ExperienceMarker = (typeof EXPERIENCE_MARKERS)[number];

export const INTERESTED_TAGS = [
  'stocks',
  'income',
  'retirement',
  'portfolio',
  'risk-management',
  'research',
  'guided-tutorials',
] as const;
export type InterestedTag = (typeof INTERESTED_TAGS)[number];

export interface LearnerProfileSurveyInput {
  knowledgeLevel: KnowledgeLevel | '';
  investmentGoals: InvestmentGoal[];
  riskPreference: RiskPreference | '';
  confidenceScore?: number | null;
  selfAssessment?: string;
  interestedTags: InterestedTag[];
  experienceMarkers: ExperienceMarker[];
  learningModulesCompleted?: number | null;
  practiceTradesCompleted?: number | null;
}

export interface LearnerProfilePersistenceRecord {
  userId: number;
  learnerId: string;
  knowledgeLevel: string;
  investmentGoalsJson: string;
  riskPreference: string;
  confidenceScore: number | null;
  selfAssessment: string | null;
  interestedTagsJson: string;
  experienceMarkersJson: string;
  completedAssetsJson: string;
  progressMarkersJson: string;
  unlockedAssetIdsJson: string;
  hiddenAssetIdsJson: string;
  profileVersion: number;
  updatedAt: string;
}

function isKnownKnowledgeLevel(value: string): value is KnowledgeLevel {
  return KNOWLEDGE_LEVELS.includes(value as KnowledgeLevel);
}

function isKnownRiskPreference(value: string): value is RiskPreference {
  return RISK_PREFERENCES.includes(value as RiskPreference);
}

function uniqueValues<TValue extends string>(values: TValue[]): TValue[] {
  return [...new Set(values)];
}

function parseJsonArray<TValue>(value: unknown, fallback: TValue[] = []): TValue[] {
  if (Array.isArray(value)) {
    return value as TValue[];
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as TValue[]) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function clampOptionalConfidenceScore(value?: number | null): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return Math.max(1, Math.min(5, Math.round(value)));
}

function normalizeOptionalNumber(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function normalizeSelfAssessment(value?: string): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length ? normalized : null;
}

function mergeProgressMarkers(existing: ProgressMarker[], incoming: ProgressMarker[]): ProgressMarker[] {
  const merged = new Map<string, ProgressMarker>();

  for (const marker of existing) {
    merged.set(marker.key, marker);
  }

  for (const marker of incoming) {
    merged.set(marker.key, marker);
  }

  return [...merged.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export function createDefaultLearnerProfile(learnerId: string): LearnerProfile {
  return {
    learnerId,
    knowledgeLevel: 'unknown',
    investmentGoals: [],
    riskPreference: 'unknown',
    confidenceScore: null,
    selfAssessment: null,
    interestedTags: [],
    experienceMarkers: [],
    completedAssets: [],
    progressMarkers: [],
    unlockedAssetIds: [],
    hiddenAssetIds: [],
    profileVersion: LEARNER_PROFILE_VERSION,
    updatedAt: new Date(0).toISOString(),
  };
}

export function createSurveyInputFromProfile(profile: LearnerProfile): LearnerProfileSurveyInput {
  const modulesMarker = profile.progressMarkers.find((marker) => marker.key === SELF_REPORTED_MODULES_MARKER_KEY);
  const tradesMarker = profile.progressMarkers.find((marker) => marker.key === SELF_REPORTED_TRADES_MARKER_KEY);

  return {
    knowledgeLevel: profile.knowledgeLevel,
    investmentGoals: [...profile.investmentGoals],
    riskPreference: profile.riskPreference,
    confidenceScore: profile.confidenceScore ?? null,
    selfAssessment: profile.selfAssessment ?? '',
    interestedTags: uniqueValues((profile.interestedTags ?? []).filter((tag): tag is InterestedTag =>
      INTERESTED_TAGS.includes(tag as InterestedTag),
    )),
    experienceMarkers: uniqueValues(((profile.experienceMarkers ?? [])).filter((marker): marker is ExperienceMarker =>
      EXPERIENCE_MARKERS.includes(marker as ExperienceMarker),
    )),
    learningModulesCompleted: modulesMarker?.value ?? 0,
    practiceTradesCompleted: tradesMarker?.value ?? 0,
  };
}

export function validateLearnerProfileSurveyInput(input: LearnerProfileSurveyInput): string[] {
  const errors: string[] = [];

  if (!input.knowledgeLevel || !isKnownKnowledgeLevel(input.knowledgeLevel) || input.knowledgeLevel === 'unknown') {
    errors.push('Select the learner\'s current financial knowledge level.');
  }

  if (!input.riskPreference || !isKnownRiskPreference(input.riskPreference) || input.riskPreference === 'unknown') {
    errors.push('Select the learner\'s risk preference.');
  }

  if (!Array.isArray(input.investmentGoals) || input.investmentGoals.length === 0) {
    errors.push('Select at least one investment goal.');
  }

  const invalidGoals = input.investmentGoals.filter((goal) => !INVESTMENT_GOALS.includes(goal));
  if (invalidGoals.length > 0) {
    errors.push('One or more investment goals were invalid.');
  }

  if (input.confidenceScore !== undefined && input.confidenceScore !== null) {
    if (!Number.isInteger(input.confidenceScore) || input.confidenceScore < 1 || input.confidenceScore > 5) {
      errors.push('Confidence score must be a whole number between 1 and 5.');
    }
  }

  if ((input.selfAssessment?.trim().length ?? 0) > 500) {
    errors.push('Self-assessment must be 500 characters or fewer.');
  }

  return errors;
}

export function buildLearnerProfileFromSurvey(
  learnerId: string,
  input: LearnerProfileSurveyInput,
  existingProfile?: LearnerProfile,
  now: string = new Date().toISOString(),
): LearnerProfile {
  const baseline = existingProfile ?? createDefaultLearnerProfile(learnerId);

  const surveyMarkers: ProgressMarker[] = [
    {
      key: PROFILE_COMPLETED_MARKER_KEY,
      value: 1,
      updatedAt: now,
    },
    {
      key: SELF_REPORTED_MODULES_MARKER_KEY,
      value: normalizeOptionalNumber(input.learningModulesCompleted),
      updatedAt: now,
    },
    {
      key: SELF_REPORTED_TRADES_MARKER_KEY,
      value: normalizeOptionalNumber(input.practiceTradesCompleted),
      updatedAt: now,
    },
  ];

  return {
    ...baseline,
    learnerId,
    knowledgeLevel: input.knowledgeLevel as KnowledgeLevel,
    investmentGoals: uniqueValues(input.investmentGoals),
    riskPreference: input.riskPreference as RiskPreference,
    confidenceScore: clampOptionalConfidenceScore(input.confidenceScore),
    selfAssessment: normalizeSelfAssessment(input.selfAssessment),
    interestedTags: uniqueValues(input.interestedTags ?? []),
    experienceMarkers: uniqueValues(input.experienceMarkers ?? []),
    progressMarkers: mergeProgressMarkers(baseline.progressMarkers ?? [], surveyMarkers),
    profileVersion: LEARNER_PROFILE_VERSION,
    updatedAt: now,
  };
}

export function mapLearnerProfileToPersistenceRecord(
  userId: number,
  profile: LearnerProfile,
): LearnerProfilePersistenceRecord {
  return {
    userId,
    learnerId: profile.learnerId,
    knowledgeLevel: profile.knowledgeLevel,
    investmentGoalsJson: JSON.stringify(profile.investmentGoals ?? []),
    riskPreference: profile.riskPreference,
    confidenceScore: profile.confidenceScore ?? null,
    selfAssessment: profile.selfAssessment ?? null,
    interestedTagsJson: JSON.stringify(profile.interestedTags ?? []),
    experienceMarkersJson: JSON.stringify(profile.experienceMarkers ?? []),
    completedAssetsJson: JSON.stringify(profile.completedAssets ?? []),
    progressMarkersJson: JSON.stringify(profile.progressMarkers ?? []),
    unlockedAssetIdsJson: JSON.stringify(profile.unlockedAssetIds ?? []),
    hiddenAssetIdsJson: JSON.stringify(profile.hiddenAssetIds ?? []),
    profileVersion: profile.profileVersion ?? LEARNER_PROFILE_VERSION,
    updatedAt: profile.updatedAt ?? new Date().toISOString(),
  };
}

export function mapPersistenceRecordToLearnerProfile(
  record: Partial<LearnerProfilePersistenceRecord> & { learnerId?: string; userId?: number },
): LearnerProfile {
  const learnerId = record.learnerId ?? `user-${record.userId ?? 'unknown'}`;
  const knowledgeLevel: KnowledgeLevel = isKnownKnowledgeLevel(String(record.knowledgeLevel))
    ? (record.knowledgeLevel as KnowledgeLevel)
    : 'unknown';
  const riskPreference: RiskPreference = isKnownRiskPreference(String(record.riskPreference))
    ? (record.riskPreference as RiskPreference)
    : 'unknown';

  return {
    learnerId,
    knowledgeLevel,
    investmentGoals: parseJsonArray<InvestmentGoal>(record.investmentGoalsJson).filter((goal) => INVESTMENT_GOALS.includes(goal)),
    riskPreference,
    confidenceScore: clampOptionalConfidenceScore(record.confidenceScore),
    selfAssessment: normalizeSelfAssessment(record.selfAssessment ?? undefined),
    interestedTags: parseJsonArray<string>(record.interestedTagsJson),
    experienceMarkers: parseJsonArray<string>(record.experienceMarkersJson),
    completedAssets: parseJsonArray(record.completedAssetsJson),
    progressMarkers: parseJsonArray(record.progressMarkersJson),
    unlockedAssetIds: parseJsonArray(record.unlockedAssetIdsJson),
    hiddenAssetIds: parseJsonArray(record.hiddenAssetIdsJson),
    profileVersion: typeof record.profileVersion === 'number' ? record.profileVersion : LEARNER_PROFILE_VERSION,
    updatedAt: typeof record.updatedAt === 'string' && record.updatedAt.length > 0 ? record.updatedAt : new Date(0).toISOString(),
  };
}

export function hasCompletedLearnerProfile(profile: LearnerProfile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  return profile.knowledgeLevel !== 'unknown'
    && profile.riskPreference !== 'unknown'
    && Array.isArray(profile.investmentGoals)
    && profile.investmentGoals.length > 0;
}
