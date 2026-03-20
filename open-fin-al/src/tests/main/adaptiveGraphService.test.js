const { createAdaptiveGraphService } = require('../../main/services/adaptiveGraph/createAdaptiveGraphService');
const {
  countCatalogRelationships,
  createNeo4jAdaptiveGraphRuntime,
} = require('../../main/services/adaptiveGraph/createNeo4jAdaptiveGraphRuntime');

describe('adaptive graph services', () => {
  test('adaptive graph service delegates to the injected runtime', async () => {
    const graphRuntime = {
      syncAdaptiveGraphCatalog: jest.fn().mockResolvedValue({ backend: 'neo4j', mode: 'incremental' }),
      syncAdaptiveLearningGraph: jest.fn().mockResolvedValue({ backend: 'neo4j' }),
      getLearnerSnapshot: jest.fn().mockResolvedValue({ learnerProfile: { learnerId: 'learner-1' }, recommendations: [] }),
      findRelevantAssets: jest.fn().mockResolvedValue([]),
    };

    const service = createAdaptiveGraphService({ graphRuntime });
    await expect(service.syncAdaptiveGraphCatalog({ assetNodes: [], syncedAt: '2026-03-20T12:00:00.000Z' })).resolves.toEqual({ backend: 'neo4j', mode: 'incremental' });
    await expect(service.syncAdaptiveLearningGraph({ learnerProfile: { learnerId: 'learner-1' }, assetNodes: [], syncedAt: '2026-03-20T12:00:00.000Z' })).resolves.toEqual({ backend: 'neo4j' });
    await expect(service.getLearnerSnapshot('learner-1')).resolves.toMatchObject({ learnerProfile: { learnerId: 'learner-1' } });
    await expect(service.findRelevantAssets({ learnerId: 'learner-1' })).resolves.toEqual([]);
  });

  test('Neo4j runtime syncs catalog assets idempotently before learner data and maps recommendation queries without leaking Cypher details', async () => {
    const runLog = [];
    const session = {
      run: jest.fn(async (query, params) => {
        runLog.push({ query, params });

        if (query.includes('RETURN asset.id AS assetId')) {
          return {
            records: [
              {
                toObject: () => ({
                  assetId: 'module-investing-basics',
                  kind: 'learning-module',
                  title: 'Investing Basics',
                  category: 'foundations',
                  knowledgeLevel: 'beginner',
                  tutorialAssetIds: ['tutorial-learning-modules-search'],
                  helpAssetIds: ['help-learning-modules-filters'],
                  prerequisiteAssetIds: [],
                  goalMatches: 1,
                  tagMatches: 1,
                  relatedMatches: 0,
                  progressMatchCount: 1,
                  hidden: false,
                  completed: false,
                  relevanceScore: 6,
                }),
              },
            ],
          };
        }

        if (query.includes('RETURN learner.learnerId AS learnerId')) {
          return {
            records: [
              {
                toObject: () => ({
                  learnerId: 'learner-1',
                  knowledgeLevel: 'beginner',
                  investmentGoals: ['growth'],
                  riskPreference: 'moderate',
                  confidenceScore: 3,
                  interestedTags: ['stocks'],
                  experienceMarkers: ['completed-learning-module'],
                  completedAssetIds: ['module-investing-basics'],
                  progressMarkers: [{ key: 'self-reported-learning-modules-completed', value: 2, updatedAt: '2026-03-20T12:00:00.000Z' }],
                  unlockedAssetIds: ['feature-trade-workbench'],
                  hiddenAssetIds: [],
                  updatedAt: '2026-03-20T12:00:00.000Z',
                }),
              },
            ],
          };
        }

        return { records: [] };
      }),
      close: jest.fn(),
    };
    const driver = {
      session: jest.fn(() => session),
      close: jest.fn(),
    };

    const runtime = createNeo4jAdaptiveGraphRuntime({
      createDriver: jest.fn(async () => driver),
      config: {
        enabled: true,
        uri: 'bolt://127.0.0.1:7687',
        username: 'neo4j',
        password: 'openfinal',
      },
    });

    const catalogPayload = {
      assetNodes: [
        {
          id: 'module-investing-basics',
          key: 'investing-basics',
          kind: 'learning-module',
          title: 'Investing Basics',
          description: 'Introduces investing terminology and the platform learning flow.',
          category: 'foundations',
          knowledgeLevel: 'beginner',
          defaultAvailability: 'enabled',
          isUserFacing: true,
          tags: ['stocks'],
          investmentGoals: ['growth'],
          riskAlignment: ['moderate'],
          prerequisites: [],
          governance: {
            defaultAvailabilityState: 'visible',
            eligibleForRecommendation: true,
            eligibleForHighlighting: true,
            visibleDuringOnboarding: true,
          },
          source: 'src/View/Learn.jsx',
          registeredAt: '2026-03-20T11:59:00.000Z',
          relationships: {
            relatedAssetIds: ['tutorial-learning-modules-search'],
            relatedFeatureIds: ['feature-learning-modules-catalog'],
            tutorialAssetIds: ['tutorial-learning-modules-search'],
            helpAssetIds: ['help-learning-modules-filters'],
            accessibilityAssetIds: [],
          },
          relatedFeatureIds: ['feature-learning-modules-catalog'],
          supportedModalities: ['reading'],
          unlockValue: 0.25,
          recommendedNextSteps: [
            {
              assetId: 'tutorial-learning-modules-search',
              title: 'Learning modules tutorial',
              reason: 'Move from reading into guided practice.',
              unlockValue: 0.4,
            },
          ],
        },
      ],
      syncedAt: '2026-03-20T12:00:00.000Z',
      mode: 'incremental',
    };

    const catalogResult = await runtime.syncAdaptiveGraphCatalog(catalogPayload);

    expect(catalogResult).toEqual({
      assetCount: 1,
      relationshipCount: countCatalogRelationships(catalogPayload.assetNodes),
      syncedAt: '2026-03-20T12:00:00.000Z',
      backend: 'neo4j',
      mode: 'incremental',
    });
    expect(runLog.some((entry) => entry.query.includes('MERGE (node:AdaptiveAsset { id: asset.id })'))).toBe(true);
    expect(runLog.some((entry) => entry.query.includes('RELEVANT_TO_FEATURE'))).toBe(true);
    expect(runLog.some((entry) => entry.query.includes('NEXT_STEP'))).toBe(true);

    const syncResult = await runtime.syncAdaptiveLearningGraph({
      learnerProfile: {
        learnerId: 'learner-1',
        knowledgeLevel: 'beginner',
        investmentGoals: ['growth'],
        riskPreference: 'moderate',
        confidenceScore: 3,
        interestedTags: ['stocks'],
        experienceMarkers: ['completed-learning-module'],
        completedAssetIds: ['module-investing-basics'],
        progressMarkers: [{ key: 'self-reported-learning-modules-completed', value: 2, updatedAt: '2026-03-20T12:00:00.000Z' }],
        unlockedAssetIds: ['feature-trade-workbench'],
        hiddenAssetIds: [],
        updatedAt: '2026-03-20T12:00:00.000Z',
      },
      assetNodes: [
        {
          id: 'module-investing-basics',
          kind: 'learning-module',
          title: 'Investing Basics',
          category: 'foundations',
          knowledgeLevel: 'beginner',
          defaultAvailability: 'enabled',
          isUserFacing: true,
          tags: ['stocks'],
          investmentGoals: ['growth'],
          riskAlignment: ['moderate'],
          prerequisites: [],
          relationships: {
            relatedAssetIds: [],
            relatedFeatureIds: ['feature-learning-modules-catalog'],
            tutorialAssetIds: ['tutorial-learning-modules-search'],
            helpAssetIds: ['help-learning-modules-filters'],
            accessibilityAssetIds: [],
          },
          supportedModalities: ['reading'],
          unlockValue: 0.25,
        },
      ],
      syncedAt: '2026-03-20T12:00:00.000Z',
    });

    expect(syncResult).toEqual({
      learnerId: 'learner-1',
      assetCount: 1,
      syncedAt: '2026-03-20T12:00:00.000Z',
      backend: 'neo4j',
    });

    await expect(runtime.findRelevantAssets({ learnerId: 'learner-1', limit: 5 })).resolves.toEqual([
      expect.objectContaining({
        assetId: 'module-investing-basics',
        reasons: expect.arrayContaining(['aligned-investment-goal', 'aligned-interest-tag', 'progress-marker-match']),
      }),
    ]);
    await expect(runtime.getLearnerSnapshot('learner-1')).resolves.toMatchObject({
      learnerProfile: expect.objectContaining({ learnerId: 'learner-1' }),
      recommendations: [expect.objectContaining({ assetId: 'module-investing-basics' })],
    });
  });

  test('Neo4j runtime can be disabled without breaking repository callers', async () => {
    const runtime = createNeo4jAdaptiveGraphRuntime({
      createDriver: jest.fn(),
      config: { enabled: false },
    });

    await expect(runtime.syncAdaptiveGraphCatalog({
      assetNodes: [],
      syncedAt: '2026-03-20T12:00:00.000Z',
      mode: 'full',
    })).resolves.toEqual({
      assetCount: 0,
      relationshipCount: 0,
      syncedAt: '2026-03-20T12:00:00.000Z',
      backend: 'neo4j-disabled',
      mode: 'full',
    });
    await expect(runtime.syncAdaptiveLearningGraph({
      learnerProfile: { learnerId: 'learner-disabled' },
      assetNodes: [],
      syncedAt: '2026-03-20T12:00:00.000Z',
    })).resolves.toEqual({
      learnerId: 'learner-disabled',
      assetCount: 0,
      syncedAt: '2026-03-20T12:00:00.000Z',
      backend: 'neo4j-disabled',
    });
    await expect(runtime.getLearnerSnapshot('learner-disabled')).resolves.toBeNull();
    await expect(runtime.findRelevantAssets({ learnerId: 'learner-disabled' })).resolves.toEqual([]);
  });
});
