import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import { LearnerProfile } from '@domain/adaptive-learning';
import {
  buildAdaptiveLearningCatalogRuntime,
  buildAdaptiveLearningCatalogViewModel,
} from '@ui/adaptive/learningCatalogAdaptive';

describe('adaptive learning catalog UI integration', () => {
  test('builds fallback recommendations for the learning catalog when no learner profile exists', () => {
    const runtime = buildAdaptiveLearningCatalogRuntime({
      profile: createDefaultLearnerProfile('user-guest'),
      hasLearnerProfile: false,
      graphRecommendations: [],
    });
    const viewModel = buildAdaptiveLearningCatalogViewModel(runtime);

    expect(viewModel.banner.title).toContain('learning foundations');
    expect(viewModel.cards).toHaveLength(3);
    expect(viewModel.contextualHelpHint?.assetId).toBe('help-learning-modules-filters');
    expect(viewModel.cards[0].rationale.length).toBeGreaterThan(0);
    expect(viewModel.recommendationResult.featureGovernance.deemphasizedFeatureIds.length).toBeGreaterThanOrEqual(0);
  });

  test('surfaces related feature unlocks and graph reasons in the learning catalog cards', () => {
    const profile: LearnerProfile = {
      learnerId: 'user-9',
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth', 'diversification'],
      riskPreference: 'moderate',
      interestedTags: ['risk-management', 'stocks'],
      completedAssets: [],
      progressMarkers: [],
      unlockedAssetIds: [],
      hiddenAssetIds: [],
    };

    const runtime = buildAdaptiveLearningCatalogRuntime({
      profile,
      hasLearnerProfile: true,
      graphRecommendations: [
        {
          assetId: 'feature-learning-modules-catalog',
          kind: 'feature',
          title: 'Learning modules catalog',
          category: 'planning',
          knowledgeLevel: 'beginner',
          relevanceScore: 7,
          reasons: ['Graph match: the learner is actively browsing the module catalog.'],
          tutorialAssetIds: ['tutorial-learning-modules-search'],
          helpAssetIds: ['help-learning-modules-filters'],
          prerequisiteAssetIds: [],
          completed: false,
        },
        {
          assetId: 'module-risk-basics',
          kind: 'learning-module',
          title: 'Risk basics module',
          category: 'risk-management',
          knowledgeLevel: 'beginner',
          relevanceScore: 8,
          reasons: ['Graph match: risk foundations should come before the trading workflow.'],
          tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
          helpAssetIds: ['help-trade-workbench-order-entry'],
          prerequisiteAssetIds: [],
          completed: false,
        },
      ],
    });
    const viewModel = buildAdaptiveLearningCatalogViewModel(runtime);

    expect(viewModel.cards[0].title).toBe('Risk basics module');
    expect(viewModel.cards[0].featureUnlocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'feature-trade-workbench',
        }),
      ]),
    );
    expect(viewModel.cards[0].graphReasons[0]).toContain('Graph match');
    expect(viewModel.banner.title).toBe('Graph-backed learning recommendations');
    expect(viewModel.contextualHelpHint?.assetId).toBe('help-learning-modules-filters');
    expect(viewModel.contextualHelpHint?.graphReasons[0]).toContain('Graph match');
  });
});
