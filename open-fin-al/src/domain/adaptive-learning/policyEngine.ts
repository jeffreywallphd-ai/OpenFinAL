import {
  AdaptiveAssetMetadata,
  AdaptiveAssetSelector,
  AdaptiveCriticality,
  AdaptiveDecisionReason,
  AdaptivePolicy,
  AdaptivePolicyEvaluationResult,
  AdaptivePolicyCondition,
  FeatureAvailabilityState,
  KNOWLEDGE_LEVELS,
  KnowledgeFit,
  KnowledgeLevel,
  LearnerProfile,
  Prerequisite,
  RiskAlignmentStatus,
  VisibilityDecision,
} from './contracts';

const knowledgeLevelOrder = KNOWLEDGE_LEVELS.reduce<Record<KnowledgeLevel, number>>((accumulator, level, index) => {
  accumulator[level] = index;
  return accumulator;
}, {} as Record<KnowledgeLevel, number>);

const availabilityStatePriority: Record<FeatureAvailabilityState, number> = {
  hidden: 4,
  locked: 3,
  deemphasized: 2,
  visible: 1,
};

export function compareKnowledgeLevels(left: KnowledgeLevel, right: KnowledgeLevel): number {
  return knowledgeLevelOrder[left] - knowledgeLevelOrder[right];
}

export function matchesAdaptiveAssetSelector(
  asset: AdaptiveAssetMetadata,
  selector: AdaptiveAssetSelector,
): boolean {
  const matchesIds = !selector.assetIds || selector.assetIds.includes(asset.id);
  const matchesKinds = !selector.kinds || selector.kinds.includes(asset.kind);
  const matchesCategories = !selector.categories || selector.categories.includes(asset.category);
  const matchesTags = !selector.tags || selector.tags.some((tag) => asset.tags.includes(tag));

  return matchesIds && matchesKinds && matchesCategories && matchesTags;
}

export function evaluatePrerequisite(profile: LearnerProfile, prerequisite: Prerequisite): boolean {
  switch (prerequisite.type) {
    case 'knowledge-level':
      return compareKnowledgeLevels(profile.knowledgeLevel, prerequisite.minimumKnowledgeLevel) >= 0;
    case 'investment-goal':
      return profile.investmentGoals.includes(prerequisite.investmentGoal);
    case 'risk-preference':
      return prerequisite.allowedRiskPreferences.includes(profile.riskPreference);
    case 'asset-completion':
      return profile.completedAssets.some((completion) => completion.assetId === prerequisite.assetId);
    case 'progress-marker': {
      const marker = profile.progressMarkers.find((candidate) => candidate.key === prerequisite.markerKey);
      return (marker?.value ?? 0) >= prerequisite.minimumValue;
    }
    default:
      return false;
  }
}

export function evaluatePolicyCondition(profile: LearnerProfile, condition: AdaptivePolicyCondition): boolean {
  switch (condition.type) {
    case 'knowledge-level-at-least':
      return compareKnowledgeLevels(profile.knowledgeLevel, condition.knowledgeLevel) >= 0;
    case 'knowledge-level-at-most':
      return compareKnowledgeLevels(profile.knowledgeLevel, condition.knowledgeLevel) <= 0;
    case 'investment-goal-includes':
      return profile.investmentGoals.includes(condition.investmentGoal);
    case 'risk-preference-is':
      return profile.riskPreference === condition.riskPreference;
    case 'completed-asset':
      return profile.completedAssets.some((completion) => completion.assetId === condition.assetId);
    case 'progress-marker-at-least': {
      const marker = profile.progressMarkers.find((candidate) => candidate.key === condition.markerKey);
      return (marker?.value ?? 0) >= condition.minimumValue;
    }
    case 'interested-tag-includes':
      return profile.interestedTags.includes(condition.tag);
    default:
      return false;
  }
}

function getCriticality(asset: AdaptiveAssetMetadata): AdaptiveCriticality {
  return asset.governance.criticality ?? 'standard';
}

