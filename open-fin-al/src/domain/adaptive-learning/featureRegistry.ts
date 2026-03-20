import { AdaptiveAssetMetadata, AdaptiveAssetSelector, AdaptiveFeatureGraphNode } from './contracts';
import { matchesAdaptiveAssetSelector } from './policyEngine';

export interface AdaptiveFeatureRegistryEntry<TAsset extends AdaptiveAssetMetadata = AdaptiveAssetMetadata> {
  metadata: TAsset;
  registeredAt: string;
  source: string;
}

export interface RegisterAdaptiveFeatureOptions {
  source: string;
  replaceExisting?: boolean;
}

export class AdaptiveFeatureRegistry {
  private readonly entries = new Map<string, AdaptiveFeatureRegistryEntry>();

  register<TAsset extends AdaptiveAssetMetadata>(
    metadata: TAsset,
    options: RegisterAdaptiveFeatureOptions,
  ): AdaptiveFeatureRegistryEntry<TAsset> {
    const existingEntry = this.entries.get(metadata.id);

    if (existingEntry && !options.replaceExisting) {
      throw new Error(`Adaptive feature "${metadata.id}" is already registered.`);
    }

    const entry: AdaptiveFeatureRegistryEntry<TAsset> = {
      metadata,
      registeredAt: new Date().toISOString(),
      source: options.source,
    };

    this.entries.set(metadata.id, entry);
    return entry;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  getById<TAsset extends AdaptiveAssetMetadata = AdaptiveAssetMetadata>(id: string): AdaptiveFeatureRegistryEntry<TAsset> | undefined {
    return this.entries.get(id) as AdaptiveFeatureRegistryEntry<TAsset> | undefined;
  }

  list(): AdaptiveFeatureRegistryEntry[] {
    return [...this.entries.values()].sort((left, right) => left.metadata.title.localeCompare(right.metadata.title));
  }

  find(selector: AdaptiveAssetSelector): AdaptiveFeatureRegistryEntry[] {
    return this.list().filter((entry) => matchesAdaptiveAssetSelector(entry.metadata, selector));
  }

  exportGraphNodes(): AdaptiveFeatureGraphNode[] {
    return this.list().map(({ metadata }) => ({
      id: metadata.id,
      kind: metadata.kind,
      title: metadata.title,
      category: metadata.category,
      knowledgeLevel: metadata.knowledgeLevel,
      defaultAvailability: metadata.defaultAvailability,
      isUserFacing: metadata.isUserFacing,
      tags: [...metadata.tags],
      investmentGoals: [...metadata.investmentGoals],
      riskAlignment: [...metadata.riskAlignment],
      prerequisites: [...metadata.prerequisites],
      relationships: {
        relatedAssetIds: [...metadata.relationships.relatedAssetIds],
        tutorialAssetIds: [...metadata.relationships.tutorialAssetIds],
        helpAssetIds: [...metadata.relationships.helpAssetIds],
        accessibilityAssetIds: [...metadata.relationships.accessibilityAssetIds],
      },
    }));
  }

  clear(): void {
    this.entries.clear();
  }
}

export const adaptiveFeatureRegistry = new AdaptiveFeatureRegistry();

export function registerAdaptiveFeature<TAsset extends AdaptiveAssetMetadata>(
  metadata: TAsset,
  options: RegisterAdaptiveFeatureOptions,
): TAsset {
  adaptiveFeatureRegistry.register(metadata, options);
  return metadata;
}

export function getAdaptiveFeatureById<TAsset extends AdaptiveAssetMetadata = AdaptiveAssetMetadata>(
  id: string,
): AdaptiveFeatureRegistryEntry<TAsset> | undefined {
  return adaptiveFeatureRegistry.getById<TAsset>(id);
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
