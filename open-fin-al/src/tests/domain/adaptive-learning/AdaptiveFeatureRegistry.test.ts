import {
  AdaptiveFeatureMetadata,
  AdaptiveFeatureRegistry,
  registerAdaptiveFeature,
  adaptiveFeatureRegistry,
} from '../../../domain/adaptive-learning';


describe('adaptive feature registry', () => {
  beforeEach(() => {
    adaptiveFeatureRegistry.clear();
  });

  test('registers and looks up adaptive features centrally', () => {
    const registry = new AdaptiveFeatureRegistry();

    const metadata: AdaptiveFeatureMetadata = {
      id: 'feature-test-registry',
      key: 'test-registry',
      kind: 'feature',
      title: 'Registry test feature',
      description: 'Exercise the adaptive feature registry contract.',
      category: 'analysis',
      tags: ['testing', 'registry'],
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth'],
      riskAlignment: ['moderate'],
      prerequisites: [],
      governance: {
        defaultAvailabilityState: 'visible',
        eligibleForRecommendation: true,
        eligibleForHighlighting: true,
      },
      defaultAvailability: 'enabled',
      isUserFacing: true,
      relationships: {
        relatedAssetIds: [],
        relatedFeatureIds: [],
        tutorialAssetIds: ['tutorial-registry-test'],
        helpAssetIds: ['help-registry-test'],
        accessibilityAssetIds: ['help-keyboard-navigation-global'],
      },
    };

    registry.register(metadata, { source: 'src/tests/domain/adaptive-learning/AdaptiveFeatureRegistry.test.ts' });

    expect(registry.has(metadata.id)).toBe(true);
    expect(registry.getById(metadata.id)?.source).toContain('AdaptiveFeatureRegistry.test.ts');
    expect(registry.find({ tags: ['registry'] })).toHaveLength(1);
    expect(registry.exportGraphNodes()).toEqual([
      expect.objectContaining({
        id: metadata.id,
        defaultAvailability: 'enabled',
        relationships: expect.objectContaining({
          tutorialAssetIds: ['tutorial-registry-test'],
        }),
      }),
    ]);
  });

  test('prevents duplicate feature registration unless explicitly replaced', () => {
    const metadata: AdaptiveFeatureMetadata = {
      id: 'feature-duplicate',
      key: 'duplicate',
      kind: 'feature',
      title: 'Duplicate feature',
      description: 'Used to verify duplicate detection.',
      category: 'portfolio',
      tags: ['testing'],
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth'],
      riskAlignment: ['moderate'],
      prerequisites: [],
      governance: {
        defaultAvailabilityState: 'visible',
        eligibleForRecommendation: true,
        eligibleForHighlighting: true,
      },
      defaultAvailability: 'enabled',
      isUserFacing: true,
      relationships: {
        relatedAssetIds: [],
        relatedFeatureIds: [],
        tutorialAssetIds: [],
        helpAssetIds: [],
        accessibilityAssetIds: [],
      },
    };

    registerAdaptiveFeature(metadata, { source: 'first' });

    expect(() => registerAdaptiveFeature(metadata, { source: 'second' })).toThrow(
      'Adaptive feature "feature-duplicate" is already registered.',
    );
  });

  test('bootstraps a representative set of user-facing features and exports graph-ready metadata', async () => {
    jest.resetModules();
    const registryModule = await import('../../../domain/adaptive-learning');
    registryModule.adaptiveFeatureRegistry.clear();

    const bootstrapModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveFeatures');
    bootstrapModule.bootstrapAdaptiveFeatures();

    const registeredFeatures = registryModule.listAdaptiveFeatures();
    const tradeFeature = registryModule.getAdaptiveFeatureById('feature-trade-workbench');

    expect(registeredFeatures.map((entry) => entry.metadata.id)).toEqual(
      expect.arrayContaining([
        'feature-portfolio-dashboard',
        'feature-trade-workbench',
        'feature-investment-news',
        'feature-learning-modules-catalog',
        'feature-ai-chat-assistant',
      ]),
    );
    expect(tradeFeature?.metadata.relationships.helpAssetIds).toContain('help-trade-workbench-order-entry');
    expect(registryModule.findAdaptiveFeatures({ categories: ['trading'] })).toHaveLength(1);
    expect(registryModule.exportAdaptiveFeatureGraphNodes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feature-ai-chat-assistant',
          isUserFacing: true,
          defaultAvailability: 'enabled',
        }),
      ]),
    );
  });
});
