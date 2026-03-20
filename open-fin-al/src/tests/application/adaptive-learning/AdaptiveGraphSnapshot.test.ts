describe('buildAdaptiveGraphSyncPayload', () => {
  test('builds a graph sync payload from the canonical learner profile and bootstrapped registries', async () => {
    jest.resetModules();
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const learnerProfileModule = await import('../../../application/adaptive-learning/learnerProfile');
    const graphSnapshotModule = await import('../../../application/adaptive-learning/adaptiveGraphSnapshot');

    const profile = learnerProfileModule.buildLearnerProfileFromSurvey('learner-graph-1', {
      knowledgeLevel: 'intermediate',
      investmentGoals: ['growth', 'retirement'],
      riskPreference: 'moderate',
      confidenceScore: 4,
      selfAssessment: 'Prefers guided learning before using more advanced tools.',
      interestedTags: ['portfolio', 'guided-tutorials'],
      experienceMarkers: ['completed-learning-module'],
      learningModulesCompleted: 2,
      practiceTradesCompleted: 1,
    }, undefined, '2026-03-20T12:00:00.000Z');

    const payload = graphSnapshotModule.buildAdaptiveGraphSyncPayload(profile, '2026-03-20T12:00:00.000Z');

    expect(payload.learnerProfile).toMatchObject({
      learnerId: 'learner-graph-1',
      knowledgeLevel: 'intermediate',
      riskPreference: 'moderate',
      completedAssetIds: [],
      interestedTags: ['portfolio', 'guided-tutorials'],
    });
    expect(payload.assetNodes.map((asset) => asset.id)).toEqual(
      expect.arrayContaining([
        'feature-trade-workbench',
        'feature-learning-modules-catalog',
        'module-investing-basics',
        'tutorial-trade-workbench-first-order',
        'help-trade-workbench-order-entry',
      ]),
    );
    expect(payload.syncedAt).toBe('2026-03-20T12:00:00.000Z');
  });
});
