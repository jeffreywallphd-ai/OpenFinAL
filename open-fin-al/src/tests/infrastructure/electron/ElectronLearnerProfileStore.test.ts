import { ElectronLearnerProfileStore } from '../../../infrastructure/electron/ElectronLearnerProfileStore';
import { buildLearnerProfileFromSurvey } from '../../../application/adaptive-learning/learnerProfile';

describe('ElectronLearnerProfileStore', () => {
  const SQLiteGet = jest.fn();
  const SQLiteInsert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).database = {
      SQLiteGet,
      SQLiteInsert,
    };
  });

  it('loads a stored learner profile row from SQLite', async () => {
    SQLiteGet.mockResolvedValue({
      userId: 4,
      learnerId: 'user-4',
      knowledgeLevel: 'intermediate',
      investmentGoalsJson: JSON.stringify(['growth']),
      riskPreference: 'moderate',
      confidenceScore: 3,
      selfAssessment: 'Wants tutorials.',
      interestedTagsJson: JSON.stringify(['guided-tutorials']),
      experienceMarkersJson: JSON.stringify(['placed-practice-trade']),
      completedAssetsJson: JSON.stringify([]),
      progressMarkersJson: JSON.stringify([]),
      unlockedAssetIdsJson: JSON.stringify([]),
      hiddenAssetIdsJson: JSON.stringify([]),
      profileVersion: 1,
      updatedAt: '2026-03-20T12:00:00.000Z',
    });

    const store = new ElectronLearnerProfileStore();
    await expect(store.loadByUserId(4)).resolves.toMatchObject({
      learnerId: 'user-4',
      knowledgeLevel: 'intermediate',
      interestedTags: ['guided-tutorials'],
    });
    expect(SQLiteGet).toHaveBeenCalledWith(expect.objectContaining({ parameters: [4] }));
  });

  it('upserts learner profile data into SQLite', async () => {
    SQLiteInsert.mockResolvedValue({ ok: true, lastID: 4 });

    const profile = buildLearnerProfileFromSurvey('user-4', {
      knowledgeLevel: 'advanced',
      investmentGoals: ['growth'],
      riskPreference: 'aggressive',
      confidenceScore: 5,
      selfAssessment: 'Ready for advanced analysis.',
      interestedTags: ['stocks'],
      experienceMarkers: ['owns-investments'],
      learningModulesCompleted: 5,
      practiceTradesCompleted: 3,
    }, undefined, '2026-03-20T12:00:00.000Z');

    const store = new ElectronLearnerProfileStore();
    await expect(store.saveByUserId(4, profile)).resolves.toBe(profile);
    expect(SQLiteInsert).toHaveBeenCalledWith(expect.objectContaining({
      query: expect.stringContaining('INSERT INTO LearnerProfile'),
      parameters: expect.arrayContaining([4, 'user-4', 'advanced']),
    }));
  });
});
