import {
  buildLearnerProfileFromSurvey,
  createDefaultLearnerProfile,
  createSurveyInputFromProfile,
  mapLearnerProfileToPersistenceRecord,
  mapPersistenceRecordToLearnerProfile,
  PROFILE_COMPLETED_MARKER_KEY,
  SELF_REPORTED_MODULES_MARKER_KEY,
  SELF_REPORTED_TRADES_MARKER_KEY,
  validateLearnerProfileSurveyInput,
} from '../../../application/adaptive-learning/learnerProfile';

import { LearnerProfileSurveyInput } from '../../../application/adaptive-learning/learnerProfile';

describe('learner profile application mapping', () => {
  const validInput: LearnerProfileSurveyInput = {
    knowledgeLevel: 'beginner',
    investmentGoals: ['growth', 'retirement'],
    riskPreference: 'moderate',
    confidenceScore: 4,
    selfAssessment: 'I know the basics but still want guidance.',
    interestedTags: ['stocks', 'guided-tutorials'],
    experienceMarkers: ['completed-learning-module'],
    learningModulesCompleted: 3,
    practiceTradesCompleted: 1,
  };

  it('validates required survey fields', () => {
    expect(validateLearnerProfileSurveyInput({
      ...validInput,
      knowledgeLevel: '',
      investmentGoals: [],
      riskPreference: '',
      confidenceScore: 7,
    })).toEqual([
      'Select the learner\'s current financial knowledge level.',
      'Select the learner\'s risk preference.',
      'Select at least one investment goal.',
      'Confidence score must be a whole number between 1 and 5.',
    ]);
  });

  it('builds a learner profile and merges survey progress markers', () => {
    const existing = createDefaultLearnerProfile('user-10');
    existing.completedAssets = [
      {
        assetId: 'module-investing-basics',
        completedAt: '2026-03-20T00:00:00.000Z',
        completionType: 'completed',
      },
    ];

    const profile = buildLearnerProfileFromSurvey('user-10', validInput, existing, '2026-03-20T12:00:00.000Z');

    expect(profile.knowledgeLevel).toBe('beginner');
    expect(profile.riskPreference).toBe('moderate');
    expect(profile.completedAssets).toHaveLength(1);
    expect(profile.confidenceScore).toBe(4);
    expect(profile.selfAssessment).toContain('guidance');
    expect(profile.progressMarkers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: PROFILE_COMPLETED_MARKER_KEY, value: 1 }),
        expect.objectContaining({ key: SELF_REPORTED_MODULES_MARKER_KEY, value: 3 }),
        expect.objectContaining({ key: SELF_REPORTED_TRADES_MARKER_KEY, value: 1 }),
      ]),
    );
  });

  it('round-trips a learner profile through the persistence mapper', () => {
    const profile = buildLearnerProfileFromSurvey('user-11', validInput, undefined, '2026-03-20T12:00:00.000Z');
    const record = mapLearnerProfileToPersistenceRecord(11, profile);
    const restored = mapPersistenceRecordToLearnerProfile(record);

    expect(restored).toMatchObject({
      learnerId: 'user-11',
      knowledgeLevel: 'beginner',
      investmentGoals: ['growth', 'retirement'],
      riskPreference: 'moderate',
      confidenceScore: 4,
      interestedTags: ['stocks', 'guided-tutorials'],
      experienceMarkers: ['completed-learning-module'],
    });
    expect(createSurveyInputFromProfile(restored)).toMatchObject({
      knowledgeLevel: 'beginner',
      riskPreference: 'moderate',
      learningModulesCompleted: 3,
      practiceTradesCompleted: 1,
    });
  });
});
