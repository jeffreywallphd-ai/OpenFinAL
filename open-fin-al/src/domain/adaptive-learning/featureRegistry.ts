import { AdaptiveAssetSelector, AdaptiveFeatureGraphNode, AdaptiveFeatureMetadata } from './contracts';
import { AdaptiveAssetRegistry, AdaptiveRegistryEntry, RegisterAdaptiveAssetOptions } from './assetRegistry';

export type AdaptiveFeatureRegistryEntry<TAsset extends AdaptiveFeatureMetadata = AdaptiveFeatureMetadata> = AdaptiveRegistryEntry<TAsset>;
export type RegisterAdaptiveFeatureOptions = RegisterAdaptiveAssetOptions;

export class AdaptiveFeatureRegistry extends AdaptiveAssetRegistry<AdaptiveFeatureMetadata> {
  constructor() {
    super('Adaptive feature');
  }
}

export const adaptiveFeatureRegistry = new AdaptiveFeatureRegistry();

export function registerAdaptiveFeature<TAsset extends AdaptiveFeatureMetadata>(
  metadata: TAsset,
  options: RegisterAdaptiveFeatureOptions,
): TAsset {
  adaptiveFeatureRegistry.register(metadata, options);
  return metadata;
}

export function getAdaptiveFeatureById<TAsset extends AdaptiveFeatureMetadata = AdaptiveFeatureMetadata>(
  id: string,
): AdaptiveFeatureRegistryEntry<TAsset> | undefined {
  return adaptiveFeatureRegistry.getById(id) as AdaptiveFeatureRegistryEntry<TAsset> | undefined;
}

export function listAdaptiveFeatures(): AdaptiveFeatureRegistryEntry[] {
  return adaptiveFeatureRegistry.list();
}

export function findAdaptiveFeatures(selector: AdaptiveAssetSelector): AdaptiveFeatureRegistryEntry[] {
  return adaptiveFeatureRegistry.find(selector);
}

export function exportAdaptiveFeatureGraphNodes(): AdaptiveFeatureGraphNode[] {
  return adaptiveFeatureRegistry.exportGraphNodes();
}
