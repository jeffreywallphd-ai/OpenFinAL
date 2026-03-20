import { defineAdaptiveLearningContentRegistration } from '../../registration';

export const investingBasicsModule = defineAdaptiveLearningContentRegistration(
  {
    id: 'module-investing-basics',
    key: 'investing-basics',
    kind: 'learning-module',
    title: 'Investing basics module',
    description: 'Introduces investing terminology and the platform learning flow through the Learning Modules experience.',
    category: 'foundations',
    tags: ['learning', 'foundations', 'terminology', 'onboarding'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['capital-preservation', 'growth', 'retirement', 'education-savings', 'diversification'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate'],
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
      relatedAssetIds: ['tutorial-learning-modules-search', 'help-learning-modules-filters'],
      relatedFeatureIds: ['feature-learning-modules-catalog', 'feature-ai-chat-assistant'],
      tutorialAssetIds: ['tutorial-learning-modules-search'],
      helpAssetIds: ['help-learning-modules-filters'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    supportedModalities: ['reading', 'interactive'],
    estimatedDurationMinutes: 15,
    presentation: {
      catalogRecordIds: [1, 2, 9],
      legacyTitles: ['Introduction to Stocks', 'Introduction to Bonds', 'Introduction to Investing'],
      legacyCategories: ['Stock', 'Bond', 'ETF'],
    },
    unlockValue: 0.25,
    recommendedNextSteps: [
      {
        assetId: 'tutorial-portfolio-dashboard-walkthrough',
        title: 'Portfolio dashboard walkthrough',
        reason: 'Move from concepts into a guided tour of the learner’s portfolio workspace.',
        unlockValue: 0.4,
      },
    ],
  },
  'src/View/Learn.jsx',
);
