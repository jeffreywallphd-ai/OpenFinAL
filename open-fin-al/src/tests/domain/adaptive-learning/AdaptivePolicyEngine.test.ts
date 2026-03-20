describe('adaptive policy engine', () => {
  async function loadAdaptiveCatalog() {
    jest.resetModules();
    const adaptiveLearningModule = await import('../../../domain/adaptive-learning');
    adaptiveLearningModule.adaptiveFeatureRegistry.clear();
    adaptiveLearningModule.adaptiveLearningContentRegistry.clear();

    const featuresModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveFeatures');
    const contentModule = await import('../../../application/adaptive-learning/bootstrapAdaptiveLearningContent');
    featuresModule.bootstrapAdaptiveFeatures();
    contentModule.bootstrapAdaptiveLearningContent();

    const assets = [
      ...adaptiveLearningModule.listAdaptiveFeatures().map((entry) => entry.metadata),
      ...adaptiveLearningModule.listAdaptiveLearningContent().map((entry) => entry.metadata),
    ];

    return {
      adaptiveLearningModule,
      assets,
    };
  }

  test('governs both user-facing features and learning assets using shared metadata and relationships', async () => {
    const { adaptiveLearningModule, assets } = await loadAdaptiveCatalog();
    const learnerProfile: import('../../../domain/adaptive-learning').LearnerProfile = {
      learnerId: 'learner-catalog',
      knowledgeLevel: 'beginner',
      investmentGoals: ['retirement', 'diversification'],
      riskPreference: 'conservative',
      interestedTags: ['learning', 'portfolio'],
      completedAssets: [],
      progressMarkers: [],
      unlockedAssetIds: [],
      hiddenAssetIds: [],
    };

    const result = adaptiveLearningModule.evaluateAdaptivePolicyEngine(assets, learnerProfile);
    const portfolioDecision = result.decisionsByAssetId['feature-portfolio-dashboard'];
    const tradeDecision = result.decisionsByAssetId['feature-trade-workbench'];
    const riskModuleDecision = result.decisionsByAssetId['module-risk-basics'];
    const tradeTutorialDecision = result.decisionsByAssetId['tutorial-trade-workbench-first-order'];

    expect(portfolioDecision.availabilityState).toBe('visible');
    expect(portfolioDecision.recommended).toBe(true);
    expect(portfolioDecision.explanation.debug.criticality).toBe('core');

    expect(tradeDecision.availabilityState).toBe('deemphasized');
    expect(tradeDecision.recommended).toBe(false);
    expect(tradeDecision.reasons).toContain(
      'This asset is deemphasized because its risk profile conflicts with the learner’s preference.',
    );

    expect(riskModuleDecision.availabilityState).toBe('visible');
    expect(riskModuleDecision.highlighted).toBe(true);

    expect(tradeTutorialDecision.availabilityState).toBe('locked');
    expect(tradeTutorialDecision.suggestedForLaterUnlocking).toBe(true);
    expect(tradeTutorialDecision.supportingAssetIds).toEqual(
      expect.arrayContaining(['module-risk-basics', 'help-trade-workbench-order-entry']),
    );

    expect(result.summary.lockedAssetIds).toContain('tutorial-trade-workbench-first-order');
    expect(result.summary.deemphasizedAssetIds).toContain('feature-trade-workbench');
    expect(result.summary.recommendedAssetIds).toEqual(
      expect.arrayContaining(['feature-portfolio-dashboard', 'module-risk-basics']),
    );
  });

  test('respects learner dismissal, explicit unlocks, and policy-driven recommendation overrides', async () => {
    const { adaptiveLearningModule, assets } = await loadAdaptiveCatalog();
    const learnerProfile: import('../../../domain/adaptive-learning').LearnerProfile = {
      learnerId: 'learner-state',
      knowledgeLevel: 'intermediate',
      investmentGoals: ['growth', 'income'],
      riskPreference: 'aggressive',
      interestedTags: ['stocks', 'trading'],
      completedAssets: [],
      progressMarkers: [],
      unlockedAssetIds: ['tutorial-trade-workbench-first-order'],
      hiddenAssetIds: ['feature-ai-chat-assistant'],
    };
    const policies: import('../../../domain/adaptive-learning').AdaptivePolicy[] = [
      {
        id: 'policy-recommend-trade-workbench',
        key: 'recommend-trade-workbench',
        description: 'Recommend the trading workflow once an aggressive learner reaches intermediate knowledge.',
        priority: 20,
        selector: {
          assetIds: ['feature-trade-workbench'],
        },
        conditions: [
          {
            type: 'knowledge-level-at-least',
            knowledgeLevel: 'intermediate',
          },
          {
            type: 'risk-preference-is',
            riskPreference: 'aggressive',
          },
        ],
        action: {
          recommended: true,
          highlighted: true,
          rationale: 'The learner is now ready for the main trading workflow.',
        },
      },
    ];

    const result = adaptiveLearningModule.evaluateAdaptivePolicyEngine(assets, learnerProfile, policies);
    const aiChatDecision = result.decisionsByAssetId['feature-ai-chat-assistant'];
    const tradeTutorialDecision = result.decisionsByAssetId['tutorial-trade-workbench-first-order'];
    const tradeFeatureDecision = result.decisionsByAssetId['feature-trade-workbench'];

    expect(aiChatDecision.availabilityState).toBe('hidden');
    expect(aiChatDecision.reasons).toContain('The learner dismissed this asset previously, so it remains hidden.');

    expect(tradeTutorialDecision.availabilityState).toBe('deemphasized');
    expect(tradeTutorialDecision.reasons).toContain('The asset has been explicitly unlocked for this learner.');

    expect(tradeFeatureDecision.recommended).toBe(true);
    expect(tradeFeatureDecision.highlighted).toBe(true);
    expect(tradeFeatureDecision.applicablePolicyIds).toEqual(['policy-recommend-trade-workbench']);
    expect(tradeFeatureDecision.explanation.summary).toContain('recommended now');

    expect(adaptiveLearningModule.exportAdaptiveFeatureGraphNodes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feature-trade-workbench',
        }),
      ]),
    );
  });
});
