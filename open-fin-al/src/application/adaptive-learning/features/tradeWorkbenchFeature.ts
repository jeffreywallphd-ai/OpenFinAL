import { registerAdaptiveFeature } from '@domain/adaptive-learning';

export const tradeWorkbenchFeature = registerAdaptiveFeature(
  {
    id: 'feature-trade-workbench',
    key: 'trade-workbench',
    kind: 'feature',
    title: 'Trade workbench',
    description:
      'Lets the learner search a ticker, review charts and SEC context, and place a trade from a single workflow.',
    category: 'trading',
    tags: ['trading', 'stocks', 'charts', 'orders', 'sec-filings'],
    knowledgeLevel: 'intermediate',
    investmentGoals: ['growth', 'income', 'speculation'],
    riskAlignment: ['moderate', 'aggressive', 'speculative'],
    prerequisites: [
      {
        type: 'knowledge-level',
        minimumKnowledgeLevel: 'beginner',
        description: 'Learners should understand core investing terminology before trading.',
      },
    ],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: false,
      lockWhenPrerequisitesUnmet: true,
      hideWhenLearnerDismisses: true,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['feature-portfolio-dashboard', 'feature-investment-news'],
      tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
      helpAssetIds: ['help-trade-workbench-order-entry'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
  },
  {
    source: 'src/View/Stock.jsx',
  },
);
