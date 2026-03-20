import { LearnerProfile } from '@domain/adaptive-learning';
import {
  ILearnerProfileStore,
} from '@application/services/ILearnerProfileStore';
import {
  mapLearnerProfileToPersistenceRecord,
  mapPersistenceRecordToLearnerProfile,
} from '@application/adaptive-learning/learnerProfile';

interface OpenFinALDatabase {
  SQLiteGet: (params: { query: string; parameters?: any[] }) => Promise<any>;
  SQLiteInsert: (params: { query: string; parameters?: any[] }) => Promise<any>;
}

declare const window: Window & { database: OpenFinALDatabase };

export class ElectronLearnerProfileStore implements ILearnerProfileStore {
  async loadByUserId(userId: number): Promise<LearnerProfile | null> {
    const row = await window.database.SQLiteGet({
      query: `SELECT
        userId,
        learnerId,
        knowledgeLevel,
        investmentGoalsJson,
        riskPreference,
        confidenceScore,
        selfAssessment,
        interestedTagsJson,
        experienceMarkersJson,
        completedAssetsJson,
        progressMarkersJson,
        unlockedAssetIdsJson,
        hiddenAssetIdsJson,
        profileVersion,
        updatedAt
      FROM LearnerProfile
      WHERE userId = ?`,
      parameters: [userId],
    });

    if (!row) {
      return null;
    }

    return mapPersistenceRecordToLearnerProfile(row);
  }

  async saveByUserId(userId: number, profile: LearnerProfile): Promise<LearnerProfile> {
    const record = mapLearnerProfileToPersistenceRecord(userId, profile);

    await window.database.SQLiteInsert({
      query: `INSERT INTO LearnerProfile (
        userId,
        learnerId,
        knowledgeLevel,
        investmentGoalsJson,
        riskPreference,
        confidenceScore,
        selfAssessment,
        interestedTagsJson,
        experienceMarkersJson,
        completedAssetsJson,
        progressMarkersJson,
        unlockedAssetIdsJson,
        hiddenAssetIdsJson,
        profileVersion,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        learnerId = excluded.learnerId,
        knowledgeLevel = excluded.knowledgeLevel,
        investmentGoalsJson = excluded.investmentGoalsJson,
        riskPreference = excluded.riskPreference,
        confidenceScore = excluded.confidenceScore,
        selfAssessment = excluded.selfAssessment,
        interestedTagsJson = excluded.interestedTagsJson,
        experienceMarkersJson = excluded.experienceMarkersJson,
        completedAssetsJson = excluded.completedAssetsJson,
        progressMarkersJson = excluded.progressMarkersJson,
        unlockedAssetIdsJson = excluded.unlockedAssetIdsJson,
        hiddenAssetIdsJson = excluded.hiddenAssetIdsJson,
        profileVersion = excluded.profileVersion,
        updatedAt = excluded.updatedAt`,
      parameters: [
        record.userId,
        record.learnerId,
        record.knowledgeLevel,
        record.investmentGoalsJson,
        record.riskPreference,
        record.confidenceScore,
        record.selfAssessment,
        record.interestedTagsJson,
        record.experienceMarkersJson,
        record.completedAssetsJson,
        record.progressMarkersJson,
        record.unlockedAssetIdsJson,
        record.hiddenAssetIdsJson,
        record.profileVersion,
        record.updatedAt,
      ],
    });

    return profile;
  }
}
