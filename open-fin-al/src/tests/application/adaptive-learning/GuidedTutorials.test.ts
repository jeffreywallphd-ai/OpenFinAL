import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import {
  applyGuidedTutorialCompletion,
  buildGuidedTutorialRuntime,
  completeGuidedTutorialSession,
  createGuidedTutorialSession,
  goToNextGuidedTutorialStep,
  startGuidedTutorialSession,
} from '@application/adaptive-learning/guidedTutorials';
import { LearnerProfile, TutorialMetadata } from '@domain/adaptive-learning';

async function loadAdaptiveCatalog() {
  jest.resetModules();
  const adaptiveLearningModule = await import('@domain/adaptive-learning');
  adaptiveLearningModule.adaptiveFeatureRegistry.clear();
  adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

  const featuresModule = await import('@application/adaptive-learning/bootstrapAdaptiveFeatures');
  const contentModule = await import('@application/adaptive-learning/bootstrapAdaptiveLearningContent');
  featuresModule.bootstrapAdaptiveFeatures();
  contentModule.bootstrapAdaptiveLearningContent();

  return {
    features: adaptiveLearningModule.listAdaptiveFeatures().map((entry) => entry.metadata),
    learningAssets: adaptiveLearningModule.listAdaptiveLearningContent().map((entry) => entry.metadata),
    buildAdaptiveLearningRecommendations: adaptiveLearningModule.buildAdaptiveLearningRecommendations,
  };
}

describe('guided tutorial framework', () => {
  test('builds a recommended guided tutorial runtime from learner state, feature context, and graph relationships', async () => {
    const profile: LearnerProfile = {
      ...createDefaultLearnerProfile('user-42'),
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth', 'education-savings'],
      riskPreference: 'moderate',
      interestedTags: ['guided-tutorials', 'research'],
    };
    const { features, learningAssets, buildAdaptiveLearningRecommendations } = await loadAdaptiveCatalog();
    const recommendationResult = buildAdaptiveLearningRecommendations({
      features,
      learningAssets,
      profile,
      graphRecommendations: [
        {
          assetId: 'feature-learning-modules-catalog',
          kind: 'feature',
          title: 'Learning modules catalog',
          category: 'planning',
          knowledgeLevel: 'beginner',
          relevanceScore: 8,
          reasons: ['Graph match: the learner is actively exploring the learning catalog.'],
          tutorialAssetIds: ['tutorial-learning-modules-search'],
          helpAssetIds: ['help-learning-modules-filters'],
          prerequisiteAssetIds: [],
          completed: false,
        },
      ],
    });
    const tutorial = learningAssets.find((asset): asset is TutorialMetadata => asset.id === 'tutorial-learning-modules-search' && asset.kind === 'tutorial');
    const feature = features.find((asset) => asset.id === 'feature-learning-modules-catalog');

    expect(tutorial).toBeDefined();
    expect(feature).toBeDefined();

    const runtime = buildGuidedTutorialRuntime({
      profile,
      tutorial: tutorial!,
      tutorialDecision: recommendationResult.decisionsByAssetId[tutorial!.id],
      feature: feature!,
      featureDecision: recommendationResult.decisionsByAssetId[feature!.id],
      featureContextId: 'feature-learning-modules-catalog',
      graphRecommendations: [
        {
          assetId: 'feature-learning-modules-catalog',
          kind: 'feature',
          title: 'Learning modules catalog',
          category: 'planning',
          knowledgeLevel: 'beginner',
          relevanceScore: 8,
          reasons: ['Graph match: the learner is actively exploring the learning catalog.'],
          tutorialAssetIds: ['tutorial-learning-modules-search'],
          helpAssetIds: ['help-learning-modules-filters'],
          prerequisiteAssetIds: [],
          completed: false,
        },
      ],
    });

    expect(runtime).not.toBeNull();
    expect(runtime?.status).toBe('recommended');
    expect(runtime?.autoStart).toBe(true);
    expect(runtime?.steps).toHaveLength(3);
    expect(runtime?.graphReasons[0]).toContain('Graph match');
    expect(runtime?.supportingAssetIds).toEqual(expect.arrayContaining(['module-investing-basics', 'help-learning-modules-filters']));
  });

  test('advances tutorial progression and records completion into learner adaptive state', async () => {
    const profile: LearnerProfile = {
      ...createDefaultLearnerProfile('user-42'),
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth'],
      riskPreference: 'moderate',
      interestedTags: ['guided-tutorials'],
    };
    const { features, learningAssets, buildAdaptiveLearningRecommendations } = await loadAdaptiveCatalog();
    const recommendationResult = buildAdaptiveLearningRecommendations({
      features,
      learningAssets,
      profile,
      graphRecommendations: [],
    });
    const tutorial = learningAssets.find((asset): asset is TutorialMetadata => asset.id === 'tutorial-learning-modules-search' && asset.kind === 'tutorial');
    const feature = features.find((asset) => asset.id === 'feature-learning-modules-catalog');
    const runtime = buildGuidedTutorialRuntime({
      profile,
      tutorial: tutorial!,
      tutorialDecision: recommendationResult.decisionsByAssetId[tutorial!.id],
      feature: feature!,
      featureDecision: recommendationResult.decisionsByAssetId[feature!.id],
      featureContextId: 'feature-learning-modules-catalog',
      graphRecommendations: [],
    });

    expect(runtime).not.toBeNull();

    let session = createGuidedTutorialSession(runtime!);
    session = startGuidedTutorialSession(session, '2026-03-20T00:00:00.000Z');
    session = goToNextGuidedTutorialStep(session, runtime!);
    session = goToNextGuidedTutorialStep(session, runtime!);
    session = completeGuidedTutorialSession(session, '2026-03-20T00:05:00.000Z');

    expect(session.status).toBe('completed');
    expect(session.completedAt).toBe('2026-03-20T00:05:00.000Z');

    const updatedProfile = applyGuidedTutorialCompletion(profile, runtime!, '2026-03-20T00:05:00.000Z');

    expect(updatedProfile.completedAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'tutorial-learning-modules-search',
          completionType: 'completed',
        }),
      ]),
    );
    expect(updatedProfile.progressMarkers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'tutorial-learning-modules-search-completed',
          value: 1,
        }),
      ]),
    );
    expect(updatedProfile.unlockedAssetIds).toEqual(
      expect.arrayContaining([
        'feature-learning-modules-catalog',
        'module-investing-basics',
        'help-learning-modules-filters',
      ]),
    );
  });
});
