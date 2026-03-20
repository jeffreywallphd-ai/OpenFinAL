import {
  AdaptiveAssetKind,
  AdaptiveCategory,
  AdaptiveFeatureGraphNode,
  AdaptiveGovernance,
  AdaptiveNextStep,
  InvestmentGoal,
  KnowledgeLevel,
  LearnerProfile,
  ProgressMarker,
  RiskPreference,
  SupportedModality,
} from './contracts';

export interface AdaptiveGraphLearnerProfileNode {
  learnerId: string;
  knowledgeLevel: KnowledgeLevel;
  investmentGoals: InvestmentGoal[];
  riskPreference: RiskPreference;
  confidenceScore?: number | null;
  interestedTags: string[];
  experienceMarkers: string[];
  completedAssetIds: string[];
  progressMarkers: ProgressMarker[];
  unlockedAssetIds: string[];
  hiddenAssetIds: string[];
  updatedAt?: string;
}


export interface AdaptiveGraphCatalogAssetNode extends AdaptiveFeatureGraphNode {
  key: string;
  description: string;
  governance: AdaptiveGovernance;
  source?: string;
  registeredAt?: string;
  relatedFeatureIds: string[];
  tutorialForAssetId?: string;
  hintForAssetId?: string;
  estimatedDurationMinutes?: number;
  supportedModalities?: SupportedModality[];
  recommendedNextSteps?: AdaptiveNextStep[];
}

export interface AdaptiveGraphCatalogSyncPayload {
  assetNodes: AdaptiveGraphCatalogAssetNode[];
  syncedAt: string;
  mode?: 'incremental' | 'full';
}

export interface AdaptiveGraphCatalogSyncResult {
  assetCount: number;
  relationshipCount: number;
  syncedAt: string;
  backend: string;
  mode: 'incremental' | 'full';
}

export interface AdaptiveGraphSyncPayload {
  learnerProfile: AdaptiveGraphLearnerProfileNode;
  assetNodes: AdaptiveFeatureGraphNode[];
  syncedAt: string;
}

export interface AdaptiveGraphSyncResult {
  learnerId: string;
  assetCount: number;
  syncedAt: string;
  backend: string;
}

export interface AdaptiveGraphAssetQuery {
  learnerId: string;
  limit?: number;
  kinds?: AdaptiveAssetKind[];
  categories?: AdaptiveCategory[];
  includeCompleted?: boolean;
}

export interface AdaptiveGraphAssetRecommendation {
  assetId: string;
  kind: AdaptiveAssetKind;
  title: string;
  category: AdaptiveCategory;
  knowledgeLevel: KnowledgeLevel;
  relevanceScore: number;
  reasons: string[];
  tutorialAssetIds: string[];
  helpAssetIds: string[];
  prerequisiteAssetIds: string[];
  completed: boolean;
}

export interface AdaptiveGraphLearnerSnapshot {
  learnerProfile: AdaptiveGraphLearnerProfileNode;
  recommendations: AdaptiveGraphAssetRecommendation[];
}

export function createAdaptiveGraphLearnerProfileNode(
  profile: LearnerProfile,
): AdaptiveGraphLearnerProfileNode {
  return {
    learnerId: profile.learnerId,
    knowledgeLevel: profile.knowledgeLevel,
    investmentGoals: [...profile.investmentGoals],
    riskPreference: profile.riskPreference,
    confidenceScore: profile.confidenceScore ?? null,
    interestedTags: [...profile.interestedTags],
    experienceMarkers: [...(profile.experienceMarkers ?? [])],
    completedAssetIds: profile.completedAssets.map((asset) => asset.assetId),
    progressMarkers: profile.progressMarkers.map((marker) => ({ ...marker })),
    unlockedAssetIds: [...profile.unlockedAssetIds],
    hiddenAssetIds: [...profile.hiddenAssetIds],
    updatedAt: profile.updatedAt,
  };
}
