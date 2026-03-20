import {
  AdaptiveFeatureMetadata,
  AdaptiveLearningContentMetadata,
  adaptiveFeatureRegistry,
  adaptiveLearningContentRegistry,
  registerAdaptiveFeature,
  registerAdaptiveLearningContent,
} from '@domain/adaptive-learning';

export interface AdaptiveFeatureRegistration {
  metadata: AdaptiveFeatureMetadata;
  source: string;
}

export interface AdaptiveLearningContentRegistration {
  metadata: AdaptiveLearningContentMetadata;
  source: string;
}

export function defineAdaptiveFeatureRegistration(
  metadata: AdaptiveFeatureMetadata,
  source: string,
): AdaptiveFeatureRegistration {
  return { metadata, source };
}

export function defineAdaptiveLearningContentRegistration(
  metadata: AdaptiveLearningContentMetadata,
  source: string,
): AdaptiveLearningContentRegistration {
  return { metadata, source };
}

export function registerAdaptiveFeatureDefinitions(registrations: AdaptiveFeatureRegistration[]): void {
  for (const registration of registrations) {
    if (adaptiveFeatureRegistry.has(registration.metadata.id)) {
      continue;
    }

    registerAdaptiveFeature(registration.metadata, { source: registration.source });
  }
}

export function registerAdaptiveLearningContentDefinitions(
  registrations: AdaptiveLearningContentRegistration[],
): void {
  for (const registration of registrations) {
    if (adaptiveLearningContentRegistry.has(registration.metadata.id)) {
      continue;
    }

    registerAdaptiveLearningContent(registration.metadata, { source: registration.source });
  }
}
