describe('adaptive learning recommender', () => {
  async function loadAdaptiveCatalog() {
    jest.resetModules();
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const featuresModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveFeatures');
    const contentModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveLearningContent');
    featuresModule.bootstrapAdaptiveFeatures();
    contentModule.bootstrapAdaptiveLearningContent();

    return {
      adaptiveLearningModule,
      features: adaptiveLearningModule.listAdaptiveFeatures().map((entry) => entry.metadata),
      learningAssets: adaptiveLearningModule.listAdaptiveLearningContent().map((entry) => entry.metadata),
    };
  }

  test('ranks learning assets using learner profile, graph signals, prerequisites, and related feature unlock value', async () => {
    const { adaptiveLearningModule, features, learningAssets } = await loadAdaptiveCatalog();
    const profile: import('../../../domain/adaptive-learning').LearnerProfile = {
      learnerId: 'learner-recommender',
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth', 'diversification'],
      riskPreference: 'moderate',
      interestedTags: ['risk-management', 'guided-tutorials', 'stocks'],
      completedAssets: [],
      progressMarkers: [],
      unlockedAssetIds: [],
      hiddenAssetIds: [],
    };
    const graphRecommendations: import('../../../domain/adaptive-learning').AdaptiveGraphAssetRecommendation[] = [
      {
        assetId: 'module-risk-basics',
        kind: 'learning-module',
        title: 'Risk basics module',
        category: 'risk-management',
        knowledgeLevel: 'beginner',
        relevanceScore: 10,
        reasons: ['Graph match: the learner is close to the trading path but still needs risk foundations first.'],
        tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
        helpAssetIds: ['help-trade-workbench-order-entry'],
        prerequisiteAssetIds: [],
        completed: false,
      },
    ];

    const result = adaptiveLearningModule.buildAdaptiveLearningRecommendations({
      features,
      learningAssets,
      profile,
      graphRecommendations,
      limit: 3,
      generatedAt: '2026-03-20T12:00:00.000Z',
    });

    expect(result.generatedAt).toBe('2026-03-20T12:00:00.000Z');
    expect(result.recommendations[0].asset.id).toBe('module-risk-basics');
    expect(result.recommendations[0].graphReasons[0]).toContain('Graph match');
    expect(result.recommendations[0].explanation.reasons.map((reason) => reason.signal)).toEqual(
      expect.arrayContaining([
        'learner-profile-alignment',
        'graph-relationship',
        'prerequisite-readiness',
        'knowledge-progression',
        'feature-unlock-value',
        'feature-governance',
      ]),
    );
    expect(result.recommendations[0].relatedFeatureUnlocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'feature-trade-workbench',
          availabilityState: 'deemphasized',
        }),
      ]),
    );
    expect(result.featureGovernance.visibleFeatureIds).toContain('feature-learning-modules-catalog');
    expect(result.featureGovernance.deemphasizedFeatureIds).toContain('feature-trade-workbench');
  });

  test('keeps recommendations coherent with feature governance by excluding hidden learning assets and explaining locked progress', async () => {
    const { adaptiveLearningModule, features, learningAssets } = await loadAdaptiveCatalog();
    const profile: import('../../../domain/adaptive-learning').LearnerProfile = {
      learnerId: 'learner-conservative',
      knowledgeLevel: 'beginner',
      investmentGoals: ['retirement'],
      riskPreference: 'very-conservative',
      interestedTags: ['portfolio'],
      completedAssets: [],
      progressMarkers: [],
      unlockedAssetIds: [],
      hiddenAssetIds: [],
    };

    const result = adaptiveLearningModule.buildAdaptiveLearningRecommendations({
      features,
      learningAssets,
      profile,
      limit: 10,
      generatedAt: '2026-03-20T14:00:00.000Z',
    });

    expect(result.recommendations.every((recommendation) => recommendation.governanceDecision.availabilityState !== 'hidden')).toBe(true);

    const lockedTutorial = result.recommendations.find((recommendation) => recommendation.asset.id === 'tutorial-trade-workbench-first-order');
    expect(lockedTutorial?.governanceDecision.availabilityState).toBe('locked');
    expect(lockedTutorial?.explanation.summary).toContain('recommended because');
    expect(lockedTutorial?.explanation.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signal: 'prerequisite-readiness',
          message: expect.stringContaining('next prerequisite step'),
        }),
      ]),
    );
  });
});
