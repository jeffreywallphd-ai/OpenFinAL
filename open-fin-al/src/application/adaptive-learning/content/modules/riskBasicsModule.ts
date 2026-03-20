import { registerAdaptiveLearningContent } from '@domain/adaptive-learning';

export const riskBasicsModule = registerAdaptiveLearningContent(
  {
    id: 'module-risk-basics',
    key: 'risk-basics',
    kind: 'learning-module',
    title: 'Risk basics module',
    description: 'Explains basic risk concepts learners should understand before moving into trading workflows.',
    category: 'risk-management',
    tags: ['risk', 'volatility', 'diversification', 'foundations'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['capital-preservation', 'growth', 'diversification', 'retirement'],
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
      relatedAssetIds: ['tutorial-trade-workbench-first-order', 'help-trade-workbench-order-entry'],
      relatedFeatureIds: ['feature-trade-workbench', 'feature-portfolio-dashboard'],
      tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
      helpAssetIds: ['help-trade-workbench-order-entry'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    supportedModalities: ['reading', 'reference'],
    estimatedDurationMinutes: 12,
    presentation: {
      catalogRecordIds: [4],
      legacyTitles: ['Risk Free Investments'],
      legacyCategories: ['Risk Free Investments'],
    },
    unlockValue: 0.35,
    recommendedNextSteps: [
      {
        assetId: 'tutorial-trade-workbench-first-order',
        title: 'Trade workbench first-order tutorial',
        reason: 'Apply the risk concepts directly inside the trading workflow.',
        unlockValue: 0.55,
      },
    ],
  },
  {
    source: 'src/View/LearningModule/LearningModuleDetails.jsx',
  },
);
