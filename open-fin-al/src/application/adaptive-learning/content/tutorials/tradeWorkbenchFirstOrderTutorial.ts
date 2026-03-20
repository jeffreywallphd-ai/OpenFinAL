import { registerAdaptiveLearningContent } from '@domain/adaptive-learning';

export const tradeWorkbenchFirstOrderTutorial = registerAdaptiveLearningContent(
  {
    id: 'tutorial-trade-workbench-first-order',
    key: 'trade-workbench-first-order',
    kind: 'tutorial',
    title: 'Trade workbench first-order tutorial',
    description: 'Walks learners through ticker search, chart review, and order-entry preparation inside the trade workbench.',
    category: 'market-mechanics',
    tags: ['tutorial', 'trading', 'orders', 'workflow'],
    knowledgeLevel: 'intermediate',
    investmentGoals: ['growth', 'income', 'speculation'],
    riskAlignment: ['moderate', 'aggressive', 'speculative'],
    prerequisites: [
      {
        type: 'asset-completion',
        assetId: 'module-risk-basics',
        description: 'Complete the risk basics module before starting a first trade tutorial.',
      },
    ],
    governance: {
      defaultAvailabilityState: 'deemphasized',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      lockWhenPrerequisitesUnmet: true,
      criticality: 'standard',
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['module-risk-basics', 'help-trade-workbench-order-entry'],
      relatedFeatureIds: ['feature-trade-workbench', 'feature-investment-news'],
      tutorialAssetIds: [],
      helpAssetIds: ['help-trade-workbench-order-entry'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    supportedModalities: ['guided-workflow', 'interactive'],
    tutorialForAssetId: 'feature-trade-workbench',
    unlockValue: 0.6,
    recommendedNextSteps: [
      {
        assetId: 'help-trade-workbench-order-entry',
        title: 'Trade workbench order-entry hint',
        reason: 'Keep the order ticket help nearby while moving from the tutorial to live usage.',
      },
    ],
  },
  {
    source: 'src/View/Stock.jsx',
  },
);
