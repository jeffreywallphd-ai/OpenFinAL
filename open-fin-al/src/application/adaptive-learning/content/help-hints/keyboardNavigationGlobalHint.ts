import { registerAdaptiveLearningContent } from '@domain/adaptive-learning';

export const keyboardNavigationGlobalHint = registerAdaptiveLearningContent(
  {
    id: 'help-keyboard-navigation-global',
    key: 'keyboard-navigation-global',
    kind: 'help-hint',
    title: 'Global keyboard navigation hint',
    description: 'Central accessibility hint that can be attached to adaptive features and learning content across the product.',
    category: 'platform-guidance',
    tags: ['help', 'accessibility', 'keyboard', 'navigation'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['capital-preservation', 'growth', 'retirement', 'education-savings', 'diversification', 'speculation'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate', 'aggressive', 'speculative'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: false,
      visibleDuringOnboarding: true,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: [],
      relatedFeatureIds: [
        'feature-learning-modules-catalog',
        'feature-trade-workbench',
        'feature-portfolio-dashboard',
        'feature-investment-news',
        'feature-ai-chat-assistant',
      ],
      tutorialAssetIds: [],
      helpAssetIds: [],
      accessibilityAssetIds: [],
    },
    supportedModalities: ['reference'],
    hintForAssetId: 'feature-learning-modules-catalog',
    contextualGuidance: {
      contextIds: [
        'feature-learning-modules-catalog',
        'feature-trade-workbench',
        'tool-learning-modules-search',
        'tool-trade-order-entry',
      ],
      displayPriority: 2,
      maxDisplayCount: 4,
    },
  },
  {
    source: 'src/renderer.js',
  },
);
