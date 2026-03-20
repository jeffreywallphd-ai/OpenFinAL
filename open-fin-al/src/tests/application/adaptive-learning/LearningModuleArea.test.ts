import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import { buildAdaptiveLearningModuleCards, PersistedLearningModuleRecord } from '@application/adaptive-learning/learningModuleArea';
import { buildAdaptiveLearningCatalogRuntime } from '@ui/adaptive/learningCatalogAdaptive';

describe('adaptive learning module area integration', () => {
  test('enriches persisted learning modules with adaptive metadata, unlocks, and incremental content delivery details', () => {
    const profile = createDefaultLearnerProfile('learner-module-area');
    const runtime = buildAdaptiveLearningCatalogRuntime({
      profile,
      hasLearnerProfile: true,
      graphRecommendations: [
        {
          assetId: 'module-investing-basics',
          kind: 'learning-module',
          title: 'Investing basics module',
          category: 'foundations',
          knowledgeLevel: 'beginner',
          relevanceScore: 8,
          reasons: ['Graph match: the learner is exploring foundations from the learning catalog.'],
          tutorialAssetIds: ['tutorial-learning-modules-search'],
          helpAssetIds: ['help-learning-modules-filters'],
          prerequisiteAssetIds: [],
          completed: false,
        },
      ],
    });
    const modules: PersistedLearningModuleRecord[] = [
      {
        id: 9,
        title: 'Introduction to Investing',
        description: 'Foundational introduction to investing.',
        keywords: 'investing stocks bonds ETFs mutal funds',
        timeEstimate: 10,
        category: 'ETF',
        fileName: 'IntroductionToInvesting.pptx',
      },
      {
        id: 7,
        title: 'What is stock screening?',
        description: 'Legacy stock screening module.',
        keywords: 'stock screening introduction',
        timeEstimate: 10,
        category: 'Stock Screening',
      },
    ];

    const cards = buildAdaptiveLearningModuleCards(modules, {
      profile,
      graphRecommendations: runtime.graphRecommendations,
      recommendationResult: runtime.recommendationResult,
    });

    expect(cards[0]).toEqual(
      expect.objectContaining({
        moduleId: 9,
        adaptiveAssetId: 'module-investing-basics',
        recommended: true,
        contentSource: expect.objectContaining({
          mode: 'pptx-preview',
          incrementalDelivery: true,
        }),
      }),
    );
    expect(cards[0].relatedFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'feature-learning-modules-catalog',
        }),
      ]),
    );
    expect(cards[0].tutorials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'tutorial-learning-modules-search',
        }),
      ]),
    );
    expect(cards[0].unlockOpportunities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Portfolio dashboard walkthrough',
        }),
      ]),
    );
    expect(cards[0].graphReasons[0]).toContain('Graph match');
    expect(cards[1].adaptiveAssetId).toBeUndefined();
    expect(cards[1].contentSource.mode).toBe('unknown');
  });

  test('uses legacy page records as metadata-backed content without requiring a converter rewrite', () => {
    const profile = createDefaultLearnerProfile('learner-module-pages');
    const cards = buildAdaptiveLearningModuleCards(
      [
        {
          id: 4,
          title: 'Risk Free Investments',
          description: 'Legacy risk module.',
          keywords: 'risk free investments',
          timeEstimate: 10,
          category: 'Risk Free Investments',
        },
      ],
      {
        profile,
        modulePagesByModuleId: {
          4: [
            {
              moduleId: 4,
              title: 'Topics Covered',
              pageNumber: 1,
              pageContentUrl: 'RiskFreeInvestments/Slide1.html',
            },
          ],
        },
      },
    );

    expect(cards[0].adaptiveAssetId).toBe('module-risk-basics');
    expect(cards[0].contentSource).toEqual(
      expect.objectContaining({
        mode: 'legacy-html-pages',
        hasRichContent: true,
        incrementalDelivery: true,
      }),
    );
  });
});
