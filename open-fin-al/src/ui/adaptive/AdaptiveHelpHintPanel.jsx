import React from 'react';

export function AdaptiveHelpHintPanel({ hint, loading = false }) {
  if (!hint) {
    return null;
  }

  return (
    <section className={['adaptive-help-hint-panel', `state-${hint.availabilityState}`].join(' ')} aria-label="Contextual help hint">
      <div className="adaptive-help-hint-panel__header">
        <div>
          <p className="adaptive-feature-section__eyebrow">Contextual help</p>
          <h3>{hint.title}</h3>
        </div>
        <span className="adaptive-feature-section__pill">Inline guidance</span>
      </div>

      <p className="adaptive-help-hint-panel__body">{hint.description}</p>
      <p>{hint.body}</p>

      {hint.reasons?.length ? (
        <ul className="adaptive-help-hint-panel__reasons">
          {hint.reasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      ) : null}

      {hint.graphReasons?.length ? (
        <p className="adaptive-help-hint-panel__graph">
          Graph support: {hint.graphReasons[0]}
        </p>
      ) : null}

      {loading ? <p className="adaptive-workbench-status">Refreshing contextual hint…</p> : null}
    </section>
  );
}
