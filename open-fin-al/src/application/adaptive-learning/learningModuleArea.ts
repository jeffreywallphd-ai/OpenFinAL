import { bootstrapAdaptiveFeatures } from '@application/adaptive-learning/bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from '@application/adaptive-learning/bootstrapAdaptiveLearningContent';
import {
  AdaptiveGraphAssetRecommendation,
  AdaptiveLearningRecommendationResult,
  AdaptiveLearningContentMetadata,
  AdaptiveFeatureMetadata,
  LearningModuleMetadata,
  LearnerProfile,
  Prerequisite,
  buildAdaptiveLearningRecommendations,
  listAdaptiveFeatures,
  listAdaptiveLearningContent,
} from '@domain/adaptive-learning';

export interface PersistedLearningModuleRecord {
  id: number;
  title: string;
  description: string;
  keywords: string;
  timeEstimate: number;
  category: string;
  fileName?: string | null;
  dateCreated?: string;
}

export interface PersistedLearningModulePageRecord {
  id?: number;
  moduleId: number;
  title: string;
  subTitle?: string | null;
  pageContentUrl?: string | null;
  voiceoverUrl?: string | null;
  pageNumber: number;
  pageType?: string | null;
}

export interface AdaptiveModuleRelationshipSummary {
  assetId: string;
  title: string;
  kind: 'feature' | 'learning-module' | 'tutorial' | 'help-hint';
  availabilityState?: string;
  reason: string;
}

export interface AdaptiveModuleUnlockOpportunity {
  assetId?: string;
  title: string;
  reason: string;
  unlockValue?: number;
}

export interface AdaptiveModuleContentSourceViewModel {
  mode: 'pptx-preview' | 'legacy-html-pages' | 'database-pages' | 'unknown';
  label: string;
  summary: string;
  entryFileName?: string | null;
  hasRichContent: boolean;
  incrementalDelivery: boolean;
}

export interface AdaptiveLearningModuleCardViewModel {
  moduleId: number;
  title: string;
  description: string;
  timeEstimate: number;
  category: string;
  keywords: string[];
  fileName?: string | null;
  adaptiveAssetId?: string;
  metadataTitle?: string;
  metadataDescription?: string;
  recommended: boolean;
  recommendationScore?: number;
  availabilityState?: string;
  graphReasons: string[];
  prerequisites: Array<{
    label: string;
    satisfied: boolean;
  }>;
  relatedFeatures: AdaptiveModuleRelationshipSummary[];
  tutorials: AdaptiveModuleRelationshipSummary[];
  helpHints: AdaptiveModuleRelationshipSummary[];
  unlockOpportunities: AdaptiveModuleUnlockOpportunity[];
  contentSource: AdaptiveModuleContentSourceViewModel;
}

interface AdaptiveLearningModuleAreaAssets {
  features: AdaptiveFeatureMetadata[];
  learningAssets: AdaptiveLearningContentMetadata[];
}

