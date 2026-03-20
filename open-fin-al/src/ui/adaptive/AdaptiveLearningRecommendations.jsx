import React from 'react';

function formatKind(kind) {
  switch (kind) {
    case 'learning-module':
      return 'Learning module';
    case 'tutorial':
      return 'Tutorial';
    case 'help-hint':
      return 'Help hint';
    default:
      return kind;
  }
}

export function AdaptiveLearningRecommendations({ viewModel, loading = false }) {
  if (!viewModel) {
    return null;
  }

  const { banner, cards, recommendationResult, graphSynced } = viewModel;

  return (
    <section className="adaptive-learning-recommendations" aria-label="Adaptive learning recommendations">
      <div className={['adaptive-workbench-banner', `tone-${banner.tone}`].join(' ')}>
        <div>
          <h3>{banner.title}</h3>
          <p>{banner.message}</p>
        </div>
        <p className="adaptive-workbench-banner__meta">
          {graphSynced ? 'Graph-backed ranking is active.' : 'Using learner-profile defaults until graph signals are available.'}
        </p>
      </div>

      {loading ? <p className="adaptive-workbench-status">Refreshing adaptive learning recommendations…</p> : null}

      <div className="adaptive-learning-recommendations__meta">
        <p>
          Feature governance snapshot: {recommendationResult.featureGovernance.visibleFeatureIds.length} visible ·{' '}
          {recommendationResult.featureGovernance.lockedFeatureIds.length} locked ·{' '}
          {recommendationResult.featureGovernance.deemphasizedFeatureIds.length} deemphasized ·{' '}
          {recommendationResult.featureGovernance.hiddenFeatureIds.length} hidden.
        </p>
      </div>

      <div className="adaptive-learning-recommendations__grid">
        {cards.map((card) => (
          <article key={card.assetId} className="adaptive-learning-recommendation-card">
            <div className="adaptive-learning-recommendation-card__header">
              <div>
                <p className="adaptive-feature-section__eyebrow">{formatKind(card.kind)}</p>
                <h3>{card.title}</h3>
              </div>
              <span className="adaptive-feature-section__pill">Score {card.score}</span>
            </div>
            <p>{card.summary}</p>

            <div className="adaptive-learning-recommendation-card__section">
              <h4>Why this was chosen</h4>
              <ul>
                {card.rationale.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>

            {card.featureUnlocks.length ? (
              <div className="adaptive-learning-recommendation-card__section">
                <h4>Related feature unlocks</h4>
                <ul>
                  {card.featureUnlocks.map((unlock) => (
                    <li key={unlock.assetId}>
                      <strong>{unlock.title}</strong> ({unlock.availabilityState}): {unlock.whyItMatters}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {card.graphReasons.length ? (
              <div className="adaptive-learning-recommendation-card__section">
                <h4>Graph signal</h4>
                <ul>
                  {card.graphReasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
