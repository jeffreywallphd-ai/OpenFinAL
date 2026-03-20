import { registerAdaptiveLearningContentDefinitions } from './registration';
import { investingBasicsModule } from './content/modules/investingBasicsModule';
import { riskBasicsModule } from './content/modules/riskBasicsModule';
import { learningModulesSearchTutorial } from './content/tutorials/learningModulesSearchTutorial';
import { tradeWorkbenchFirstOrderTutorial } from './content/tutorials/tradeWorkbenchFirstOrderTutorial';
import { learningModulesFiltersHint } from './content/help-hints/learningModulesFiltersHint';
import { tradeWorkbenchOrderEntryHint } from './content/help-hints/tradeWorkbenchOrderEntryHint';
import { keyboardNavigationGlobalHint } from './content/help-hints/keyboardNavigationGlobalHint';

export const adaptiveLearningContentRegistrations = [
  investingBasicsModule,
  riskBasicsModule,
  learningModulesSearchTutorial,
  tradeWorkbenchFirstOrderTutorial,
  learningModulesFiltersHint,
  tradeWorkbenchOrderEntryHint,
  keyboardNavigationGlobalHint,
] as const;

export function bootstrapAdaptiveLearningContent(): void {
  registerAdaptiveLearningContentDefinitions([...adaptiveLearningContentRegistrations]);
}
