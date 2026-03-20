function createDisabledNeo4jRuntime() {
  return {
    async syncAdaptiveGraphCatalog(payload) {
      return {
        assetCount: payload.assetNodes.length,
        relationshipCount: countCatalogRelationships(payload.assetNodes),
        syncedAt: payload.syncedAt,
        backend: 'neo4j-disabled',
        mode: payload.mode ?? 'incremental',
      };
    },
    async syncAdaptiveLearningGraph(payload) {
      return {
        learnerId: payload.learnerProfile.learnerId,
        assetCount: payload.assetNodes.length,
        syncedAt: payload.syncedAt,
        backend: 'neo4j-disabled',
      };
    },
    async getLearnerSnapshot() {
      return null;
    },
    async findRelevantAssets() {
      return [];
    },
    async close() {},
  };
}

function countCatalogRelationships(assetNodes = []) {
  return assetNodes.reduce((total, asset) => total
    + (asset.relationships?.relatedAssetIds?.length ?? 0)
    + (asset.relationships?.relatedFeatureIds?.length ?? 0)
    + (asset.relationships?.tutorialAssetIds?.length ?? 0)
    + (asset.relationships?.helpAssetIds?.length ?? 0)
    + (asset.relationships?.accessibilityAssetIds?.length ?? 0)
    + (asset.prerequisites?.length ?? 0)
    + (asset.tags?.length ?? 0)
    + (asset.investmentGoals?.length ?? 0)
    + (asset.riskAlignment?.length ?? 0)
    + (asset.tutorialForAssetId ? 1 : 0)
    + (asset.hintForAssetId ? 1 : 0)
    + (asset.recommendedNextSteps?.filter((step) => step.assetId).length ?? 0), 0);
}


function normalizeCatalogAssetNodes(assetNodes = []) {
  return assetNodes.map((asset) => ({
    ...asset,
    key: asset.key ?? asset.id,
    description: asset.description ?? '',
    tags: asset.tags ?? [],
    investmentGoals: asset.investmentGoals ?? [],
    riskAlignment: asset.riskAlignment ?? [],
    prerequisites: asset.prerequisites ?? [],
    relationships: {
      relatedAssetIds: asset.relationships?.relatedAssetIds ?? [],
      relatedFeatureIds: asset.relationships?.relatedFeatureIds ?? [],
      tutorialAssetIds: asset.relationships?.tutorialAssetIds ?? [],
      helpAssetIds: asset.relationships?.helpAssetIds ?? [],
      accessibilityAssetIds: asset.relationships?.accessibilityAssetIds ?? [],
    },
    governance: {
      defaultAvailabilityState: asset.governance?.defaultAvailabilityState ?? 'visible',
      eligibleForRecommendation: asset.governance?.eligibleForRecommendation ?? true,
      eligibleForHighlighting: asset.governance?.eligibleForHighlighting ?? true,
      visibleDuringOnboarding: asset.governance?.visibleDuringOnboarding ?? false,
      lockWhenPrerequisitesUnmet: asset.governance?.lockWhenPrerequisitesUnmet ?? false,
      hideWhenLearnerDismisses: asset.governance?.hideWhenLearnerDismisses ?? false,
    },
    relatedFeatureIds: asset.relatedFeatureIds ?? asset.relationships?.relatedFeatureIds ?? [],
    supportedModalities: asset.supportedModalities ?? [],
    unlockValue: asset.unlockValue ?? null,
    source: asset.source ?? null,
    registeredAt: asset.registeredAt ?? null,
    tutorialForAssetId: asset.tutorialForAssetId ?? null,
    hintForAssetId: asset.hintForAssetId ?? null,
    estimatedDurationMinutes: asset.estimatedDurationMinutes ?? null,
    recommendedNextSteps: (asset.recommendedNextSteps ?? []).map((step) => ({
      ...step,
      assetId: step.assetId ?? null,
      unlockValue: step.unlockValue ?? null,
    })),
  }));
}

