import { registerAdaptiveLearningContent } from '@domain/adaptive-learning';

export const tradeWorkbenchOrderEntryHint = registerAdaptiveLearningContent(
  {
    id: 'help-trade-workbench-order-entry',
    key: 'trade-workbench-order-entry',
    kind: 'help-hint',
    title: 'Trade workbench order-entry hint',
    description: 'Provides quick reminders about reviewing charts and order details before placing a trade.',
    category: 'platform-guidance',
    tags: ['help', 'trading', 'orders', 'just-in-time'],
    knowledgeLevel: 'intermediate',
    investmentGoals: ['growth', 'income', 'speculation'],
    riskAlignment: ['moderate', 'aggressive', 'speculative'],
    prerequisites: [
      {
        type: 'asset-completion',
        assetId: 'module-risk-basics',
        description: 'Review the risk basics module so the order-entry hint has proper context.',
        optional: true,
      },
    ],
    governance: {
      defaultAvailabilityState: 'deemphasized',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['tutorial-trade-workbench-first-order'],
      relatedFeatureIds: ['feature-trade-workbench'],
      tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
      helpAssetIds: [],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    supportedModalities: ['reference'],
    hintForAssetId: 'feature-trade-workbench',
    contextualGuidance: {
      contextIds: ['feature-trade-workbench', 'tool-trade-order-entry', 'tool-trade-chart-review'],
      exposureRules: [
        {
          type: 'knowledge-level-at-least',
          knowledgeLevel: 'intermediate',
        },
      ],
      suppressionRules: [
        {
          type: 'completed-asset',
          assetId: 'tutorial-trade-workbench-first-order',
        },
      ],
      displayPriority: 10,
      maxDisplayCount: 2,
    },
    recommendedNextSteps: [
      {
        assetId: 'feature-trade-workbench',
        title: 'Trade workbench',
        reason: 'Return to the feature once the learner has the just-in-time order-entry reminder.',
      },
    ],
  },
  {
    source: 'src/View/Stock.jsx',
  },
);
