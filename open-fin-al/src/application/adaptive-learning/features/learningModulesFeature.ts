import { registerAdaptiveFeature } from '@domain/adaptive-learning';

export const learningModulesFeature = registerAdaptiveFeature(
  {
    id: 'feature-learning-modules-catalog',
    key: 'learning-modules-catalog',
    kind: 'feature',
    title: 'Learning modules catalog',
    description: 'Provides searchable finance learning modules so learners can study concepts before using advanced tools.',
    category: 'planning',
    tags: ['learning', 'education', 'modules', 'onboarding'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['capital-preservation', 'growth', 'retirement', 'education-savings', 'diversification'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate', 'aggressive', 'speculative'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: true,
      hideWhenLearnerDismisses: false,
      criticality: 'core',
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['feature-trade-workbench', 'feature-portfolio-dashboard'],
      relatedFeatureIds: ['feature-trade-workbench', 'feature-portfolio-dashboard'],
      tutorialAssetIds: ['tutorial-learning-modules-search'],
      helpAssetIds: ['help-learning-modules-filters'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
  },
  {
    source: 'src/View/Learn.jsx',
  },
);
