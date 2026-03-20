import { ElectronAdaptiveGraphRepository } from '../../../infrastructure/electron/ElectronAdaptiveGraphRepository';

describe('ElectronAdaptiveGraphRepository', () => {
  const syncAdaptiveLearningGraph = jest.fn();
  const getLearnerSnapshot = jest.fn();
  const findRelevantAssets = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).adaptiveGraph = {
      syncAdaptiveLearningGraph,
      getLearnerSnapshot,
      findRelevantAssets,
    };
  });

  it('delegates graph synchronization to the preload bridge', async () => {
    syncAdaptiveLearningGraph.mockResolvedValue({
      learnerId: 'learner-1',
      assetCount: 7,
      syncedAt: '2026-03-20T12:00:00.000Z',
      backend: 'neo4j',
    });

    const repository = new ElectronAdaptiveGraphRepository();
    await expect(repository.syncAdaptiveLearningGraph({
      learnerProfile: {
        learnerId: 'learner-1',
        knowledgeLevel: 'beginner',
        investmentGoals: ['growth'],
        riskPreference: 'moderate',
        interestedTags: [],
        experienceMarkers: [],
        completedAssetIds: [],
        progressMarkers: [],
        unlockedAssetIds: [],
        hiddenAssetIds: [],
      },
      assetNodes: [],
      syncedAt: '2026-03-20T12:00:00.000Z',
    })).resolves.toMatchObject({ backend: 'neo4j' });

    expect(syncAdaptiveLearningGraph).toHaveBeenCalledWith(expect.objectContaining({
      syncedAt: '2026-03-20T12:00:00.000Z',
    }));
  });

  it('loads a learner snapshot and relevant assets through the preload bridge', async () => {
    getLearnerSnapshot.mockResolvedValue({
      learnerProfile: {
        learnerId: 'learner-1',
        knowledgeLevel: 'beginner',
        investmentGoals: ['growth'],
        riskPreference: 'moderate',
        interestedTags: ['stocks'],
        experienceMarkers: [],
        completedAssetIds: [],
        progressMarkers: [],
        unlockedAssetIds: [],
        hiddenAssetIds: [],
      },
      recommendations: [],
    });
    findRelevantAssets.mockResolvedValue([
      {
        assetId: 'module-investing-basics',
        kind: 'learning-module',
        title: 'Investing Basics',
        category: 'foundations',
        knowledgeLevel: 'beginner',
        relevanceScore: 8,
        reasons: ['aligned-investment-goal'],
        tutorialAssetIds: ['tutorial-learning-modules-search'],
        helpAssetIds: [],
        prerequisiteAssetIds: [],
        completed: false,
      },
    ]);

    const repository = new ElectronAdaptiveGraphRepository();
    await expect(repository.getLearnerSnapshot('learner-1')).resolves.toMatchObject({
      learnerProfile: expect.objectContaining({ learnerId: 'learner-1' }),
    });
    await expect(repository.findRelevantAssets({ learnerId: 'learner-1', limit: 5 })).resolves.toHaveLength(1);

    expect(getLearnerSnapshot).toHaveBeenCalledWith('learner-1');
    expect(findRelevantAssets).toHaveBeenCalledWith({ learnerId: 'learner-1', limit: 5 });
  });
});
