import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { syncManager } from "@/services/SyncManager";

// Minimal local replacement for `useAppState` from @react-native-community/hooks
function useAppState(): AppStateStatus {
  const [state, setState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", setState);
    return () => {
      // remove() is supported on newer RN versions; guard for older APIs
      if (typeof sub.remove === "function") sub.remove();
      // @ts-ignore - fallback for older RN where addEventListener returns void
      else if (typeof AppState.removeEventListener === "function")
        // @ts-ignore
        AppState.removeEventListener("change", setState);
    };
  }, []);

  return state;
}

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const appState = useAppState();
  const isSyncingRef = useRef(false);
  const previousAppStateRef = useRef<AppStateStatus>(appState);
  const lastAutoSyncAtRef = useRef(0);

  const sync = useCallback(async () => {
    if (isSyncingRef.current) {
      console.log("Sync already in progress");
      return false;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const success = await syncManager.syncNutritionData();
      if (success) {
        setLastSyncTime(syncManager.getLastSyncTime());
      }
      return success;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Auto-sync only when app transitions back to foreground.
  useEffect(() => {
    const wasInactive = previousAppStateRef.current !== "active";
    previousAppStateRef.current = appState;

    if (appState === "active" && wasInactive) {
      const now = Date.now();
      if (now - lastAutoSyncAtRef.current < 60_000) {
        return;
      }

      lastAutoSyncAtRef.current = now;
      const timer = setTimeout(() => {
        sync();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [appState, sync]);

  // Periodic sync (every 15 minutes)
  useEffect(() => {
    const interval = setInterval(
      () => {
        sync();
      },
      15 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [sync]);

  return {
    sync,
    isSyncing,
    lastSyncTime,
  };
}
