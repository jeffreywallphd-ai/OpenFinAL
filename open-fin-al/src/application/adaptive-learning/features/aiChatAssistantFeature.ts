import { registerAdaptiveFeature } from '@domain/adaptive-learning';

export const aiChatAssistantFeature = registerAdaptiveFeature(
  {
    id: 'feature-ai-chat-assistant',
    key: 'ai-chat-assistant',
    kind: 'feature',
    title: 'AI chat assistant',
    description: 'Offers conversational help for investment questions and platform guidance through a chat experience.',
    category: 'automation',
    tags: ['chat', 'assistant', 'ai', 'help'],
    knowledgeLevel: 'beginner',
    investmentGoals: ['capital-preservation', 'growth', 'retirement', 'diversification'],
    riskAlignment: ['very-conservative', 'conservative', 'moderate', 'aggressive'],
    prerequisites: [],
    governance: {
      defaultAvailabilityState: 'deemphasized',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      visibleDuringOnboarding: false,
      hideWhenLearnerDismisses: true,
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['feature-learning-modules-catalog', 'feature-investment-news'],
      relatedFeatureIds: ['feature-learning-modules-catalog', 'feature-investment-news'],
      tutorialAssetIds: ['tutorial-ai-chat-assistant-prompts'],
      helpAssetIds: ['help-ai-chat-assistant-safety'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
  },
  {
    source: 'src/View/Chatbot.jsx',
  },
);
