import { registerAdaptiveFeature } from '@domain/adaptive-learning';

export const investmentNewsFeature = registerAdaptiveFeature(
  {
    id: 'feature-investment-news',
    key: 'investment-news',
    kind: 'feature',
    title: 'Investment news search',
    description: 'Surfaces company-specific news so a learner can connect current events to investing decisions.',
    category: 'research',
    tags: ['news', 'research', 'company-events', 'market-context'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['growth', 'income', 'diversification'],
    riskAlignment: ['conservative', 'moderate', 'aggressive'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: true,
      hideWhenLearnerDismisses: true,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['feature-trade-workbench'],
      tutorialAssetIds: ['tutorial-investment-news-basics'],
      helpAssetIds: ['help-investment-news-search'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
  },
  {
    source: 'src/View/News.jsx',
  },
);
