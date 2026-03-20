import { LearnerProfileInteractor } from '../../Interactor/LearnerProfileInteractor';
import { createDefaultLearnerProfile } from '../../application/adaptive-learning/learnerProfile';

describe('LearnerProfileInteractor', () => {
  it('returns validation errors without persisting invalid profiles', async () => {
    const saveByUserId = jest.fn();
    const interactor = new LearnerProfileInteractor({
      learnerProfileStore: {
        loadByUserId: jest.fn().mockResolvedValue(null),
        saveByUserId,
      },
      now: () => new Date('2026-03-20T12:00:00.000Z'),
    });

    await expect(interactor.saveProfile(9, {
      knowledgeLevel: '',
      investmentGoals: [],
      riskPreference: '',
      confidenceScore: null,
      selfAssessment: '',
      interestedTags: [],
      experienceMarkers: [],
      learningModulesCompleted: 0,
      practiceTradesCompleted: 0,
    })).resolves.toEqual({
      success: false,
      errors: [
        'Select the learner\'s current financial knowledge level.',
        'Select the learner\'s risk preference.',
        'Select at least one investment goal.',
      ],
    });

    expect(saveByUserId).not.toHaveBeenCalled();
  });

  it('loads defaults and persists a mapped learner profile for valid input', async () => {
    const existingProfile = createDefaultLearnerProfile('user-12');
    const saveByUserId = jest.fn(async (_userId, profile) => profile);
    const interactor = new LearnerProfileInteractor({
      learnerProfileStore: {
        loadByUserId: jest.fn().mockResolvedValue(existingProfile),
        saveByUserId,
      },
      now: () => new Date('2026-03-20T12:00:00.000Z'),
    });

    const result = await interactor.saveProfile(12, {
      knowledgeLevel: 'beginner',
      investmentGoals: ['retirement'],
      riskPreference: 'conservative',
      confidenceScore: 2,
      selfAssessment: 'Needs gentle onboarding.',
      interestedTags: ['guided-tutorials'],
      experienceMarkers: ['tracks-a-budget'],
      learningModulesCompleted: 1,
      practiceTradesCompleted: 0,
    });

    expect(result.success).toBe(true);
    expect(result.profile).toMatchObject({
      learnerId: 'user-12',
      investmentGoals: ['retirement'],
      riskPreference: 'conservative',
      confidenceScore: 2,
    });
    expect(saveByUserId).toHaveBeenCalledWith(12, expect.objectContaining({ learnerId: 'user-12' }));
  });
});
