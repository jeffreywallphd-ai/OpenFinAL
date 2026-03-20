import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import { AdaptiveGraphAssetRecommendation, LearnerProfile } from '@domain/adaptive-learning';
import { buildTradeWorkbenchAdaptiveSlice } from '@ui/adaptive/tradeWorkbenchAdaptive';

describe('trade workbench adaptive UI mapping', () => {
  test('falls back to usable defaults when no learner profile exists', () => {
    const profile = createDefaultLearnerProfile('user-guest');
    const slice = buildTradeWorkbenchAdaptiveSlice({
      profile,
      hasLearnerProfile: false,
      graphRecommendations: [],
    });

    expect(slice.hasLearnerProfile).toBe(false);
    expect(slice.tools.chartReview.visible).toBe(true);
    expect(slice.tools.placeTrade.locked).toBe(false);
    expect(slice.tools.aiFundamentalAnalysis.deemphasized).toBe(true);
    expect(slice.learningAssets[0].title).toBe('Risk basics module');
    expect(slice.learningAssets[0].recommended).toBe(true);
    expect(slice.banner.message).toContain('learner profile');
  });

  test('maps learner profile policy decisions into locked, deemphasized, and learn-first trade UI states', () => {
    const profile: LearnerProfile = {
      learnerId: 'learner-beginner',
      knowledgeLevel: 'beginner',
      investmentGoals: ['retirement', 'diversification'],
      riskPreference: 'conservative',
      interestedTags: ['portfolio'],
      completedAssets: [],
      progressMarkers: [],
      unlockedAssetIds: [],
      hiddenAssetIds: [],
    };

    const slice = buildTradeWorkbenchAdaptiveSlice({
      profile,
      hasLearnerProfile: true,
      graphRecommendations: [],
    });

    expect(slice.tools.chartReview.visible).toBe(true);
    expect(slice.tools.placeTrade.locked).toBe(true);
    expect(slice.tools.placeTrade.message).toContain('Unlock later');
    expect(slice.tools.secFilings.deemphasized).toBe(true);
    expect(slice.tools.aiFundamentalAnalysis.deemphasized).toBe(true);
    expect(slice.learningAssets.find((asset) => asset.assetId === 'module-risk-basics')?.recommended).toBe(true);
    expect(slice.banner.title).toBe('Learn first, then trade');
  });

  test('uses learner-graph recommendations to highlight next tools and learning assets', () => {
    const profile: LearnerProfile = {
      learnerId: 'learner-ready',
      knowledgeLevel: 'advanced',
      investmentGoals: ['growth', 'income'],
      riskPreference: 'aggressive',
      interestedTags: ['stocks', 'trading'],
      completedAssets: [
        {
          assetId: 'module-risk-basics',
          completedAt: '2026-03-20T12:00:00.000Z',
          completionType: 'completed',
        },
      ],
      progressMarkers: [],
      unlockedAssetIds: ['tutorial-trade-workbench-first-order'],
      hiddenAssetIds: [],
    };
    const graphRecommendations: AdaptiveGraphAssetRecommendation[] = [
      {
        assetId: 'tutorial-trade-workbench-first-order',
        kind: 'tutorial',
        title: 'Trade workbench first-order tutorial',
        category: 'market-mechanics',
        knowledgeLevel: 'intermediate',
        relevanceScore: 9,
        reasons: ['Graph match: related trading activity indicates the guided first-order workflow is next.'],
        tutorialAssetIds: [],
        helpAssetIds: ['help-trade-workbench-order-entry'],
        prerequisiteAssetIds: ['module-risk-basics'],
        completed: false,
      },
      {
        assetId: 'help-trade-workbench-order-entry',
        kind: 'help-hint',
        title: 'Trade workbench order-entry hint',
        category: 'platform-guidance',
        knowledgeLevel: 'intermediate',
        relevanceScore: 7,
        reasons: ['Graph match: keep the order-entry hint nearby after the tutorial.'],
        tutorialAssetIds: ['tutorial-trade-workbench-first-order'],
        helpAssetIds: [],
        prerequisiteAssetIds: [],
        completed: false,
      },
    ];

    const slice = buildTradeWorkbenchAdaptiveSlice({
      profile,
      hasLearnerProfile: true,
      graphRecommendations,
    });

    expect(slice.graphRecommendations).toHaveLength(2);
    expect(slice.learningAssets[0].assetId).toBe('tutorial-trade-workbench-first-order');
    expect(slice.learningAssets[0].highlighted).toBe(true);
    expect(slice.learningAssets[0].recommendationReasons[0]).toContain('Graph match');
    expect(slice.tools.placeTrade.locked).toBe(false);
  });
});
