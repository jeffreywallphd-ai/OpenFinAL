import { useEffect, useMemo, useState } from 'react';
import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';
import {
  buildAdaptiveLearningCatalogRuntime,
  buildAdaptiveLearningCatalogViewModel,
  loadAdaptiveLearningCatalogRuntime,
} from './learningCatalogAdaptive';

export function useAdaptiveLearningCatalogRecommendations(userId) {
  const defaultRuntime = useMemo(
    () => buildAdaptiveLearningCatalogRuntime({
      profile: createDefaultLearnerProfile(`user-${userId ?? 'guest'}`),
      hasLearnerProfile: false,
      graphRecommendations: [],
    }),
    [userId],
  );
  const defaultViewModel = useMemo(() => buildAdaptiveLearningCatalogViewModel(defaultRuntime), [defaultRuntime]);

  const [viewModel, setViewModel] = useState(defaultViewModel);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setViewModel(defaultViewModel);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);

    loadAdaptiveLearningCatalogRuntime(userId)
      .then((runtime) => {
        if (!isMounted) {
          return;
        }

        setViewModel(buildAdaptiveLearningCatalogViewModel(runtime));
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setViewModel(defaultViewModel);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [defaultViewModel, userId]);

  return {
    adaptiveLearningCatalog: viewModel,
    adaptiveLearningLoading: loading,
  };
}
