import React from 'react';

function getStatusLabel(toolState) {
  if (toolState.locked) {
    return 'Locked';
  }

  if (toolState.recommended || toolState.highlighted) {
    return 'Recommended';
  }

  if (toolState.deemphasized) {
    return 'Deemphasized';
  }

  return 'Available';
}

export function AdaptiveFeatureSection({ toolState, eyebrow, children, compact = false }) {
  if (!toolState?.visible) {
    return null;
  }

  const classNames = [
    'adaptive-feature-section',
    toolState.locked ? 'is-locked' : '',
    toolState.deemphasized ? 'is-deemphasized' : '',
    toolState.recommended || toolState.highlighted ? 'is-recommended' : '',
    compact ? 'is-compact' : '',
  ].filter(Boolean).join(' ');

  return (
    <section className={classNames}>
      <div className="adaptive-feature-section__header">
        <div>
          {eyebrow ? <p className="adaptive-feature-section__eyebrow">{eyebrow}</p> : null}
          <h3>{toolState.title}</h3>
        </div>
        <span className="adaptive-feature-section__pill">{getStatusLabel(toolState)}</span>
      </div>
      <p className="adaptive-feature-section__message">{toolState.message}</p>
      {toolState.supportingAssetTitles?.length ? (
        <p className="adaptive-feature-section__supporting">
          Learn first: {toolState.supportingAssetTitles.join(' • ')}
        </p>
      ) : null}
      <div>{children}</div>
    </section>
  );
}