function determineKnowledgeFit(asset: AdaptiveAssetMetadata, profile: LearnerProfile): KnowledgeFit {
  const delta = compareKnowledgeLevels(profile.knowledgeLevel, asset.knowledgeLevel);

  if (delta < 0) {
    return 'below-target';
  }

  if (delta > 1) {
    return 'above-target';
  }

  return 'aligned';
}

function determineGoalAlignment(asset: AdaptiveAssetMetadata, profile: LearnerProfile): 'none' | 'partial' | 'strong' {
  if (asset.investmentGoals.length === 0) {
    return 'strong';
  }

  const overlapCount = asset.investmentGoals.filter((goal) => profile.investmentGoals.includes(goal)).length;

  if (overlapCount === 0) {
    return 'none';
  }

  return overlapCount >= Math.min(2, asset.investmentGoals.length) ? 'strong' : 'partial';
}

function determineRiskAlignment(asset: AdaptiveAssetMetadata, profile: LearnerProfile): RiskAlignmentStatus {
  if (profile.riskPreference === 'unknown' || asset.riskAlignment.length === 0) {
    return 'unknown';
  }

  return asset.riskAlignment.includes(profile.riskPreference) ? 'aligned' : 'none';
}

function createDecision(asset: AdaptiveAssetMetadata): VisibilityDecision {
  const criticality = getCriticality(asset);

  return {
    assetId: asset.id,
    availabilityState: asset.governance.defaultAvailabilityState,
    recommended: false,
    highlighted: false,
    highlightForLearningLater: false,
    suggestedForLaterUnlocking: false,
    reasons: [],
    unmetPrerequisites: [],
    applicablePolicyIds: [],
    supportingAssetIds: [],
    explanation: {
      summary: `Defaulted to ${asset.governance.defaultAvailabilityState} using ${criticality} governance.`,
      reasons: [
        {
          code: 'default-availability',
          message: `Default availability is ${asset.governance.defaultAvailabilityState}.`,
          source: 'metadata',
          details: {
            criticality,
          },
        },
      ],
      debug: {
        knowledgeFit: 'aligned',
        goalAlignment: 'none',
        riskAlignment: 'unknown',
        criticality,
        prerequisiteStatuses: [],
        matchedPolicyIds: [],
        relatedAssetIdsConsidered: [],
        supportingAssetIds: [],
      },
    },
  };
}

function applyAvailabilityState(currentState: FeatureAvailabilityState, nextState?: FeatureAvailabilityState): FeatureAvailabilityState {
  if (!nextState) {
    return currentState;
  }

  return availabilityStatePriority[nextState] >= availabilityStatePriority[currentState] ? nextState : currentState;
}

function addReason(decision: VisibilityDecision, reason: AdaptiveDecisionReason): void {
  decision.explanation.reasons.push(reason);
  decision.reasons.push(reason.message);
}

function addSupportingAsset(decision: VisibilityDecision, assetId: string | undefined): void {
  if (!assetId || decision.supportingAssetIds.includes(assetId) || assetId === decision.assetId) {
    return;
  }

  decision.supportingAssetIds.push(assetId);
}

function summarizeDecision(decision: VisibilityDecision): string {
  const summaryParts = [`Asset is ${decision.availabilityState}`];

  if (decision.recommended) {
    summaryParts.push('recommended now');
  }

  if (decision.highlighted) {
    summaryParts.push('highlighted for emphasis');
  }

  if (decision.suggestedForLaterUnlocking) {
    summaryParts.push('paired with later-unlock guidance');
  }

  if (decision.supportingAssetIds.length > 0) {
    summaryParts.push(`supported by ${decision.supportingAssetIds.length} related asset(s)`);
  }

  return `${summaryParts.join(', ')}.`;
}

function sortDecisionReasons(reasons: AdaptiveDecisionReason[]): AdaptiveDecisionReason[] {
  return [...reasons].sort((left, right) => left.message.localeCompare(right.message));
}