function createNeo4jAdaptiveGraphRuntime({
  createDriver,
  logger = console,
  config = {},
}) {
  const enabled = config.enabled !== false;
  if (!enabled) {
    return createDisabledNeo4jRuntime();
  }

  let driverPromise;

  async function getDriver() {
    if (!driverPromise) {
      driverPromise = Promise.resolve(createDriver(config));
    }

    return driverPromise;
  }

  async function withSession(mode, callback) {
    const driver = await getDriver();
    const session = driver.session({
      database: config.database,
      defaultAccessMode: mode,
    });

    try {
      return await callback(session);
    } finally {
      await session.close();
    }
  }

  async function ensureConstraints() {
    return withSession('WRITE', async (session) => {
      const statements = [
        'CREATE CONSTRAINT adaptive_learner_id IF NOT EXISTS FOR (n:LearnerProfile) REQUIRE n.learnerId IS UNIQUE',
        'CREATE CONSTRAINT adaptive_asset_id IF NOT EXISTS FOR (n:AdaptiveAsset) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT adaptive_knowledge_level IF NOT EXISTS FOR (n:KnowledgeLevel) REQUIRE n.value IS UNIQUE',
        'CREATE CONSTRAINT adaptive_investment_goal IF NOT EXISTS FOR (n:InvestmentGoal) REQUIRE n.value IS UNIQUE',
        'CREATE CONSTRAINT adaptive_risk_preference IF NOT EXISTS FOR (n:RiskPreference) REQUIRE n.value IS UNIQUE',
        'CREATE CONSTRAINT adaptive_progress_marker IF NOT EXISTS FOR (n:ProgressMarker) REQUIRE n.key IS UNIQUE',
        'CREATE CONSTRAINT adaptive_interest_tag IF NOT EXISTS FOR (n:InterestTag) REQUIRE n.value IS UNIQUE',
      ];

      for (const statement of statements) {
        await session.run(statement);
      }
    });
  }

  async function syncCatalogAssetNodes(session, assetNodes, syncedAt) {
    if (!assetNodes.length) {
      return;
    }

    await session.run(
      `UNWIND $assetNodes AS asset
       MERGE (node:AdaptiveAsset { id: asset.id })
       SET node.key = coalesce(asset.key, node.key),
           node.kind = asset.kind,
           node.title = asset.title,
           node.description = coalesce(asset.description, node.description),
           node.category = asset.category,
           node.knowledgeLevel = asset.knowledgeLevel,
           node.defaultAvailability = asset.defaultAvailability,
           node.isUserFacing = asset.isUserFacing,
           node.tags = asset.tags,
           node.investmentGoals = asset.investmentGoals,
           node.riskAlignment = asset.riskAlignment,
           node.supportedModalities = asset.supportedModalities,
           node.unlockValue = asset.unlockValue,
           node.source = coalesce(asset.source, node.source),
           node.registeredAt = coalesce(asset.registeredAt, node.registeredAt),
           node.estimatedDurationMinutes = asset.estimatedDurationMinutes,
           node.syncedAt = $syncedAt,
           node.governanceDefaultAvailabilityState = asset.governance.defaultAvailabilityState,
           node.governanceEligibleForRecommendation = asset.governance.eligibleForRecommendation,
           node.governanceEligibleForHighlighting = asset.governance.eligibleForHighlighting,
           node.governanceVisibleDuringOnboarding = coalesce(asset.governance.visibleDuringOnboarding, false),
           node.governanceLockWhenPrerequisitesUnmet = coalesce(asset.governance.lockWhenPrerequisitesUnmet, false),
           node.governanceHideWhenLearnerDismisses = coalesce(asset.governance.hideWhenLearnerDismisses, false)`,
      {
        assetNodes,
        syncedAt,
      },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       OPTIONAL MATCH (node)-[rel:RELATED_TO|RELEVANT_TO_FEATURE|HAS_TUTORIAL|HAS_HELP_HINT|HAS_ACCESSIBILITY_HINT|REQUIRES|TAGGED_WITH|ALIGNS_WITH_GOAL|ALIGNS_WITH_RISK|TUTORIAL_FOR|HINT_FOR|NEXT_STEP]->()
       DELETE rel`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.tags, []) AS tagValue
       MERGE (tag:InterestTag { value: tagValue })
       MERGE (node)-[:TAGGED_WITH]->(tag)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.investmentGoals, []) AS goalValue
       MERGE (goal:InvestmentGoal { value: goalValue })
       MERGE (node)-[:ALIGNS_WITH_GOAL]->(goal)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.riskAlignment, []) AS riskValue
       MERGE (risk:RiskPreference { value: riskValue })
       MERGE (node)-[:ALIGNS_WITH_RISK]->(risk)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.relationships.relatedAssetIds, []) AS relatedId
       MERGE (related:AdaptiveAsset { id: relatedId })
       MERGE (node)-[:RELATED_TO]->(related)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.relatedFeatureIds, []) AS relatedFeatureId
       MERGE (relatedFeature:AdaptiveAsset { id: relatedFeatureId })
       MERGE (node)-[:RELEVANT_TO_FEATURE]->(relatedFeature)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.relationships.tutorialAssetIds, []) AS tutorialId
       MERGE (tutorial:AdaptiveAsset { id: tutorialId })
       MERGE (node)-[:HAS_TUTORIAL]->(tutorial)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.relationships.helpAssetIds, []) AS hintId
       MERGE (hint:AdaptiveAsset { id: hintId })
       MERGE (node)-[:HAS_HELP_HINT]->(hint)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.relationships.accessibilityAssetIds, []) AS accessibilityId
       MERGE (accessibility:AdaptiveAsset { id: accessibilityId })
       MERGE (node)-[:HAS_ACCESSIBILITY_HINT]->(accessibility)`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       FOREACH (_ IN CASE WHEN asset.tutorialForAssetId IS NOT NULL THEN [1] ELSE [] END |
         MERGE (tutorialFor:AdaptiveAsset { id: asset.tutorialForAssetId })
         MERGE (node)-[:TUTORIAL_FOR]->(tutorialFor)
       )
       FOREACH (_ IN CASE WHEN asset.hintForAssetId IS NOT NULL THEN [1] ELSE [] END |
         MERGE (hintFor:AdaptiveAsset { id: asset.hintForAssetId })
         MERGE (node)-[:HINT_FOR]->(hintFor)
       )`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.recommendedNextSteps, []) AS nextStep
       WITH node, nextStep WHERE nextStep.assetId IS NOT NULL
       MERGE (recommended:AdaptiveAsset { id: nextStep.assetId })
       MERGE (node)-[rel:NEXT_STEP]->(recommended)
       SET rel.title = nextStep.title,
           rel.reason = nextStep.reason,
           rel.unlockValue = nextStep.unlockValue`,
      { assetNodes },
    );

    await session.run(
      `UNWIND $assetNodes AS asset
       MATCH (node:AdaptiveAsset { id: asset.id })
       UNWIND coalesce(asset.prerequisites, []) AS prerequisite
       FOREACH (_ IN CASE WHEN prerequisite.type = 'asset-completion' THEN [1] ELSE [] END |
         MERGE (requiredAsset:AdaptiveAsset { id: prerequisite.assetId })
         MERGE (node)-[:REQUIRES { type: prerequisite.type, description: prerequisite.description, optional: coalesce(prerequisite.optional, false) }]->(requiredAsset)
       )
       FOREACH (_ IN CASE WHEN prerequisite.type = 'knowledge-level' THEN [1] ELSE [] END |
         MERGE (requiredKnowledge:KnowledgeLevel { value: prerequisite.minimumKnowledgeLevel })
         MERGE (node)-[:REQUIRES { type: prerequisite.type, description: prerequisite.description, optional: coalesce(prerequisite.optional, false) }]->(requiredKnowledge)
       )
       FOREACH (_ IN CASE WHEN prerequisite.type = 'investment-goal' THEN [1] ELSE [] END |
         MERGE (requiredGoal:InvestmentGoal { value: prerequisite.investmentGoal })
         MERGE (node)-[:REQUIRES { type: prerequisite.type, description: prerequisite.description, optional: coalesce(prerequisite.optional, false) }]->(requiredGoal)
       )
       FOREACH (_ IN CASE WHEN prerequisite.type = 'risk-preference' THEN [1] ELSE [] END |
         FOREACH (riskValue IN prerequisite.allowedRiskPreferences |
           MERGE (requiredRisk:RiskPreference { value: riskValue })
           MERGE (node)-[:REQUIRES { type: prerequisite.type, description: prerequisite.description, optional: coalesce(prerequisite.optional, false) }]->(requiredRisk)
         )
       )
       FOREACH (_ IN CASE WHEN prerequisite.type = 'progress-marker' THEN [1] ELSE [] END |
         MERGE (requiredProgress:ProgressMarker { key: prerequisite.markerKey })
         MERGE (node)-[:REQUIRES { type: prerequisite.type, description: prerequisite.description, optional: coalesce(prerequisite.optional, false), minimumValue: prerequisite.minimumValue }]->(requiredProgress)
       )`,
      { assetNodes },
    );
  }

  function buildRecommendationReasons(record) {
    const reasons = [];

    if (record.goalMatches > 0) {
      reasons.push('aligned-investment-goal');
    }
    if (record.tagMatches > 0) {
      reasons.push('aligned-interest-tag');
    }
    if (record.relatedMatches > 0) {
      reasons.push('related-to-completed-asset');
    }
    if (record.progressMatchCount > 0) {
      reasons.push('progress-marker-match');
    }
    if (record.hidden === true) {
      reasons.push('currently-hidden');
    }

    return reasons;
  }

  async function syncAdaptiveGraphCatalog(payload) {
    await ensureConstraints();

    const mode = payload.mode ?? 'incremental';
    const assetNodes = normalizeCatalogAssetNodes(payload.assetNodes);

    await withSession('WRITE', async (session) => {
      await syncCatalogAssetNodes(session, assetNodes, payload.syncedAt);
    }).catch((error) => {
      logger.error('Failed to sync adaptive asset catalog to Neo4j.', error);
      throw error;
    });

    return {
      assetCount: assetNodes.length,
      relationshipCount: countCatalogRelationships(assetNodes),
      syncedAt: payload.syncedAt,
      backend: 'neo4j',
      mode,
    };
  }

  async function syncAdaptiveLearningGraph(payload) {
    await ensureConstraints();

    const assetNodes = normalizeCatalogAssetNodes(payload.assetNodes);

    await withSession('WRITE', async (session) => {
      await syncCatalogAssetNodes(session, assetNodes, payload.syncedAt);

      await session.run(
        `MERGE (learner:LearnerProfile { learnerId: $learnerId })
         SET learner.knowledgeLevel = $knowledgeLevel,
             learner.riskPreference = $riskPreference,
             learner.confidenceScore = $confidenceScore,
             learner.updatedAt = $updatedAt,
             learner.syncedAt = $syncedAt,
             learner.interestedTags = $interestedTags,
             learner.experienceMarkers = $experienceMarkers,
             learner.unlockedAssetIds = $unlockedAssetIds,
             learner.hiddenAssetIds = $hiddenAssetIds`,
        {
          learnerId: payload.learnerProfile.learnerId,
          knowledgeLevel: payload.learnerProfile.knowledgeLevel,
          riskPreference: payload.learnerProfile.riskPreference,
          confidenceScore: payload.learnerProfile.confidenceScore ?? null,
          updatedAt: payload.learnerProfile.updatedAt ?? payload.syncedAt,
          syncedAt: payload.syncedAt,
          interestedTags: payload.learnerProfile.interestedTags,
          experienceMarkers: payload.learnerProfile.experienceMarkers,
          unlockedAssetIds: payload.learnerProfile.unlockedAssetIds,
          hiddenAssetIds: payload.learnerProfile.hiddenAssetIds,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         OPTIONAL MATCH (learner)-[rel:PURSUES_GOAL|HAS_KNOWLEDGE_LEVEL|HAS_RISK_PREFERENCE|INTERESTED_IN_TAG|COMPLETED|HAS_PROGRESS|UNLOCKED_ASSET|HIDDEN_ASSET]->()
         DELETE rel`,
        { learnerId: payload.learnerProfile.learnerId },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         UNWIND $investmentGoals AS goalValue
         MERGE (goal:InvestmentGoal { value: goalValue })
         MERGE (learner)-[:PURSUES_GOAL]->(goal)`,
        {
          learnerId: payload.learnerProfile.learnerId,
          investmentGoals: payload.learnerProfile.investmentGoals,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         MERGE (level:KnowledgeLevel { value: $knowledgeLevel })
         MERGE (learner)-[:HAS_KNOWLEDGE_LEVEL]->(level)
         MERGE (risk:RiskPreference { value: $riskPreference })
         MERGE (learner)-[:HAS_RISK_PREFERENCE]->(risk)`,
        {
          learnerId: payload.learnerProfile.learnerId,
          knowledgeLevel: payload.learnerProfile.knowledgeLevel,
          riskPreference: payload.learnerProfile.riskPreference,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         UNWIND $tags AS tagValue
         MERGE (tag:InterestTag { value: tagValue })
         MERGE (learner)-[:INTERESTED_IN_TAG]->(tag)`,
        {
          learnerId: payload.learnerProfile.learnerId,
          tags: payload.learnerProfile.interestedTags,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         UNWIND $completedAssetIds AS assetId
         MERGE (asset:AdaptiveAsset { id: assetId })
         MERGE (learner)-[:COMPLETED]->(asset)`,
        {
          learnerId: payload.learnerProfile.learnerId,
          completedAssetIds: payload.learnerProfile.completedAssetIds,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         UNWIND $progressMarkers AS marker
         MERGE (progress:ProgressMarker { key: marker.key })
         SET progress.updatedAt = marker.updatedAt
         MERGE (learner)-[rel:HAS_PROGRESS]->(progress)
         SET rel.value = marker.value,
             rel.updatedAt = marker.updatedAt`,
        {
          learnerId: payload.learnerProfile.learnerId,
          progressMarkers: payload.learnerProfile.progressMarkers,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         UNWIND $assetIds AS assetId
         MERGE (asset:AdaptiveAsset { id: assetId })
         MERGE (learner)-[:UNLOCKED_ASSET]->(asset)`,
        {
          learnerId: payload.learnerProfile.learnerId,
          assetIds: payload.learnerProfile.unlockedAssetIds,
        },
      );

      await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         UNWIND $assetIds AS assetId
         MERGE (asset:AdaptiveAsset { id: assetId })
         MERGE (learner)-[:HIDDEN_ASSET]->(asset)`,
        {
          learnerId: payload.learnerProfile.learnerId,
          assetIds: payload.learnerProfile.hiddenAssetIds,
        },
      );
    }).catch((error) => {
      logger.error('Failed to sync adaptive learning graph to Neo4j.', error);
      throw error;
    });

    return {
      learnerId: payload.learnerProfile.learnerId,
      assetCount: payload.assetNodes.length,
      syncedAt: payload.syncedAt,
      backend: 'neo4j',
    };
  }

  async function findRelevantAssets(query) {
    const records = await withSession('READ', async (session) => {
      const result = await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         MATCH (asset:AdaptiveAsset)
         WHERE ($includeCompleted = true OR NOT EXISTS((learner)-[:COMPLETED]->(asset)))
           AND ($kinds IS NULL OR asset.kind IN $kinds)
           AND ($categories IS NULL OR asset.category IN $categories)
           AND asset.isUserFacing = true
         OPTIONAL MATCH (learner)-[:PURSUES_GOAL]->(goal:InvestmentGoal)
         WITH learner, asset, collect(DISTINCT goal.value) AS learnerGoals
         OPTIONAL MATCH (learner)-[:INTERESTED_IN_TAG]->(tag:InterestTag)
         WITH learner, asset, learnerGoals, collect(DISTINCT tag.value) AS learnerTags
         OPTIONAL MATCH (learner)-[:COMPLETED]->(completed:AdaptiveAsset)-[:RELATED_TO]->(asset)
         WITH learner, asset, learnerGoals, learnerTags, count(DISTINCT completed) AS relatedMatches
         OPTIONAL MATCH (learner)-[progressRel:HAS_PROGRESS]->(marker:ProgressMarker)
           <-[requiresProgress:REQUIRES { type: 'progress-marker' }]-(asset)
         WHERE progressRel.value >= coalesce(requiresProgress.minimumValue, 0)
         WITH learner, asset, learnerGoals, learnerTags, relatedMatches, count(DISTINCT marker) AS progressMatchCount
         OPTIONAL MATCH (asset)-[:HAS_TUTORIAL]->(tutorial:AdaptiveAsset)
         WITH learner, asset, learnerGoals, learnerTags, relatedMatches, progressMatchCount, collect(DISTINCT tutorial.id) AS tutorialAssetIds
         OPTIONAL MATCH (asset)-[:HAS_HELP_HINT]->(hint:AdaptiveAsset)
         WITH learner, asset, learnerGoals, learnerTags, relatedMatches, progressMatchCount, tutorialAssetIds, collect(DISTINCT hint.id) AS helpAssetIds
         OPTIONAL MATCH (asset)-[:REQUIRES { type: 'asset-completion' }]->(requiredAsset:AdaptiveAsset)
         WITH learner, asset, learnerGoals, learnerTags, relatedMatches, progressMatchCount, tutorialAssetIds, helpAssetIds, collect(DISTINCT requiredAsset.id) AS prerequisiteAssetIds
         OPTIONAL MATCH (learner)-[:HIDDEN_ASSET]->(hiddenAsset:AdaptiveAsset { id: asset.id })
         WITH asset, learnerGoals, learnerTags, relatedMatches, progressMatchCount, tutorialAssetIds, helpAssetIds, prerequisiteAssetIds,
              hiddenAsset IS NOT NULL AS hidden,
              size([goal IN coalesce(asset.investmentGoals, []) WHERE goal IN learnerGoals]) AS goalMatches,
              size([tag IN coalesce(asset.tags, []) WHERE tag IN learnerTags]) AS tagMatches,
              EXISTS((learner)-[:COMPLETED]->(asset)) AS completed
         RETURN asset.id AS assetId,
                asset.kind AS kind,
                asset.title AS title,
                asset.category AS category,
                asset.knowledgeLevel AS knowledgeLevel,
                tutorialAssetIds,
                helpAssetIds,
                prerequisiteAssetIds,
                goalMatches,
                tagMatches,
                relatedMatches,
                progressMatchCount,
                hidden,
                completed,
                (goalMatches * 3 + tagMatches * 2 + relatedMatches * 4 + progressMatchCount) AS relevanceScore
         ORDER BY relevanceScore DESC, asset.title ASC
         LIMIT $limit`,
        {
          learnerId: query.learnerId,
          kinds: query.kinds?.length ? query.kinds : null,
          categories: query.categories?.length ? query.categories : null,
          includeCompleted: query.includeCompleted === true,
          limit: query.limit ?? 10,
        },
      );

      return result.records.map((record) => record.toObject());
    });

    return records.map((record) => ({
      assetId: record.assetId,
      kind: record.kind,
      title: record.title,
      category: record.category,
      knowledgeLevel: record.knowledgeLevel,
      relevanceScore: Number(record.relevanceScore ?? 0),
      reasons: buildRecommendationReasons(record),
      tutorialAssetIds: record.tutorialAssetIds ?? [],
      helpAssetIds: record.helpAssetIds ?? [],
      prerequisiteAssetIds: record.prerequisiteAssetIds ?? [],
      completed: Boolean(record.completed),
    }));
  }

  async function getLearnerSnapshot(learnerId) {
    const learnerProfile = await withSession('READ', async (session) => {
      const result = await session.run(
        `MATCH (learner:LearnerProfile { learnerId: $learnerId })
         OPTIONAL MATCH (learner)-[:PURSUES_GOAL]->(goal:InvestmentGoal)
         WITH learner, collect(DISTINCT goal.value) AS investmentGoals
         OPTIONAL MATCH (learner)-[:INTERESTED_IN_TAG]->(tag:InterestTag)
         WITH learner, investmentGoals, collect(DISTINCT tag.value) AS interestedTags
         OPTIONAL MATCH (learner)-[:COMPLETED]->(completed:AdaptiveAsset)
         WITH learner, investmentGoals, interestedTags, collect(DISTINCT completed.id) AS completedAssetIds
         OPTIONAL MATCH (learner)-[:UNLOCKED_ASSET]->(unlocked:AdaptiveAsset)
         WITH learner, investmentGoals, interestedTags, completedAssetIds, collect(DISTINCT unlocked.id) AS unlockedAssetIds
         OPTIONAL MATCH (learner)-[:HIDDEN_ASSET]->(hidden:AdaptiveAsset)
         WITH learner, investmentGoals, interestedTags, completedAssetIds, unlockedAssetIds, collect(DISTINCT hidden.id) AS hiddenAssetIds
         OPTIONAL MATCH (learner)-[progress:HAS_PROGRESS]->(marker:ProgressMarker)
         RETURN learner.learnerId AS learnerId,
                learner.knowledgeLevel AS knowledgeLevel,
                investmentGoals,
                learner.riskPreference AS riskPreference,
                learner.confidenceScore AS confidenceScore,
                interestedTags,
                learner.experienceMarkers AS experienceMarkers,
                completedAssetIds,
                collect(DISTINCT { key: marker.key, value: progress.value, updatedAt: progress.updatedAt }) AS progressMarkers,
                unlockedAssetIds,
                hiddenAssetIds,
                learner.updatedAt AS updatedAt`,
        { learnerId },
      );

      return result.records[0]?.toObject() ?? null;
    });

    if (!learnerProfile) {
      return null;
    }

    return {
      learnerProfile: {
        learnerId: learnerProfile.learnerId,
        knowledgeLevel: learnerProfile.knowledgeLevel,
        investmentGoals: learnerProfile.investmentGoals ?? [],
        riskPreference: learnerProfile.riskPreference,
        confidenceScore: learnerProfile.confidenceScore ?? null,
        interestedTags: learnerProfile.interestedTags ?? [],
        experienceMarkers: learnerProfile.experienceMarkers ?? [],
        completedAssetIds: learnerProfile.completedAssetIds ?? [],
        progressMarkers: (learnerProfile.progressMarkers ?? []).filter((marker) => marker && marker.key),
        unlockedAssetIds: learnerProfile.unlockedAssetIds ?? [],
        hiddenAssetIds: learnerProfile.hiddenAssetIds ?? [],
        updatedAt: learnerProfile.updatedAt,
      },
      recommendations: await findRelevantAssets({ learnerId, limit: 10 }),
    };
  }

  async function close() {
    if (!driverPromise) {
      return;
    }

    const driver = await driverPromise;
    await driver.close?.();
  }

  return {
    syncAdaptiveGraphCatalog,
    syncAdaptiveLearningGraph,
    getLearnerSnapshot,
    findRelevantAssets,
    close,
  };
}

module.exports = {
  countCatalogRelationships,
  createNeo4jAdaptiveGraphRuntime,
};
