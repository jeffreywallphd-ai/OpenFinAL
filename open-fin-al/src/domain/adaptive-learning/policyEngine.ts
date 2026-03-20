import {
  AdaptiveAssetMetadata,
  AdaptiveAssetSelector,
  AdaptivePolicy,
  AdaptivePolicyCondition,
  FeatureAvailabilityState,
  KNOWLEDGE_LEVELS,
  KnowledgeLevel,
  LearnerProfile,
  Prerequisite,
  VisibilityDecision,
} from './contracts';

const knowledgeLevelOrder = KNOWLEDGE_LEVELS.reduce<Record<KnowledgeLevel, number>>((accumulator, level, index) => {
  accumulator[level] = index;
  return accumulator;
}, {} as Record<KnowledgeLevel, number>);

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

function createDecision(asset: AdaptiveAssetMetadata): VisibilityDecision {
  return {
    assetId: asset.id,
    availabilityState: asset.governance.defaultAvailabilityState,
    recommended: false,
    highlighted: false,
    highlightForLearningLater: false,
    reasons: [],
    unmetPrerequisites: [],
    applicablePolicyIds: [],
  };
}

function applyAvailabilityState(currentState: FeatureAvailabilityState, nextState?: FeatureAvailabilityState): FeatureAvailabilityState {
  if (!nextState) {
    return currentState;
  }

  const statePriority: Record<FeatureAvailabilityState, number> = {
    hidden: 4,
    locked: 3,
    deemphasized: 2,
    visible: 1,
  };

  return statePriority[nextState] >= statePriority[currentState] ? nextState : currentState;
}

export function evaluateVisibilityDecision(
  asset: AdaptiveAssetMetadata,
  profile: LearnerProfile,
  policies: AdaptivePolicy[],
): VisibilityDecision {
  const decision = createDecision(asset);
  const unmetPrerequisites = asset.prerequisites.filter((prerequisite) => {
    if (prerequisite.optional) {
      return false;
    }

    return !evaluatePrerequisite(profile, prerequisite);
  });

  decision.unmetPrerequisites = unmetPrerequisites;

  if (profile.hiddenAssetIds.includes(asset.id) && asset.governance.hideWhenLearnerDismisses) {
    decision.availabilityState = 'hidden';
    decision.reasons.push('The learner dismissed this asset previously.');
  } else if (
    unmetPrerequisites.length > 0 &&
    asset.governance.lockWhenPrerequisitesUnmet !== false &&
    decision.availabilityState !== 'hidden'
  ) {
    decision.availabilityState = 'locked';
    decision.highlightForLearningLater = true;
    decision.reasons.push('The learner has not satisfied all prerequisites yet.');
  }

  if (profile.unlockedAssetIds.includes(asset.id) && decision.availabilityState === 'locked') {
    decision.availabilityState = asset.governance.defaultAvailabilityState;
    decision.reasons.push('The asset has been explicitly unlocked for this learner.');
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

    if (policy.action.rationale) {
      decision.reasons.push(policy.action.rationale);
    }
  }

  if (decision.recommended && !asset.governance.eligibleForRecommendation) {
    decision.recommended = false;
    decision.reasons.push('Recommendation was suppressed by governance metadata.');
  }

  if (decision.highlighted && !asset.governance.eligibleForHighlighting) {
    decision.highlighted = false;
    decision.reasons.push('Highlighting was suppressed by governance metadata.');
  }

  return decision;
}