export function evaluateVisibilityDecision(
  asset: AdaptiveAssetMetadata,
  profile: LearnerProfile,
  policies: AdaptivePolicy[],
  assetLookup: Record<string, AdaptiveAssetMetadata> = {},
): VisibilityDecision {
  const decision = createDecision(asset);
  const prerequisiteStatuses = asset.prerequisites.map((prerequisite) => ({
    prerequisite,
    satisfied: evaluatePrerequisite(profile, prerequisite),
  }));
  const unmetPrerequisites = prerequisiteStatuses
    .filter(({ prerequisite, satisfied }) => !prerequisite.optional && !satisfied)
    .map(({ prerequisite }) => prerequisite);
  const criticality = getCriticality(asset);
  const knowledgeFit = determineKnowledgeFit(asset, profile);
  const goalAlignment = determineGoalAlignment(asset, profile);
  const riskAlignment = determineRiskAlignment(asset, profile);

  decision.unmetPrerequisites = unmetPrerequisites;
  decision.explanation.debug.knowledgeFit = knowledgeFit;
  decision.explanation.debug.goalAlignment = goalAlignment;
  decision.explanation.debug.riskAlignment = riskAlignment;
  decision.explanation.debug.prerequisiteStatuses = prerequisiteStatuses;
  decision.explanation.debug.relatedAssetIdsConsidered = Array.from(
    new Set([
      ...asset.relationships.relatedAssetIds,
      ...asset.relationships.relatedFeatureIds,
      ...asset.relationships.tutorialAssetIds,
      ...asset.relationships.helpAssetIds,
      ...asset.relationships.accessibilityAssetIds,
    ]),
  );

  if (profile.hiddenAssetIds.includes(asset.id) && asset.governance.hideWhenLearnerDismisses) {
    decision.availabilityState = 'hidden';
    addReason(decision, {
      code: 'learner-hidden',
      message: 'The learner dismissed this asset previously, so it remains hidden.',
      source: 'learner-state',
    });
  }

  if (unmetPrerequisites.length > 0 && asset.governance.lockWhenPrerequisitesUnmet !== false && decision.availabilityState !== 'hidden') {
    decision.availabilityState = 'locked';
    decision.highlightForLearningLater = true;
    decision.suggestedForLaterUnlocking = true;
    addReason(decision, {
      code: 'prerequisite-unmet',
      message: 'The learner has not satisfied all required prerequisites yet.',
      source: 'metadata',
      details: {
        unmetPrerequisiteCount: unmetPrerequisites.length,
      },
    });

    for (const prerequisite of unmetPrerequisites) {
      if (prerequisite.type === 'asset-completion') {
        addSupportingAsset(decision, prerequisite.assetId);
      }
    }
  }

  if (profile.unlockedAssetIds.includes(asset.id) && decision.availabilityState === 'locked') {
    decision.availabilityState = asset.governance.defaultAvailabilityState;
    decision.highlightForLearningLater = false;
    decision.suggestedForLaterUnlocking = false;
    addReason(decision, {
      code: 'learner-unlocked',
      message: 'The asset has been explicitly unlocked for this learner.',
      source: 'learner-state',
    });
  }

  if (knowledgeFit === 'below-target' && decision.availabilityState === 'visible') {
    const downgradedState = criticality === 'optional' ? 'hidden' : 'deemphasized';
    decision.availabilityState = applyAvailabilityState(decision.availabilityState, downgradedState);
    addReason(decision, {
      code: 'knowledge-gap',
      message:
        criticality === 'optional'
          ? 'This optional asset is hidden because it exceeds the learner’s current knowledge level.'
          : 'This asset is deemphasized because it exceeds the learner’s current knowledge level.',
      source: 'metadata',
      details: {
        assetKnowledgeLevel: asset.knowledgeLevel,
        learnerKnowledgeLevel: profile.knowledgeLevel,
      },
    });

    if (asset.kind === 'feature') {
      for (const relatedAssetId of asset.relationships.tutorialAssetIds) {
        addSupportingAsset(decision, relatedAssetId);
      }
      for (const relatedAssetId of asset.relationships.helpAssetIds) {
        addSupportingAsset(decision, relatedAssetId);
      }
    }
  } else {
    addReason(decision, {
      code: 'knowledge-fit',
      message: 'The asset knowledge level fits the learner closely enough to stay in scope.',
      source: 'metadata',
      details: {
        assetKnowledgeLevel: asset.knowledgeLevel,
        learnerKnowledgeLevel: profile.knowledgeLevel,
        knowledgeFit,
      },
    });
  }

  if (goalAlignment === 'none') {
    const downgradedState = criticality === 'optional' ? 'deemphasized' : decision.availabilityState;
    decision.availabilityState = applyAvailabilityState(decision.availabilityState, downgradedState);
    addReason(decision, {
      code: 'goal-alignment',
      message:
        criticality === 'optional'
          ? 'This optional asset is deemphasized because it does not align with the learner’s stated investment goals.'
          : 'This asset is not aligned to the learner’s stated investment goals, so it is not promoted.',
      source: 'metadata',
      details: {
        assetInvestmentGoals: asset.investmentGoals,
        learnerInvestmentGoals: profile.investmentGoals,
      },
    });
  } else {
    addReason(decision, {
      code: 'goal-alignment',
      message: 'The asset aligns with at least one of the learner’s stated investment goals.',
      source: 'metadata',
      details: {
        goalAlignment,
      },
    });
  }

  if (riskAlignment === 'none') {
    const downgradedState = criticality === 'optional' ? 'hidden' : 'deemphasized';
    decision.availabilityState = applyAvailabilityState(decision.availabilityState, downgradedState);
    addReason(decision, {
      code: 'risk-alignment',
      message:
        criticality === 'optional'
          ? 'This optional asset is hidden because its risk profile conflicts with the learner’s preference.'
          : 'This asset is deemphasized because its risk profile conflicts with the learner’s preference.',
      source: 'metadata',
      details: {
        assetRiskAlignment: asset.riskAlignment,
        learnerRiskPreference: profile.riskPreference,
      },
    });
  } else {
    addReason(decision, {
      code: 'risk-alignment',
      message:
        riskAlignment === 'aligned'
          ? 'The asset’s risk profile aligns with the learner’s stated preference.'
          : 'Risk alignment is neutral because the learner has not specified a usable risk preference yet.',
      source: 'metadata',
      details: {
        riskAlignment,
      },
    });
  }

  if (
    decision.availabilityState !== 'hidden' &&
    decision.unmetPrerequisites.length === 0 &&
    knowledgeFit !== 'below-target' &&
    goalAlignment !== 'none' &&
    riskAlignment !== 'none'
  ) {
    decision.recommended = asset.governance.eligibleForRecommendation;
    decision.highlighted = asset.governance.eligibleForHighlighting && (criticality === 'core' || asset.kind !== 'help-hint');

    addReason(decision, {
      code: 'criticality-governance',
      message:
        criticality === 'core'
          ? 'Core governance keeps this asset visible and emphasized when the learner is a good fit.'
          : 'Governance allows this asset to be promoted when the learner is a good fit.',
      source: 'metadata',
      details: {
        criticality,
      },
    });
  }

  const relationshipSupportIds = new Set<string>();

  if (decision.suggestedForLaterUnlocking) {
    for (const relationshipAssetId of asset.relationships.relatedAssetIds) {
      const relatedAsset = assetLookup[relationshipAssetId];

      if (relatedAsset?.kind === 'learning-module' || relatedAsset?.kind === 'tutorial' || relatedAsset?.kind === 'help-hint') {
        relationshipSupportIds.add(relationshipAssetId);
      }
    }
  }

  for (const supportId of relationshipSupportIds) {
    addSupportingAsset(decision, supportId);
  }

  if (relationshipSupportIds.size > 0) {
    addReason(decision, {
      code: 'relationship-support',
      message: 'Related learning assets were attached to reduce overload and explain the next unlock path.',
      source: 'relationship',
      details: {
        supportingAssetIds: [...relationshipSupportIds],
      },
    });
  }

  const matchingPolicies = [...policies]
    .filter((policy) => matchesAdaptiveAssetSelector(asset, policy.selector))
    .sort((left, right) => left.priority - right.priority);

  for (const policy of matchingPolicies) {
    const matchesConditions = policy.conditions.every((condition) => evaluatePolicyCondition(profile, condition));

    if (!matchesConditions) {
      continue;
    }

    decision.applicablePolicyIds.push(policy.id);
    decision.availabilityState = applyAvailabilityState(decision.availabilityState, policy.action.availabilityState);
    decision.recommended = decision.recommended || Boolean(policy.action.recommended);
    decision.highlighted = decision.highlighted || Boolean(policy.action.highlighted);
    decision.highlightForLearningLater =
      decision.highlightForLearningLater || Boolean(policy.action.highlightForLearningLater);
    decision.suggestedForLaterUnlocking =
      decision.suggestedForLaterUnlocking || Boolean(policy.action.highlightForLearningLater);

    addReason(decision, {
      code: 'policy-match',
      message: policy.action.rationale ?? `Policy ${policy.key} matched this learner and asset.`,
      source: 'policy',
      details: {
        policyId: policy.id,
        priority: policy.priority,
      },
    });
  }

  if (decision.recommended && !asset.governance.eligibleForRecommendation) {
    decision.recommended = false;
    addReason(decision, {
      code: 'policy-suppressed',
      message: 'Recommendation was suppressed by governance metadata.',
      source: 'policy',
    });
  }

  if (decision.highlighted && !asset.governance.eligibleForHighlighting) {
    decision.highlighted = false;
    addReason(decision, {
      code: 'policy-suppressed',
      message: 'Highlighting was suppressed by governance metadata.',
      source: 'policy',
    });
  }

  decision.explanation.debug.matchedPolicyIds = [...decision.applicablePolicyIds];
  decision.explanation.debug.supportingAssetIds = [...decision.supportingAssetIds];
  decision.explanation.reasons = sortDecisionReasons(decision.explanation.reasons);
  decision.reasons = decision.explanation.reasons.map((reason) => reason.message);
  decision.explanation.summary = summarizeDecision(decision);

  return decision;
}

