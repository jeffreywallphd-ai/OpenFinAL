import {
  AdaptiveFeatureMetadata,
  AdaptivePolicy,
  LearnerProfile,
  LearningModuleMetadata,
  compareKnowledgeLevels,
  evaluateAdaptivePolicyEngine,
  evaluatePrerequisite,
  evaluateVisibilityDecision,
  matchesAdaptiveAssetSelector,
} from '../../../domain/adaptive-learning';

describe('adaptive learning domain contracts', () => {
  const feature: AdaptiveFeatureMetadata = {
    id: 'feature-advanced-screening',
    key: 'advanced-screening',
    kind: 'feature',
    title: 'Advanced stock screener',
    description: 'Lets learners compose multi-factor investment screens.',
    category: 'analysis',
    tags: ['stocks', 'screening', 'analytics'],
    knowledgeLevel: 'advanced',
    investmentGoals: ['growth', 'diversification'],
    riskAlignment: ['moderate', 'aggressive'],
    governance: {
      defaultAvailabilityState: 'visible',
      eligibleForRecommendation: true,
      eligibleForHighlighting: true,
      lockWhenPrerequisitesUnmet: true,
      hideWhenLearnerDismisses: true,
      criticality: 'optional',
    },
    defaultAvailability: 'enabled',
    isUserFacing: true,
    relationships: {
      relatedAssetIds: ['module-screening-basics'],
      relatedFeatureIds: [],
      tutorialAssetIds: ['tutorial-screening-walkthrough'],
      helpAssetIds: ['help-screening-filter-builder'],
      accessibilityAssetIds: ['help-keyboard-navigation-global'],
    },
    prerequisites: [
      {
        type: 'knowledge-level',
        minimumKnowledgeLevel: 'intermediate',
        description: 'Requires intermediate investing knowledge.',
      },
      {
        type: 'asset-completion',
        assetId: 'module-screening-basics',
        description: 'Complete the stock screening module first.',
      },
    ],
  };

  const beginnerProfile: LearnerProfile = {
    learnerId: 'learner-1',
    knowledgeLevel: 'beginner',
    investmentGoals: ['growth'],
    riskPreference: 'moderate',
    interestedTags: ['stocks'],
    completedAssets: [],
    progressMarkers: [],
    unlockedAssetIds: [],
    hiddenAssetIds: [],
  };

  test('compares knowledge levels in an ordered way', () => {
    expect(compareKnowledgeLevels('beginner', 'advanced')).toBeLessThan(0);
    expect(compareKnowledgeLevels('expert', 'advanced')).toBeGreaterThan(0);
    expect(compareKnowledgeLevels('intermediate', 'intermediate')).toBe(0);
  });

  test('evaluates prerequisites against the learner profile', () => {
    expect(evaluatePrerequisite(beginnerProfile, feature.prerequisites[0])).toBe(false);
    expect(evaluatePrerequisite(beginnerProfile, feature.prerequisites[1])).toBe(false);
  });

  test('matches asset selectors without requiring graph-specific APIs', () => {
    expect(
      matchesAdaptiveAssetSelector(feature, {
        kinds: ['feature'],
        categories: ['analysis'],
        tags: ['stocks'],
      }),
    ).toBe(true);

    expect(
      matchesAdaptiveAssetSelector(feature, {
        assetIds: ['different-id'],
      }),
    ).toBe(false);
  });

  test('locks assets and suggests a later unlock path when prerequisites are unmet', () => {
    const supportingModule: LearningModuleMetadata = {
      ...feature,
      id: 'module-screening-basics',
      key: 'screening-basics',
      kind: 'learning-module' as const,
      category: 'security-analysis' as const,
      title: 'Screening basics',
      supportedModalities: ['reading'],
    };

    const decision = evaluateVisibilityDecision(feature, beginnerProfile, [], {
      [feature.id]: feature,
      [supportingModule.id]: supportingModule,
    });

    expect(decision.availabilityState).toBe('locked');
    expect(decision.highlightForLearningLater).toBe(true);
    expect(decision.suggestedForLaterUnlocking).toBe(true);
    expect(decision.unmetPrerequisites).toHaveLength(2);
    expect(decision.supportingAssetIds).toContain('module-screening-basics');
    expect(decision.recommended).toBe(false);
    expect(decision.explanation.debug.knowledgeFit).toBe('below-target');
  });

  test('applies serializable adaptive policies to recommendation and emphasis decisions', () => {
    const experiencedProfile: LearnerProfile = {
      ...beginnerProfile,
      knowledgeLevel: 'advanced',
      completedAssets: [
        {
          assetId: 'module-screening-basics',
          completedAt: '2026-03-20T00:00:00.000Z',
          completionType: 'completed',
        },
      ],
      progressMarkers: [
        {
          key: 'screening-confidence',
          value: 0.9,
          updatedAt: '2026-03-20T00:00:00.000Z',
        },
      ],
      interestedTags: ['stocks', 'analytics'],
    };

    const policies: AdaptivePolicy[] = [
      {
        id: 'policy-recommend-screening',
        key: 'recommend-screening',
        description: 'Recommend advanced screening to growth-oriented learners who completed the basics.',
        priority: 10,
        selector: {
          assetIds: [feature.id],
        },
        conditions: [
          {
            type: 'investment-goal-includes',
            investmentGoal: 'growth',
          },
          {
            type: 'completed-asset',
            assetId: 'module-screening-basics',
          },
          {
            type: 'interested-tag-includes',
            tag: 'analytics',
          },
        ],
        action: {
          availabilityState: 'visible',
          recommended: true,
          highlighted: true,
          rationale: 'The learner is ready for a more advanced screening tool.',
        },
      },
      {
        id: 'policy-deemphasize-for-beginners',
        key: 'deemphasize-for-beginners',
        description: 'Deemphasize advanced analytics for beginning learners.',
        priority: 5,
        selector: {
          categories: ['analysis'],
        },
        conditions: [
          {
            type: 'knowledge-level-at-most',
            knowledgeLevel: 'beginner',
          },
        ],
        action: {
          availabilityState: 'deemphasized',
          rationale: 'This feature should stay in the background until the learner progresses.',
        },
      },
    ];

    const decision = evaluateVisibilityDecision(feature, experiencedProfile, policies);

    expect(decision.availabilityState).toBe('visible');
    expect(decision.recommended).toBe(true);
    expect(decision.highlighted).toBe(true);
    expect(decision.highlightForLearningLater).toBe(false);
    expect(decision.applicablePolicyIds).toEqual(['policy-recommend-screening']);
    expect(decision.reasons).toContain('The learner is ready for a more advanced screening tool.');
    expect(decision.explanation.debug.goalAlignment).toBe('partial');
  });

  test('evaluates a mixed catalog and summarizes overload-reduction outcomes', () => {
    const module: LearningModuleMetadata = {
      id: 'module-screening-basics',
      key: 'screening-basics',
      kind: 'learning-module' as const,
      title: 'Screening basics module',
      description: 'Introduces the screening workflow.',
      category: 'security-analysis' as const,
      tags: ['stocks', 'screening'],
      knowledgeLevel: 'beginner' as const,
      investmentGoals: ['growth'],
      riskAlignment: ['moderate'],
      prerequisites: [],
      governance: {
        defaultAvailabilityState: 'visible',
        eligibleForRecommendation: true,
        eligibleForHighlighting: true,
        criticality: 'core',
      },
      defaultAvailability: 'enabled',
      isUserFacing: true,
      relationships: {
        relatedAssetIds: [feature.id],
        relatedFeatureIds: [feature.id],
        tutorialAssetIds: [],
        helpAssetIds: [],
        accessibilityAssetIds: [],
      },
      supportedModalities: ['reading'],
    };

    const result = evaluateAdaptivePolicyEngine([feature, module], beginnerProfile, []);

    expect(result.decisionsByAssetId['module-screening-basics'].availabilityState).toBe('visible');
    expect(result.decisionsByAssetId['module-screening-basics'].recommended).toBe(true);
    expect(result.decisionsByAssetId[feature.id].availabilityState).toBe('locked');
    expect(result.summary.visibleAssetIds).toEqual(['module-screening-basics']);
    expect(result.summary.lockedAssetIds).toEqual([feature.id]);
    expect(result.summary.suggestedForLaterUnlockingAssetIds).toEqual([feature.id]);
  });
});
