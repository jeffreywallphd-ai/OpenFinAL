import { defineAdaptiveLearningContentRegistration } from '../../registration';

export const learningModulesSearchTutorial = defineAdaptiveLearningContentRegistration(
  {
    id: 'tutorial-learning-modules-search',
    key: 'learning-modules-search',
    kind: 'tutorial',
    title: 'Learning modules search tutorial',
    description: 'Guides learners through search and category filters in the learning modules catalog.',
    category: 'platform-guidance',
    tags: ['tutorial', 'search', 'filters', 'learning'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['education-savings', 'capital-preservation', 'growth'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate', 'aggressive'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: true,
      criticality: 'core',
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['module-investing-basics', 'help-learning-modules-filters'],
      relatedFeatureIds: ['feature-learning-modules-catalog'],
      tutorialAssetIds: [],
      helpAssetIds: ['help-learning-modules-filters'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    supportedModalities: ['guided-workflow', 'interactive'],
    tutorialForAssetId: 'feature-learning-modules-catalog',
    recommendedNextSteps: [
      {
        assetId: 'module-investing-basics',
        title: 'Investing basics module',
        reason: 'Start with a core module after learning how to navigate the catalog.',
      },
    ],
  },
  'src/View/Learn.jsx',
);