export function evaluateAdaptivePolicyEngine(
  assets: AdaptiveAssetMetadata[],
  profile: LearnerProfile,
  policies: AdaptivePolicy[] = [],
): AdaptivePolicyEvaluationResult {
  const assetLookup = assets.reduce<Record<string, AdaptiveAssetMetadata>>((accumulator, asset) => {
    accumulator[asset.id] = asset;
    return accumulator;
  }, {});

  const decisions = [...assets]
    .sort((left, right) => left.title.localeCompare(right.title))
    .map((asset) => evaluateVisibilityDecision(asset, profile, policies, assetLookup));

  const decisionsByAssetId = decisions.reduce<Record<string, VisibilityDecision>>((accumulator, decision) => {
    accumulator[decision.assetId] = decision;
    return accumulator;
  }, {});

  return {
    decisions,
    decisionsByAssetId,
    summary: {
      visibleAssetIds: decisions.filter((decision) => decision.availabilityState === 'visible').map((decision) => decision.assetId),
      hiddenAssetIds: decisions.filter((decision) => decision.availabilityState === 'hidden').map((decision) => decision.assetId),
      lockedAssetIds: decisions.filter((decision) => decision.availabilityState === 'locked').map((decision) => decision.assetId),
      deemphasizedAssetIds: decisions
        .filter((decision) => decision.availabilityState === 'deemphasized')
        .map((decision) => decision.assetId),
      recommendedAssetIds: decisions.filter((decision) => decision.recommended).map((decision) => decision.assetId),
      highlightedAssetIds: decisions.filter((decision) => decision.highlighted).map((decision) => decision.assetId),
      suggestedForLaterUnlockingAssetIds: decisions
        .filter((decision) => decision.suggestedForLaterUnlocking)
        .map((decision) => decision.assetId),
    },
  };
}
