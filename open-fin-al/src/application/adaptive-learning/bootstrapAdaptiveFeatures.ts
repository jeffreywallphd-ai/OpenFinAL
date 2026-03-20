import { registerAdaptiveFeatureDefinitions } from './registration';
import { aiChatAssistantFeature } from './features/aiChatAssistantFeature';
import { investmentNewsFeature } from './features/investmentNewsFeature';
import { learningModulesFeature } from './features/learningModulesFeature';
import { portfolioFeature } from './features/portfolioFeature';
import { tradeWorkbenchFeature } from './features/tradeWorkbenchFeature';

export const adaptiveFeatureRegistrations = [
  portfolioFeature,
  tradeWorkbenchFeature,
  investmentNewsFeature,
  learningModulesFeature,
  aiChatAssistantFeature,
] as const;

export function bootstrapAdaptiveFeatures(): void {
  registerAdaptiveFeatureDefinitions([...adaptiveFeatureRegistrations]);
}
