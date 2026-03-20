import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import { AdaptiveFeatureMetadata, HelpHintMetadata } from '@domain/adaptive-learning';

describe('adaptive help hint selection service', () => {
  let features: AdaptiveFeatureMetadata[];
  let helpHints: HelpHintMetadata[];
  let selectAdaptiveHelpHints: typeof import('@domain/adaptive-learning').selectAdaptiveHelpHints;

  beforeEach(async () => {
    jest.resetModules();
    const adaptiveLearningModule = await import('@domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();
    const bootstrapFeaturesModule = await import('@application/adaptive-learning/bootstrapAdaptiveFeatures');
    const bootstrapContentModule = await import('@application/adaptive-learning/bootstrapAdaptiveLearningContent');
    bootstrapFeaturesModule.bootstrapAdaptiveFeatures();
    bootstrapContentModule.bootstrapAdaptiveLearningContent();
    features = adaptiveLearningModule.listAdaptiveFeatures().map((entry) => entry.metadata);
    helpHints = adaptiveLearningModule.listAdaptiveHelpHints().map((entry) => entry.metadata);
    selectAdaptiveHelpHints = adaptiveLearningModule.selectAdaptiveHelpHints;
  });

  test('selects the learning catalog filter hint when learner state and context align', () => {
    const profile = createDefaultLearnerProfile('learner-catalog');
    profile.knowledgeLevel = 'beginner';

    const [selectedHint] = selectAdaptiveHelpHints({
      profile,
      features,
      helpHints,
      context: {
        contextId: 'feature-learning-modules-catalog',
        featureId: 'feature-learning-modules-catalog',
        toolId: 'tool-learning-modules-search',
        tags: ['learning', 'search', 'filters'],
        relatedAssetIds: ['tutorial-learning-modules-search'],
      },
      graphRecommendations: [
        {
          assetId: 'feature-learning-modules-catalog',
          kind: 'feature',
          title: 'Learning modules catalog',
          category: 'planning',
          knowledgeLevel: 'beginner',
          relevanceScore: 8,
          reasons: ['Graph match: the learner is actively browsing the module catalog.'],
          tutorialAssetIds: ['tutorial-learning-modules-search'],
          helpAssetIds: ['help-learning-modules-filters'],
          prerequisiteAssetIds: [],
          completed: false,
        },
      ],
    });

    expect(selectedHint.asset.id).toBe('help-learning-modules-filters');
    expect(selectedHint.reasons[0]).toContain('feature-learning-modules-catalog');
    expect(selectedHint.graphReasons[0]).toContain('Graph match');
  });

  test('suppresses a hint when its authored suppression rule has already been satisfied', () => {
    const profile = createDefaultLearnerProfile('learner-complete');
    profile.knowledgeLevel = 'intermediate';
    profile.completedAssets = [
      {
        assetId: 'tutorial-learning-modules-search',
        completedAt: '2026-03-20T12:00:00.000Z',
        completionType: 'completed',
      },
    ];

    const selectedHints = selectAdaptiveHelpHints({
      profile,
      features,
      helpHints,
      context: {
        contextId: 'feature-learning-modules-catalog',
        featureId: 'feature-learning-modules-catalog',
        toolId: 'tool-learning-modules-search',
        tags: ['learning', 'search', 'filters'],
      },
    });

    expect(selectedHints.find((hint) => hint.asset.id === 'help-learning-modules-filters')).toBeUndefined();
  });

  test('respects exposure caps and learner-level dismissal state so hints stay non-intrusive', () => {
    const profile = createDefaultLearnerProfile('learner-hidden');
    profile.knowledgeLevel = 'beginner';
    profile.hiddenAssetIds = ['help-keyboard-navigation-global'];

    const selectedHints = selectAdaptiveHelpHints({
      profile,
      features,
      helpHints,
      context: {
        contextId: 'feature-learning-modules-catalog',
        featureId: 'feature-learning-modules-catalog',
        toolId: 'tool-learning-modules-search',
        tags: ['learning', 'search'],
      },
      exposureCountsByHintId: {
        'help-learning-modules-filters': 3,
      },
    });

    expect(selectedHints).toHaveLength(0);
  });
});
