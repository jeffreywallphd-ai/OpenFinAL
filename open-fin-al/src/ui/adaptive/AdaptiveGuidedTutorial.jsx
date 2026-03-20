import React, { useEffect, useMemo, useState } from 'react';
import {
  completeGuidedTutorialSession,
  createGuidedTutorialSession,
  dismissGuidedTutorialSession,
  goToNextGuidedTutorialStep,
  goToPreviousGuidedTutorialStep,
  startGuidedTutorialSession,
} from '@application/adaptive-learning/guidedTutorials';

function getStatusLabel(runtime) {
  switch (runtime?.status) {
    case 'completed':
      return 'Completed';
    case 'locked':
      return 'Locked';
    case 'recommended':
      return 'Recommended';
    case 'available':
      return 'Available';
    default:
      return 'Hidden';
  }
}

function getActionLabel(session) {
  if (session.status === 'active') {
    return 'Resume tutorial';
  }

  if (session.status === 'completed') {
    return 'Review tutorial';
  }

  return 'Start tutorial';
}

export function AdaptiveGuidedTutorial({ runtime, onComplete, onDismiss, loading = false }) {
  const initialSession = useMemo(() => (runtime ? createGuidedTutorialSession(runtime) : null), [runtime]);
  const [session, setSession] = useState(initialSession);
  const activeStep = runtime && session ? runtime.steps[session.currentStepIndex] : null;

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (!runtime || !session || session.status !== 'idle' || !runtime.autoStart) {
      return;
    }

    setSession((current) => (current ? startGuidedTutorialSession(current) : current));
  }, [runtime, session]);

  useEffect(() => {
    if (!activeStep?.anchor?.anchorId) {
      return undefined;
    }

    const anchor = document.querySelector(`[data-guided-tutorial-anchor="${activeStep.anchor.anchorId}"]`);
    if (!anchor) {
      return undefined;
    }

    anchor.classList.add('guided-tutorial-anchor', 'guided-tutorial-anchor-active');
    anchor.setAttribute('data-guided-tutorial-highlighted', 'true');

    return () => {
      anchor.classList.remove('guided-tutorial-anchor-active');
      anchor.removeAttribute('data-guided-tutorial-highlighted');
    };
  }, [activeStep]);

  if (!runtime || !session) {
    return null;
  }

  const effectiveStatus = session.status === 'completed' ? 'completed' : runtime.status;
  const effectiveCompleted = runtime.completed || session.status === 'completed';

  const handleStart = () => {
    if (session.status === 'completed') {
      setSession({ ...session, status: 'active', currentStepIndex: 0 });
      return;
    }

    setSession(startGuidedTutorialSession(session));
  };

  const handleNext = () => {
    if (!activeStep) {
      return;
    }

    if (session.currentStepIndex >= runtime.steps.length - 1) {
      const completedSession = completeGuidedTutorialSession(session);
      setSession(completedSession);
      onComplete?.(runtime, completedSession);
      return;
    }

    setSession(goToNextGuidedTutorialStep(session, runtime));
  };

  const handlePrevious = () => {
    setSession(goToPreviousGuidedTutorialStep(session));
  };

  const handleDismiss = () => {
    const dismissed = dismissGuidedTutorialSession(session);
    setSession(dismissed);
    onDismiss?.(runtime, dismissed);
  };

  return (
    <section className={['adaptive-guided-tutorial', `state-${effectiveStatus}`].join(' ')} aria-label="Guided tutorial">
      <div className="adaptive-guided-tutorial__summary">
        <div>
          <p className="adaptive-feature-section__eyebrow">Guided tutorial</p>
          <div className="adaptive-guided-tutorial__header-row">
            <h3>{runtime.definition.title}</h3>
            <span className="adaptive-feature-section__pill">{getStatusLabel({ status: effectiveStatus })}</span>
          </div>
          <p>{runtime.definition.description}</p>
          <p className="adaptive-guided-tutorial__meta">
            {runtime.steps.length} steps · Triggered {runtime.trigger} · {effectiveCompleted ? 'Completion saved to learner state.' : 'Completion will update learner progress.'}
          </p>
        </div>
        <div className="adaptive-guided-tutorial__actions">
          {runtime.available ? (
            <button type="button" className="save-button" onClick={handleStart} disabled={loading}>
              {loading ? 'Saving…' : getActionLabel(session)}
            </button>
          ) : null}
        </div>
      </div>

      {runtime.recommendationReasons.length > 0 ? (
        <ul className="adaptive-guided-tutorial__reason-list">
          {runtime.recommendationReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      ) : null}

      {runtime.graphReasons.length > 0 ? (
        <p className="adaptive-guided-tutorial__graph-reason">Graph signal: {runtime.graphReasons[0]}</p>
      ) : null}

      {session.status === 'active' && activeStep ? (
        <div className="adaptive-guided-tutorial__panel" role="dialog" aria-modal="false" aria-label={activeStep.title}>
          <p className="adaptive-guided-tutorial__step-counter">
            Step {session.currentStepIndex + 1} of {runtime.steps.length}
          </p>
          <h4>{activeStep.title}</h4>
          <p>{activeStep.guidance}</p>
          <div className="adaptive-guided-tutorial__anchor-card">
            <strong>{activeStep.anchor.title}</strong>
            <span>{activeStep.anchor.description}</span>
          </div>
          {activeStep.scriptHook ? (
            <p className="adaptive-guided-tutorial__script-hook">
              {activeStep.scriptHook.kind === 'audio' ? 'Audio cue' : 'Script cue'}: {activeStep.scriptHook.cue}
            </p>
          ) : null}
          <div className="adaptive-guided-tutorial__panel-actions">
            <button type="button" onClick={handlePrevious} disabled={session.currentStepIndex === 0}>Back</button>
            <button type="button" onClick={handleDismiss}>Dismiss</button>
            <button type="button" className="save-button" onClick={handleNext}>
              {session.currentStepIndex >= runtime.steps.length - 1 ? 'Complete tutorial' : 'Next step'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
