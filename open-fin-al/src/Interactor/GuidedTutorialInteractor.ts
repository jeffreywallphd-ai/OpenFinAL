import { buildAdaptiveGraphSyncPayload } from '@application/adaptive-learning/adaptiveGraphSnapshot';
import { bootstrapAdaptiveFeatures } from '@application/adaptive-learning/bootstrapAdaptiveFeatures';
import { bootstrapAdaptiveLearningContent } from '@application/adaptive-learning/bootstrapAdaptiveLearningContent';
import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import { applyGuidedTutorialCompletion, buildGuidedTutorialRuntime } from '@application/adaptive-learning/guidedTutorials';
import { IAdaptiveGraphRepository } from '@application/services/IAdaptiveGraphRepository';
import { ILearnerProfileStore } from '@application/services/ILearnerProfileStore';
import {
  AdaptiveGraphAssetRecommendation,
  buildAdaptiveLearningRecommendations,
  listAdaptiveFeatures,
  listAdaptiveLearningContent,
} from '@domain/adaptive-learning';
import { ElectronAdaptiveGraphRepository } from '@infrastructure/electron/ElectronAdaptiveGraphRepository';
import { ElectronLearnerProfileStore } from '@infrastructure/electron/ElectronLearnerProfileStore';

interface GuidedTutorialInteractorDependencies {
  learnerProfileStore?: ILearnerProfileStore;
  adaptiveGraphRepository?: IAdaptiveGraphRepository;
  now?: () => Date;
}

export class GuidedTutorialInteractor {
  private readonly learnerProfileStore: ILearnerProfileStore;
  private readonly adaptiveGraphRepository: IAdaptiveGraphRepository;
  private readonly now: () => Date;

  constructor({
    learnerProfileStore = new ElectronLearnerProfileStore(),
    adaptiveGraphRepository = new ElectronAdaptiveGraphRepository(),
    now = () => new Date(),
  }: GuidedTutorialInteractorDependencies = {}) {
    this.learnerProfileStore = learnerProfileStore;
    this.adaptiveGraphRepository = adaptiveGraphRepository;
    this.now = now;
  }

  async completeLearningCatalogTutorial(userId: number, tutorialId: string) {
    bootstrapAdaptiveFeatures();
    bootstrapAdaptiveLearningContent();

    const savedProfile = await this.learnerProfileStore.loadByUserId(userId);

    if (!savedProfile) {
      return null;
    }

    let graphRecommendations: AdaptiveGraphAssetRecommendation[] = [];

    try {
      await this.adaptiveGraphRepository.syncAdaptiveLearningGraph(buildAdaptiveGraphSyncPayload(savedProfile));
      const snapshot = await this.adaptiveGraphRepository.getLearnerSnapshot(savedProfile.learnerId);
      graphRecommendations = snapshot?.recommendations ?? [];
    } catch (_error) {
      graphRecommendations = [];
    }

    const features = listAdaptiveFeatures().map((entry) => entry.metadata);
    const learningAssets = listAdaptiveLearningContent().map((entry) => entry.metadata);
    const recommendationResult = buildAdaptiveLearningRecommendations({
      features,
      learningAssets,
      profile: savedProfile ?? createDefaultLearnerProfile(`user-${userId}`),
      graphRecommendations,
      limit: 3,
    });

    const tutorial = learningAssets.find((asset): asset is Extract<(typeof learningAssets)[number], { kind: 'tutorial' }> => asset.id === tutorialId && asset.kind === 'tutorial');
    const feature = features.find((asset) => asset.id === 'feature-learning-modules-catalog');

    if (!tutorial || !feature) {
      return null;
    }

    const tutorialRuntime = buildGuidedTutorialRuntime({
      profile: savedProfile,
      tutorial,
      tutorialDecision: recommendationResult.decisionsByAssetId[tutorial.id],
      feature,
      featureDecision: recommendationResult.decisionsByAssetId[feature.id],
      featureContextId: feature.id,
      graphRecommendations,
    });

    if (!tutorialRuntime) {
      return null;
    }

    const updatedProfile = applyGuidedTutorialCompletion(savedProfile, tutorialRuntime, this.now().toISOString());
    await this.learnerProfileStore.saveByUserId(userId, updatedProfile);
    return updatedProfile;
  }
}
