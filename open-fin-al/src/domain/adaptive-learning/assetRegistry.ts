import { AdaptiveAssetMetadata, AdaptiveAssetSelector, AdaptiveFeatureGraphNode } from './contracts';
import { matchesAdaptiveAssetSelector } from './policyEngine';

export interface AdaptiveRegistryEntry<TAsset extends AdaptiveAssetMetadata = AdaptiveAssetMetadata> {
  metadata: TAsset;
  registeredAt: string;
  source: string;
}

export interface RegisterAdaptiveAssetOptions {
  source: string;
  replaceExisting?: boolean;
}

export class AdaptiveAssetRegistry<TAsset extends AdaptiveAssetMetadata = AdaptiveAssetMetadata> {
  private readonly entries = new Map<string, AdaptiveRegistryEntry<TAsset>>();
  private readonly duplicateEntityLabel: string;

  constructor(duplicateEntityLabel = 'Adaptive asset') {
    this.duplicateEntityLabel = duplicateEntityLabel;
  }

  register(metadata: TAsset, options: RegisterAdaptiveAssetOptions): AdaptiveRegistryEntry<TAsset> {
    const existingEntry = this.entries.get(metadata.id);

    if (existingEntry && !options.replaceExisting) {
      throw new Error(`${this.duplicateEntityLabel} "${metadata.id}" is already registered.`);
    }

    const entry: AdaptiveRegistryEntry<TAsset> = {
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

  getById(id: string): AdaptiveRegistryEntry<TAsset> | undefined {
    return this.entries.get(id);
  }

  list(): AdaptiveRegistryEntry<TAsset>[] {
    return [...this.entries.values()].sort((left, right) => left.metadata.title.localeCompare(right.metadata.title));
  }

  find(selector: AdaptiveAssetSelector): AdaptiveRegistryEntry<TAsset>[] {
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
        relatedFeatureIds: [...metadata.relationships.relatedFeatureIds],
        tutorialAssetIds: [...metadata.relationships.tutorialAssetIds],
        helpAssetIds: [...metadata.relationships.helpAssetIds],
        accessibilityAssetIds: [...metadata.relationships.accessibilityAssetIds],
      },
      supportedModalities: 'supportedModalities' in metadata ? [...metadata.supportedModalities] : undefined,
      unlockValue: 'unlockValue' in metadata ? metadata.unlockValue : undefined,
      recommendedNextSteps:
        'recommendedNextSteps' in metadata ? metadata.recommendedNextSteps?.map((step) => ({ ...step })) : undefined,
    }));
  }

  clear(): void {
    this.entries.clear();
  }
}
