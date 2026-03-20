import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdaptiveGuidedTutorial } from '@ui/adaptive/AdaptiveGuidedTutorial';

const runtime = {
  tutorial: {
    id: 'tutorial-learning-modules-search',
  },
  definition: {
    title: 'Learning modules quick-start',
    description: 'Step-by-step walkthrough for the learning catalog.',
  },
  steps: [
    {
      id: 'step-1',
      title: 'Search input',
      guidance: 'Use the search box to find a topic.',
      anchor: {
        anchorId: 'learning-modules-search-input',
        title: 'Search input',
        description: 'Enter a topic.',
      },
    },
    {
      id: 'step-2',
      title: 'Filter category',
      guidance: 'Use the category filter.',
      anchor: {
        anchorId: 'learning-modules-filter-select',
        title: 'Filter',
        description: 'Choose a category.',
      },
      scriptHook: {
        id: 'script-1',
        kind: 'script',
        cue: 'Explain why filters help.',
      },
    },
  ],
  status: 'recommended',
  trigger: 'automatic',
  available: true,
  autoStart: false,
  completed: false,
  recommendationReasons: ['The learner profile asks for guided tutorials.'],
  graphReasons: [],
};

describe('AdaptiveGuidedTutorial', () => {
  test('renders steps, highlights anchors, and completes the session', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();

    render(
      <div>
        <input data-guided-tutorial-anchor="learning-modules-search-input" />
        <select data-guided-tutorial-anchor="learning-modules-filter-select"><option>Stocks</option></select>
        <AdaptiveGuidedTutorial runtime={runtime} onComplete={onComplete} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /start tutorial/i }));
    expect(screen.getByRole('dialog', { name: /search input/i })).toBeInTheDocument();
    expect(document.querySelector('[data-guided-tutorial-anchor="learning-modules-search-input"]')).toHaveClass('guided-tutorial-anchor-active');

    await user.click(screen.getByRole('button', { name: /next step/i }));
    expect(screen.getByText(/script cue/i)).toBeInTheDocument();
    expect(document.querySelector('[data-guided-tutorial-anchor="learning-modules-filter-select"]')).toHaveClass('guided-tutorial-anchor-active');

    await user.click(screen.getByRole('button', { name: /complete tutorial/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
