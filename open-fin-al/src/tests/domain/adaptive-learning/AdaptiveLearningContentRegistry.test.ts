import {
  AdaptiveLearningContentRegistry,
  LearningModuleMetadata,
  adaptiveLearningContentRegistry,
} from '../../../domain/adaptive-learning';

describe('adaptive learning content registry', () => {
  beforeEach(() => {
    adaptiveLearningContentRegistry.clear();
  });

  test('registers and looks up adaptive learning content centrally', () => {
    const registry = new AdaptiveLearningContentRegistry();

    const metadata: LearningModuleMetadata = {
      id: 'module-registry-test',
      key: 'registry-test',
      kind: 'learning-module',
      title: 'Registry test module',
      description: 'Exercise the adaptive learning content registry contract.',
      category: 'foundations',
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
        relatedAssetIds: ['tutorial-registry-test'],
        relatedFeatureIds: ['feature-learning-modules-catalog'],
        tutorialAssetIds: ['tutorial-registry-test'],
        helpAssetIds: ['help-registry-test'],
        accessibilityAssetIds: ['help-keyboard-navigation-global'],
      },
      supportedModalities: ['reading', 'interactive'],
      unlockValue: 0.2,
      recommendedNextSteps: [
        {
          assetId: 'tutorial-registry-test',
          title: 'Registry test tutorial',
          reason: 'Continue with a guided walk-through.',
          unlockValue: 0.35,
        },
      ],
      estimatedDurationMinutes: 10,
    };

    registry.register(metadata, { source: 'src/tests/domain/adaptive-learning/AdaptiveLearningContentRegistry.test.ts' });

    expect(registry.has(metadata.id)).toBe(true);
    expect(registry.getById(metadata.id)?.source).toContain('AdaptiveLearningContentRegistry.test.ts');
    expect(registry.listLearningModules()).toHaveLength(1);
    expect(registry.find({ tags: ['registry'] })).toHaveLength(1);
    expect(registry.exportGraphNodes()).toEqual([
      expect.objectContaining({
        id: metadata.id,
        supportedModalities: ['reading', 'interactive'],
        unlockValue: 0.2,
        recommendedNextSteps: [
          expect.objectContaining({
            assetId: 'tutorial-registry-test',
          }),
        ],
        relationships: expect.objectContaining({
          relatedFeatureIds: ['feature-learning-modules-catalog'],
        }),
      }),
    ]);
  });

  test('prevents duplicate learning content registration unless explicitly replaced', () => {
    const metadata: LearningModuleMetadata = {
      id: 'module-duplicate',
      key: 'duplicate',
      kind: 'learning-module',
      title: 'Duplicate learning module',
      description: 'Used to verify duplicate detection.',
      category: 'foundations',
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
      supportedModalities: ['reading'],
    };

    adaptiveLearningContentRegistry.register(metadata, { source: 'first' });

    expect(() => adaptiveLearningContentRegistry.register(metadata, { source: 'second' })).toThrow(
      'Adaptive learning content asset "module-duplicate" is already registered.',
    );
  });

  test('bootstraps representative modules, tutorials, and help hints that align with the feature registry', async () => {
    jest.resetModules();
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const bootstrapFeaturesModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveFeatures');
    const bootstrapContentModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveLearningContent');
    bootstrapFeaturesModule.bootstrapAdaptiveFeatures();
    bootstrapContentModule.bootstrapAdaptiveLearningContent();

    const learningContentIds = adaptiveLearningModule.listAdaptiveLearningContent().map((entry) => entry.metadata.id);
    const tradeTutorial = adaptiveLearningModule.getAdaptiveLearningContentById('tutorial-trade-workbench-first-order');
    const tradeFeature = adaptiveLearningModule.getAdaptiveFeatureById('feature-trade-workbench');

    expect(learningContentIds).toEqual(
      expect.arrayContaining([
        'module-investing-basics',
        'module-risk-basics',
        'tutorial-learning-modules-search',
        'tutorial-trade-workbench-first-order',
        'help-learning-modules-filters',
        'help-trade-workbench-order-entry',
        'help-keyboard-navigation-global',
      ]),
    );
    expect(adaptiveLearningModule.listAdaptiveLearningModules()).toHaveLength(2);
    expect(adaptiveLearningModule.listAdaptiveTutorials()).toHaveLength(2);
    expect(adaptiveLearningModule.listAdaptiveHelpHints()).toHaveLength(3);
    expect(tradeTutorial?.metadata.relationships.relatedFeatureIds).toContain('feature-trade-workbench');
    expect(tradeFeature?.metadata.relationships.tutorialAssetIds).toContain('tutorial-trade-workbench-first-order');
    expect(adaptiveLearningModule.findAdaptiveLearningContent({ kinds: ['help-hint'] })).toHaveLength(3);
    expect(adaptiveLearningModule.exportAdaptiveLearningContentGraphNodes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'module-risk-basics',
          supportedModalities: ['reading', 'reference'],
        }),
      ]),
    );
  });

  test('keeps feature and learning registries parallel but separate', async () => {
    jest.resetModules();
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const bootstrapFeaturesModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveFeatures');
    const bootstrapContentModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveLearningContent');
    bootstrapFeaturesModule.bootstrapAdaptiveFeatures();
    bootstrapContentModule.bootstrapAdaptiveLearningContent();

    expect(adaptiveLearningModule.getAdaptiveFeatureById('module-investing-basics')).toBeUndefined();
    expect(adaptiveLearningModule.getAdaptiveLearningContentById('feature-trade-workbench')).toBeUndefined();
    expect(adaptiveLearningModule.getAdaptiveLearningContentById('module-investing-basics')?.metadata.relationships.relatedFeatureIds).toContain(
      'feature-learning-modules-catalog',
    );
  });
});
