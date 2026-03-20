export const KNOWLEDGE_LEVELS = ['unknown', 'beginner', 'intermediate', 'advanced', 'expert'] as const;
export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number];

export const INVESTMENT_GOALS = [
  'capital-preservation',
  'income',
  'growth',
  'retirement',
  'education-savings',
  'diversification',
  'speculation',
] as const;
export type InvestmentGoal = (typeof INVESTMENT_GOALS)[number];

export const RISK_PREFERENCES = [
  'unknown',
  'very-conservative',
  'conservative',
  'moderate',
  'aggressive',
  'speculative',
] as const;
export type RiskPreference = (typeof RISK_PREFERENCES)[number];

export const ADAPTIVE_ASSET_KINDS = ['feature', 'learning-module', 'tutorial', 'help-hint'] as const;
export type AdaptiveAssetKind = (typeof ADAPTIVE_ASSET_KINDS)[number];

export const FEATURE_CATEGORIES = [
  'portfolio',
  'research',
  'analysis',
  'planning',
  'trading',
  'data-visualization',
  'automation',
  'account',
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export const LEARNING_CATEGORIES = [
  'foundations',
  'risk-management',
  'portfolio-construction',
  'security-analysis',
  'market-mechanics',
  'behavioral-finance',
  'platform-guidance',
] as const;
export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];

export type AdaptiveCategory = FeatureCategory | LearningCategory;

export const FEATURE_AVAILABILITY_STATES = ['visible', 'hidden', 'locked', 'deemphasized'] as const;
export type FeatureAvailabilityState = (typeof FEATURE_AVAILABILITY_STATES)[number];

export interface AdaptiveAssetReference {
  assetId: string;
  kind: AdaptiveAssetKind;
}

export interface ProgressMarker {
  key: string;
  value: number;
  updatedAt: string;
}

export interface CompletionMarker {
  assetId: string;
  completedAt: string;
  completionType: 'viewed' | 'completed' | 'passed-quiz' | 'dismissed';
}

export interface LearnerProfile {
  learnerId: string;
  knowledgeLevel: KnowledgeLevel;
  investmentGoals: InvestmentGoal[];
  riskPreference: RiskPreference;
  interestedTags: string[];
  completedAssets: CompletionMarker[];
  progressMarkers: ProgressMarker[];
  unlockedAssetIds: string[];
  hiddenAssetIds: string[];
}

export interface AdaptiveGovernance {
  defaultAvailabilityState: FeatureAvailabilityState;
  eligibleForRecommendation: boolean;
  eligibleForHighlighting: boolean;
  visibleDuringOnboarding?: boolean;
  lockWhenPrerequisitesUnmet?: boolean;
  hideWhenLearnerDismisses?: boolean;
}

interface AdaptiveAssetMetadataBase {
  id: string;
  key: string;
  kind: AdaptiveAssetKind;
  title: string;
  description: string;
  tags: string[];
  knowledgeLevel: KnowledgeLevel;
  investmentGoals: InvestmentGoal[];
  riskAlignment: RiskPreference[];
  prerequisites: Prerequisite[];
  governance: AdaptiveGovernance;
  relatedAssetIds: string[];
}

export interface AdaptiveFeatureMetadata extends AdaptiveAssetMetadataBase {
  kind: 'feature';
  category: FeatureCategory;
}

export interface LearningModuleMetadata extends AdaptiveAssetMetadataBase {
  kind: 'learning-module';
  category: LearningCategory;
  estimatedDurationMinutes?: number;
}

export interface TutorialMetadata extends AdaptiveAssetMetadataBase {
  kind: 'tutorial';
  category: LearningCategory;
  tutorialForAssetId?: string;
}

export interface HelpHintMetadata extends AdaptiveAssetMetadataBase {
  kind: 'help-hint';
  category: LearningCategory;
  hintForAssetId?: string;
}

export type AdaptiveAssetMetadata =
  | AdaptiveFeatureMetadata
  | LearningModuleMetadata
  | TutorialMetadata
  | HelpHintMetadata;

export type Prerequisite =
  | {
      type: 'knowledge-level';
      minimumKnowledgeLevel: KnowledgeLevel;
      description: string;
      optional?: boolean;
    }
  | {
      type: 'investment-goal';
      investmentGoal: InvestmentGoal;
      description: string;
      optional?: boolean;
    }
  | {
      type: 'risk-preference';
      allowedRiskPreferences: RiskPreference[];
      description: string;
      optional?: boolean;
    }
  | {
      type: 'asset-completion';
      assetId: string;
      description: string;
      optional?: boolean;
    }
  | {
      type: 'progress-marker';
      markerKey: string;
      minimumValue: number;
      description: string;
      optional?: boolean;
    };

export interface RecommendationCandidate<TAsset extends AdaptiveAssetMetadata = AdaptiveAssetMetadata> {
  asset: TAsset;
  score: number;
  rationale: string[];
  supportingPolicyIds: string[];
}

export interface AdaptiveAssetSelector {
  assetIds?: string[];
  kinds?: AdaptiveAssetKind[];
  categories?: AdaptiveCategory[];
  tags?: string[];
}

export type AdaptivePolicyCondition =
  | {
      type: 'knowledge-level-at-least';
      knowledgeLevel: KnowledgeLevel;
    }
  | {
      type: 'knowledge-level-at-most';
      knowledgeLevel: KnowledgeLevel;
    }
  | {
      type: 'investment-goal-includes';
      investmentGoal: InvestmentGoal;
    }
  | {
      type: 'risk-preference-is';
      riskPreference: RiskPreference;
    }
  | {
      type: 'completed-asset';
      assetId: string;
    }
  | {
      type: 'progress-marker-at-least';
      markerKey: string;
      minimumValue: number;
    }
  | {
      type: 'interested-tag-includes';
      tag: string;
    };

export interface AdaptivePolicyAction {
  availabilityState?: FeatureAvailabilityState;
  recommended?: boolean;
  highlighted?: boolean;
  highlightForLearningLater?: boolean;
  rationale?: string;
}

export interface AdaptivePolicy {
  id: string;
  key: string;
  description: string;
  priority: number;
  selector: AdaptiveAssetSelector;
  conditions: AdaptivePolicyCondition[];
  action: AdaptivePolicyAction;
}

export interface VisibilityDecision {
  assetId: string;
  availabilityState: FeatureAvailabilityState;
  recommended: boolean;
  highlighted: boolean;
  highlightForLearningLater: boolean;
  reasons: string[];
  unmetPrerequisites: Prerequisite[];
  applicablePolicyIds: string[];
}
