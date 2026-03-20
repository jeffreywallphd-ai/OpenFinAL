import { registerAdaptiveLearningContent } from '@domain/adaptive-learning';

export const learningModulesFiltersHint = registerAdaptiveLearningContent(
  {
    id: 'help-learning-modules-filters',
    key: 'learning-modules-filters',
    kind: 'help-hint',
    title: 'Learning modules filter hint',
    description: 'Short just-in-time guidance for using the search text box and category filter in the learning catalog.',
    category: 'platform-guidance',
    tags: ['help', 'filters', 'search', 'learning'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['education-savings', 'capital-preservation', 'growth'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate', 'aggressive', 'speculative'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: true,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['tutorial-learning-modules-search'],
      relatedFeatureIds: ['feature-learning-modules-catalog'],
      tutorialAssetIds: ['tutorial-learning-modules-search'],
      helpAssetIds: [],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    supportedModalities: ['reference'],
    hintForAssetId: 'feature-learning-modules-catalog',
    recommendedNextSteps: [
      {
        assetId: 'module-investing-basics',
        title: 'Investing basics module',
        reason: 'Use the filter hint to find an introductory module quickly.',
      },
    ],
  },
  {
    source: 'src/View/Learn.jsx',
  },
);
