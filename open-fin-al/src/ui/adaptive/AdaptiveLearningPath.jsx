import React from 'react';

function getAvailabilityLabel(asset) {
  if (asset.locked) {
    return 'Unlock later';
  }

  if (asset.recommended || asset.highlighted) {
    return 'Next recommended';
  }

  if (asset.deemphasized) {
    return 'Available later';
  }

  return 'Available now';
}

export function AdaptiveLearningPath({ title = 'Recommended learning path', assets = [] }) {
  if (!assets.length) {
    return null;
  }

  return (
    <section className="adaptive-learning-path">
      <div className="adaptive-learning-path__header">
        <h3>{title}</h3>
        <p>Adaptive governance is using learner state plus graph recommendations to sequence what should come next.</p>
      </div>
      <div className="adaptive-learning-path__grid">
        {assets.map((asset) => (
          <article
            key={asset.assetId}
            className={[
              'adaptive-learning-card',
              asset.locked ? 'is-locked' : '',
              asset.deemphasized ? 'is-deemphasized' : '',
              asset.recommended || asset.highlighted ? 'is-recommended' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="adaptive-learning-card__header">
              <h4>{asset.title}</h4>
              <span>{getAvailabilityLabel(asset)}</span>
            </div>
            <p>{asset.message}</p>
            {asset.recommendationReasons?.length ? (
              <ul>
                {asset.recommendationReasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
