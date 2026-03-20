describe('adaptive observability diagnostics', () => {
  test('summarizes registry contents, learner snapshot, graph sync status, and decision explanations for developer inspection', async () => {
    jest.resetModules();
    const diagnosticsModule = await import('../../../application/adaptive-learning/adaptiveDiagnostics');
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');

    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const snapshot = diagnosticsModule.buildAdaptiveObservabilitySnapshot({
      hasLearnerProfile: true,
      profile: {
        learnerId: 'learner-diagnostics',
        knowledgeLevel: 'beginner',
        investmentGoals: ['retirement', 'diversification'],
        riskPreference: 'conservative',
        interestedTags: ['risk-management', 'portfolio'],
        completedAssets: [],
        progressMarkers: [],
        unlockedAssetIds: [],
        hiddenAssetIds: ['feature-ai-chat-assistant'],
      },
      graphRecommendations: [
        {
          assetId: 'module-risk-basics',
          kind: 'learning-module',
          title: 'Risk basics module',
          category: 'risk-management',
          knowledgeLevel: 'beginner',
          relevanceScore: 10,
          reasons: ['Graph match: risk foundations are the next step before placing trades.'],
          tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
          helpAssetIds: ['help-trade-workbench-order-entry'],
          prerequisiteAssetIds: [],
          completed: false,
        },
        {
          assetId: 'unknown-graph-node',
          kind: 'feature',
          title: 'Unknown graph node',
          category: 'analysis',
          knowledgeLevel: 'beginner',
          relevanceScore: 6,
          reasons: ['Should be discarded during normalization.'],
          tutorialAssetIds: [],
          helpAssetIds: [],
          prerequisiteAssetIds: [],
          completed: false,
        },
      ],
      generatedAt: '2026-03-20T16:00:00.000Z',
      graphSync: {
        attempted: true,
        synced: true,
        backend: 'neo4j',
        syncedAt: '2026-03-20T16:00:00.000Z',
      },
    });

    expect(snapshot.registry.totalAssetCount).toBeGreaterThan(0);
    expect(snapshot.registry.assetsByKind.feature).toBeGreaterThan(0);
    expect(snapshot.learnerProfile.profileCompleteness).toBe('complete');
    expect(snapshot.graphSync.reason).toBe('graph-sync-succeeded');
    expect(snapshot.graphSync.discardedRecommendationAssetIds).toEqual(['unknown-graph-node']);

    const lockedTutorial = diagnosticsModule.inspectAdaptiveDecision(snapshot, 'tutorial-trade-workbench-first-order');
    expect(lockedTutorial?.availabilityState).toBe('locked');
    expect(lockedTutorial?.whyLocked).toEqual(
      expect.arrayContaining(['The learner has not satisfied all required prerequisites yet.']),
    );
    expect(lockedTutorial?.supportingAssetIds).toEqual(
      expect.arrayContaining(['module-risk-basics', 'help-trade-workbench-order-entry']),
    );

    const hiddenAiAssistant = diagnosticsModule.inspectAdaptiveDecision(snapshot, 'feature-ai-chat-assistant');
    expect(hiddenAiAssistant?.availabilityState).toBe('hidden');
    expect(hiddenAiAssistant?.whyHidden).toContain('The learner dismissed this asset previously, so it remains hidden.');

    const recommendedModule = snapshot.recommendations.find((recommendation) => recommendation.assetId === 'module-risk-basics');
    expect(recommendedModule?.topReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining('risk foundations are the next step'),
      ]),
    );
  });

  test('creates graph sync diagnostics for missing profiles and only emits logs when enabled', async () => {
    jest.resetModules();
    const diagnosticsModule = await import('../../../application/adaptive-learning/adaptiveDiagnostics');

    const graphSync = diagnosticsModule.createAdaptiveGraphSyncDiagnostics({
      learnerId: 'user-guest',
      hasLearnerProfile: false,
      profileCompleteness: 'missing',
      synced: false,
      recommendationCount: 0,
    });

    expect(graphSync.reason).toBe('missing-profile');
    expect(graphSync.attempted).toBe(false);

    const logger = jest.fn();
    const snapshot = {
      generatedAt: '2026-03-20T18:00:00.000Z',
    } as unknown as import('../../../application/adaptive-learning/adaptiveDiagnostics').AdaptiveObservabilitySnapshot;

    diagnosticsModule.emitAdaptiveObservabilitySnapshot('disabled', snapshot, { enabled: false, logger });
    diagnosticsModule.emitAdaptiveObservabilitySnapshot('enabled', snapshot, { enabled: true, logger });

    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith('[adaptive-observability] enabled', snapshot);
  });
});
