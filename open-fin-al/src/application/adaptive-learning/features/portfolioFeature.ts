import { registerAdaptiveFeature } from '@domain/adaptive-learning';

export const portfolioFeature = registerAdaptiveFeature(
  {
    id: 'feature-portfolio-dashboard',
    key: 'portfolio-dashboard',
    kind: 'feature',
    title: 'Portfolio dashboard',
    description:
      'Helps the learner review portfolio holdings, buying power, allocation, and value trends in one place.',
    category: 'portfolio',
    tags: ['portfolio', 'holdings', 'allocation', 'buying-power'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['capital-preservation', 'growth', 'retirement', 'diversification'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate', 'aggressive'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: true,
      hideWhenLearnerDismisses: false,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['feature-trade-workbench'],
      tutorialAssetIds: ['tutorial-portfolio-dashboard-walkthrough'],
      helpAssetIds: ['help-portfolio-dashboard-overview'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
  },
  {
    source: 'src/View/Portfolio.jsx',
  },
);
