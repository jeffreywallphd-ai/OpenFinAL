import { useEffect, useMemo, useState } from 'react';
import {
  buildTradeWorkbenchAdaptiveSlice,
  loadTradeWorkbenchAdaptiveRuntime,
} from './tradeWorkbenchAdaptive';
import { createDefaultLearnerProfile } from '@application/adaptive-learning/learnerProfile';

export function useAdaptiveTradeWorkbenchGovernance(userId) {
  const defaultSlice = useMemo(
    () => buildTradeWorkbenchAdaptiveSlice({
      profile: createDefaultLearnerProfile(`user-${userId ?? 'guest'}`),
      hasLearnerProfile: false,
      graphRecommendations: [],
    }),
    [userId],
  );

  const [adaptiveSlice, setAdaptiveSlice] = useState(defaultSlice);
  const [adaptiveLoading, setAdaptiveLoading] = useState(Boolean(userId));
  const [graphSynced, setGraphSynced] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setAdaptiveSlice(defaultSlice);
      setAdaptiveLoading(false);
      setGraphSynced(false);
      return () => {
        isMounted = false;
      };
    }

    setAdaptiveLoading(true);

    loadTradeWorkbenchAdaptiveRuntime(userId)
      .then(({ slice, graphSynced: didSync }) => {
        if (!isMounted) {
          return;
        }

        setAdaptiveSlice(slice);
        setGraphSynced(didSync);
        setAdaptiveLoading(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAdaptiveSlice(defaultSlice);
        setGraphSynced(false);
        setAdaptiveLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [defaultSlice, userId]);

  return {
    adaptiveSlice,
    adaptiveLoading,
    graphSynced,
  };
}