function getAdaptiveLearningModuleAreaAssets(): AdaptiveLearningModuleAreaAssets {
  bootstrapAdaptiveFeatures();
  bootstrapAdaptiveLearningContent();

  return {
    features: listAdaptiveFeatures().map((entry) => entry.metadata),
    learningAssets: listAdaptiveLearningContent().map((entry) => entry.metadata),
  };
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function buildContentSourceViewModel(
  module: PersistedLearningModuleRecord,
  pages: PersistedLearningModulePageRecord[] = [],
): AdaptiveModuleContentSourceViewModel {
  if (module.fileName) {
    return {
      mode: 'pptx-preview',
      label: 'PPTX preview',
      summary: 'Launches the existing PowerPoint-to-HTML preview runtime without rewriting the converter flow.',
      entryFileName: module.fileName,
      hasRichContent: true,
      incrementalDelivery: true,
    };
  }

  if (pages.length > 0) {
    return {
      mode: 'legacy-html-pages',
      label: 'HTML slide pages',
      summary: 'Uses the existing LearningModulePage records as metadata-backed rich content pages.',
      hasRichContent: true,
      incrementalDelivery: true,
    };
  }

  return {
    mode: 'unknown',
    label: 'Metadata only',
    summary: 'This module currently participates in adaptive metadata and governance before a richer delivery format is attached.',
    hasRichContent: false,
    incrementalDelivery: true,
  };
}

function describePrerequisite(prerequisite: Prerequisite): string {
  switch (prerequisite.type) {
    case 'knowledge-level':
      return prerequisite.description;
    case 'investment-goal':
      return prerequisite.description;
    case 'risk-preference':
      return prerequisite.description;
    case 'asset-completion':
      return prerequisite.description;
    case 'progress-marker':
      return prerequisite.description;
    default:
      return 'Complete the required learning step.';
  }
}

function matchAdaptiveModuleMetadata(
  module: PersistedLearningModuleRecord,
  learningAssets: AdaptiveLearningContentMetadata[],
): LearningModuleMetadata | undefined {
  const learningModules = learningAssets.filter(
    (asset): asset is LearningModuleMetadata => asset.kind === 'learning-module',
  );
  const normalizedTitle = normalizeValue(module.title);
  const normalizedCategory = normalizeValue(module.category);

  return learningModules.find((asset) => {
    const presentation = asset.presentation;

    if (presentation?.catalogRecordIds?.includes(module.id)) {
      return true;
    }

    if (presentation?.legacyTitles?.some((title) => normalizeValue(title) === normalizedTitle)) {
      return true;
    }

    if (presentation?.legacyCategories?.some((category) => normalizeValue(category) === normalizedCategory)) {
      return true;
    }

    return false;
  });
}

function getRelationshipLookup(assets: AdaptiveLearningContentMetadata[], features: AdaptiveFeatureMetadata[]) {
  const learningAssetLookup = assets.reduce<Record<string, AdaptiveLearningContentMetadata>>((accumulator, asset) => {
    accumulator[asset.id] = asset;
    return accumulator;
  }, {});
  const featureLookup = features.reduce<Record<string, AdaptiveFeatureMetadata>>((accumulator, feature) => {
    accumulator[feature.id] = feature;
    return accumulator;
  }, {});

  return { learningAssetLookup, featureLookup };
}

function createRelationshipSummary(
  assetId: string,
  features: Record<string, AdaptiveFeatureMetadata>,
  learningAssets: Record<string, AdaptiveLearningContentMetadata>,
  availabilityStateLookup: Record<string, string | undefined>,
): AdaptiveModuleRelationshipSummary | null {
  const feature = features[assetId];
  if (feature) {
    return {
      assetId,
      title: feature.title,
      kind: 'feature',
      availabilityState: availabilityStateLookup[assetId],
      reason: feature.description,
    };
  }

  const learningAsset = learningAssets[assetId];
  if (!learningAsset) {
    return null;
  }

  return {
    assetId,
    title: learningAsset.title,
    kind: learningAsset.kind,
    availabilityState: availabilityStateLookup[assetId],
    reason: learningAsset.description,
  };
}

export function buildAdaptiveLearningModuleCards(
  modules: PersistedLearningModuleRecord[],
  {
    modulePagesByModuleId = {},
    profile,
    graphRecommendations = [],
    recommendationResult,
  }: {
    modulePagesByModuleId?: Record<number, PersistedLearningModulePageRecord[]>;
    profile: LearnerProfile;
    graphRecommendations?: AdaptiveGraphAssetRecommendation[];
    recommendationResult?: AdaptiveLearningRecommendationResult;
  },
): AdaptiveLearningModuleCardViewModel[] {
  const { features, learningAssets } = getAdaptiveLearningModuleAreaAssets();
  const effectiveRecommendationResult =
    recommendationResult ??
    buildAdaptiveLearningRecommendations({
      features,
      learningAssets,
      profile,
      graphRecommendations,
      limit: Math.max(modules.length, 3),
    });
  const recommendationLookup = effectiveRecommendationResult.recommendations.reduce<
    Record<string, AdaptiveLearningRecommendationResult['recommendations'][number]>
  >((accumulator, recommendation) => {
    accumulator[recommendation.asset.id] = recommendation;
    return accumulator;
  }, {});
  const graphRecommendationLookup = graphRecommendations.reduce<Record<string, AdaptiveGraphAssetRecommendation>>((accumulator, recommendation) => {
    accumulator[recommendation.assetId] = recommendation;
    return accumulator;
  }, {});
  const availabilityStateLookup = Object.entries(effectiveRecommendationResult.decisionsByAssetId).reduce<Record<string, string>>(
    (accumulator, [assetId, decision]) => {
      accumulator[assetId] = decision.availabilityState;
      return accumulator;
    },
    {},
  );
  const { learningAssetLookup, featureLookup } = getRelationshipLookup(learningAssets, features);

  return modules.map((module) => {
    const adaptiveModule = matchAdaptiveModuleMetadata(module, learningAssets);
    const adaptiveRecommendation = adaptiveModule ? recommendationLookup[adaptiveModule.id] : undefined;
    const adaptiveDecision = adaptiveModule ? effectiveRecommendationResult.decisionsByAssetId[adaptiveModule.id] : undefined;
    const graphRecommendation = adaptiveModule ? graphRecommendationLookup[adaptiveModule.id] : undefined;
    const contentSource = buildContentSourceViewModel(module, modulePagesByModuleId[module.id] ?? []);
    const prerequisites = adaptiveModule
      ? (adaptiveDecision?.explanation.debug.prerequisiteStatuses ?? adaptiveModule.prerequisites.map((prerequisite) => ({ prerequisite, satisfied: true }))).map(
          (status) => ({
            label: describePrerequisite(status.prerequisite),
            satisfied: status.satisfied,
          }),
        )
      : [];
    const relatedFeatures = (adaptiveModule?.relationships.relatedFeatureIds ?? [])
      .map((assetId) => createRelationshipSummary(assetId, featureLookup, learningAssetLookup, availabilityStateLookup))
      .filter((value): value is AdaptiveModuleRelationshipSummary => Boolean(value));
    const tutorials = (adaptiveModule?.relationships.tutorialAssetIds ?? [])
      .map((assetId) => createRelationshipSummary(assetId, featureLookup, learningAssetLookup, availabilityStateLookup))
      .filter((value): value is AdaptiveModuleRelationshipSummary => Boolean(value));
    const helpHints = (adaptiveModule?.relationships.helpAssetIds ?? [])
      .map((assetId) => createRelationshipSummary(assetId, featureLookup, learningAssetLookup, availabilityStateLookup))
      .filter((value): value is AdaptiveModuleRelationshipSummary => Boolean(value));
    const unlockOpportunities = [
      ...(adaptiveRecommendation?.relatedFeatureUnlocks.map((unlock) => ({
        assetId: unlock.assetId,
        title: unlock.title,
        reason: unlock.whyItMatters,
        unlockValue: unlock.unlockValue,
      })) ?? []),
      ...(adaptiveModule?.recommendedNextSteps?.map((nextStep) => ({
        assetId: nextStep.assetId,
        title: nextStep.title,
        reason: nextStep.reason,
        unlockValue: nextStep.unlockValue,
      })) ?? []),
    ];

    return {
      moduleId: module.id,
      title: module.title,
      description: module.description,
      timeEstimate: module.timeEstimate,
      category: module.category,
      keywords: module.keywords.split(/\s+/).filter(Boolean),
      fileName: module.fileName,
      adaptiveAssetId: adaptiveModule?.id,
      metadataTitle: adaptiveModule?.title,
      metadataDescription: adaptiveModule?.description,
      recommended: Boolean(adaptiveRecommendation),
      recommendationScore: adaptiveRecommendation?.score,
      availabilityState: adaptiveDecision?.availabilityState,
      graphReasons: graphRecommendation?.reasons ?? adaptiveRecommendation?.graphReasons ?? [],
      prerequisites,
      relatedFeatures,
      tutorials,
      helpHints,
      unlockOpportunities,
      contentSource,
    };
  });
}
