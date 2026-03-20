CREATE TABLE IF NOT EXISTS LearnerProfile (
    userId INTEGER PRIMARY KEY,
    learnerId TEXT NOT NULL DEFAULT '',
    knowledgeLevel TEXT NOT NULL DEFAULT 'unknown',
    investmentGoalsJson TEXT NOT NULL DEFAULT '[]',
    riskPreference TEXT NOT NULL DEFAULT 'unknown',
    confidenceScore INTEGER,
    selfAssessment TEXT,
    interestedTagsJson TEXT NOT NULL DEFAULT '[]',
    experienceMarkersJson TEXT NOT NULL DEFAULT '[]',
    completedAssetsJson TEXT NOT NULL DEFAULT '[]',
    progressMarkersJson TEXT NOT NULL DEFAULT '[]',
    unlockedAssetIdsJson TEXT NOT NULL DEFAULT '[]',
    hiddenAssetIdsJson TEXT NOT NULL DEFAULT '[]',
    profileVersion INTEGER NOT NULL DEFAULT 1,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

UPDATE LearnerProfile
SET learnerId = printf('user-%s', userId)
WHERE learnerId = '';
