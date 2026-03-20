describe('adaptive graph import service', () => {
  test('buildAdaptiveGraphCatalogSyncPayload exports registered features, modules, tutorials, and help hints for catalog sync', async () => {
    jest.resetModules();
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const importServiceModule = await import('../../../application/adaptive-learning/adaptiveGraphImportService');

    const payload = importServiceModule.buildAdaptiveGraphCatalogSyncPayload(
      '2026-03-20T12:00:00.000Z',
      'full',
    );

    expect(payload.mode).toBe('full');
    expect(payload.assetNodes.map((asset) => asset.id)).toEqual(expect.arrayContaining([
      'feature-trade-workbench',
      'module-investing-basics',
      'tutorial-trade-workbench-first-order',
      'help-trade-workbench-order-entry',
    ]));

    const tutorial = payload.assetNodes.find((asset) => asset.id === 'tutorial-trade-workbench-first-order');
    expect(tutorial).toMatchObject({
      tutorialForAssetId: 'feature-trade-workbench',
      relatedFeatureIds: ['feature-trade-workbench', 'feature-investment-news'],
      relationships: expect.objectContaining({
        helpAssetIds: ['help-trade-workbench-order-entry'],
      }),
    });

    const module = payload.assetNodes.find((asset) => asset.id === 'module-risk-basics');
    expect(module).toMatchObject({
      estimatedDurationMinutes: 12,
      supportedModalities: ['reading', 'reference'],
      recommendedNextSteps: [
        expect.objectContaining({
          assetId: 'tutorial-trade-workbench-first-order',
          unlockValue: 0.55,
        }),
      ],
    });
  });

  test('createAdaptiveGraphImportService syncs the catalog before the learner graph with a shared timestamp', async () => {
    jest.resetModules();
    const learnerProfileModule = await import('../../../application/adaptive-learning/learnerProfile');
    const importServiceModule = await import('../../../application/adaptive-learning/adaptiveGraphImportService');

    const adaptiveGraphRepository = {
      syncAdaptiveGraphCatalog: jest.fn().mockResolvedValue({ backend: 'neo4j', assetCount: 7, relationshipCount: 18 }),
      syncAdaptiveLearningGraph: jest.fn().mockResolvedValue({ backend: 'neo4j', learnerId: 'learner-import-1', assetCount: 7 }),
      getLearnerSnapshot: jest.fn(),
      findRelevantAssets: jest.fn(),
    };

    const service = importServiceModule.createAdaptiveGraphImportService({
      adaptiveGraphRepository,
      clock: () => '2026-03-20T12:34:56.000Z',
    });

    const learnerProfile = learnerProfileModule.buildLearnerProfileFromSurvey('learner-import-1', {
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth'],
      riskPreference: 'moderate',
      interestedTags: ['stocks'],
      experienceMarkers: [],
    }, undefined, '2026-03-20T12:34:56.000Z');

    const result = await service.syncRegisteredAssetsForLearner(learnerProfile, 'incremental');

    expect(adaptiveGraphRepository.syncAdaptiveGraphCatalog).toHaveBeenCalledWith(expect.objectContaining({
      syncedAt: '2026-03-20T12:34:56.000Z',
      mode: 'incremental',
    }));
    expect(adaptiveGraphRepository.syncAdaptiveLearningGraph).toHaveBeenCalledWith(expect.objectContaining({
      syncedAt: '2026-03-20T12:34:56.000Z',
      learnerProfile: expect.objectContaining({ learnerId: 'learner-import-1' }),
    }));
    expect(result).toEqual({
      catalog: expect.objectContaining({ backend: 'neo4j' }),
      learner: expect.objectContaining({ learnerId: 'learner-import-1' }),
    });
  });
});
