import React from 'react';

export function AdaptiveTradeWorkbenchBanner({ banner, graphSynced }) {
  if (!banner) {
    return null;
  }

  return (
    <section className={['adaptive-workbench-banner', `tone-${banner.tone}`].join(' ')}>
      <div>
        <h3>{banner.title}</h3>
        <p>{banner.message}</p>
      </div>
      <p className="adaptive-workbench-banner__meta">
        {graphSynced ? 'Graph-backed recommendations are active.' : 'Using local adaptive defaults until graph recommendations are available.'}
      </p>
    </section>
  );
}
