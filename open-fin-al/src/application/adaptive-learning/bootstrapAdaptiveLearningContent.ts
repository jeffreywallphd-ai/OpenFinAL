import './content/modules/investingBasicsModule';
import './content/modules/riskBasicsModule';
import './content/tutorials/learningModulesSearchTutorial';
import './content/tutorials/tradeWorkbenchFirstOrderTutorial';
import './content/help-hints/learningModulesFiltersHint';
import './content/help-hints/tradeWorkbenchOrderEntryHint';
import './content/help-hints/keyboardNavigationGlobalHint';

export function bootstrapAdaptiveLearningContent(): void {
  // Learning content modules self-register via side effects so future entry points can hydrate one manifest.
}
