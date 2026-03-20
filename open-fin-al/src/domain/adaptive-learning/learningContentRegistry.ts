import {
  AdaptiveFeatureGraphNode,
  AdaptiveLearningContentMetadata,
  AdaptiveAssetSelector,
  HelpHintMetadata,
  LearningModuleMetadata,
  TutorialMetadata,
} from './contracts';
import { AdaptiveAssetRegistry, AdaptiveRegistryEntry, RegisterAdaptiveAssetOptions } from './assetRegistry';

export type AdaptiveLearningContentRegistryEntry<
  TAsset extends AdaptiveLearningContentMetadata = AdaptiveLearningContentMetadata,
> = AdaptiveRegistryEntry<TAsset>;
export type RegisterAdaptiveLearningContentOptions = RegisterAdaptiveAssetOptions;

export class AdaptiveLearningContentRegistry extends AdaptiveAssetRegistry<AdaptiveLearningContentMetadata> {
  constructor() {
    super('Adaptive learning content asset');
  }

  listLearningModules(): AdaptiveRegistryEntry<LearningModuleMetadata>[] {
    return this.find({ kinds: ['learning-module'] }) as AdaptiveRegistryEntry<LearningModuleMetadata>[];
  }

  listTutorials(): AdaptiveRegistryEntry<TutorialMetadata>[] {
    return this.find({ kinds: ['tutorial'] }) as AdaptiveRegistryEntry<TutorialMetadata>[];
  }

  listHelpHints(): AdaptiveRegistryEntry<HelpHintMetadata>[] {
    return this.find({ kinds: ['help-hint'] }) as AdaptiveRegistryEntry<HelpHintMetadata>[];
  }
}

export const adaptiveLearningContentRegistry = new AdaptiveLearningContentRegistry();

export function registerAdaptiveLearningContent<TAsset extends AdaptiveLearningContentMetadata>(
  metadata: TAsset,
  options: RegisterAdaptiveLearningContentOptions,
): TAsset {
  adaptiveLearningContentRegistry.register(metadata, options);
  return metadata;
}

export function getAdaptiveLearningContentById<
  TAsset extends AdaptiveLearningContentMetadata = AdaptiveLearningContentMetadata,
>(id: string): AdaptiveLearningContentRegistryEntry<TAsset> | undefined {
  return adaptiveLearningContentRegistry.getById(id) as AdaptiveLearningContentRegistryEntry<TAsset> | undefined;
}

export function listAdaptiveLearningContent(): AdaptiveLearningContentRegistryEntry[] {
  return adaptiveLearningContentRegistry.list();
}

export function findAdaptiveLearningContent(selector: AdaptiveAssetSelector): AdaptiveLearningContentRegistryEntry[] {
  return adaptiveLearningContentRegistry.find(selector);
}

export function listAdaptiveLearningModules(): AdaptiveRegistryEntry<LearningModuleMetadata>[] {
  return adaptiveLearningContentRegistry.listLearningModules();
}

export function listAdaptiveTutorials(): AdaptiveRegistryEntry<TutorialMetadata>[] {
  return adaptiveLearningContentRegistry.listTutorials();
}

export function listAdaptiveHelpHints(): AdaptiveRegistryEntry<HelpHintMetadata>[] {
  return adaptiveLearningContentRegistry.listHelpHints();
}

export function exportAdaptiveLearningContentGraphNodes(): AdaptiveFeatureGraphNode[] {
  return adaptiveLearningContentRegistry.exportGraphNodes();
}
