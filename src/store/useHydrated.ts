import { useEffect, useState } from 'react';
import { useAppStore } from './useAppStore';

/** True once the persisted store has finished reading from localStorage. Used to drive
 * loading skeletons for the routine/reflections/insights data instead of a fake timer. */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    // In case hydration already finished between initial state and effect running.
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);
  return hydrated;
}
