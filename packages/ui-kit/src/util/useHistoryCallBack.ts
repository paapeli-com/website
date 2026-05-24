import { useCallback, useEffect, useRef } from 'react';
// This effect implements closing menus by clicking outside of them
// without adding extra elements to the DOM
export function useHistoryBack2({
  onBack,
  isActive = false,
}: UseHistoryBackOptions){
 
  useEffect(() => {
    if (!isActive) { 
      return undefined;
    }
    const dataT = {ts:new Date().getTime()}
    
    const handleEvent = (e: PopStateEvent) => {
      console.log(e)
      history.replaceState(dataT, '', location.href); // Push the current state back
      onBack()
    };
    
    window.addEventListener('popstate',handleEvent);
    history.pushState(dataT, '',location.href );

    return () => {
      window.removeEventListener('popstate', handleEvent);
    };
  }, [isActive, onBack]);
  // }, [excludedClosestSelector, ignoreRightClick, isOpen, containerRef, onClose]);
}

type UseHistoryBackOptions = {
  isActive?: boolean;
  shouldBeReplaced?: boolean;
  shouldResetUrlHash?: boolean;
  hash?: string;
  onBack: VoidFunction;
};

const historyState: Record<number, any> = {};
let historyCursor = 0;

export function useHistoryBack({
  isActive = false,
  shouldBeReplaced = false,
  shouldResetUrlHash = false,
  hash,
  onBack,
}: UseHistoryBackOptions) {
  const lastOnBack = useRef(onBack);
  const indexRef = useRef<number | undefined>(null);
  const wasReplaced = useRef(false);
  const isFirstRender = useRef(true);
  useEffect(() => {
    lastOnBack.current = onBack;
  }, [onBack]);

  const pushState = useCallback(
    (forceReplace = false) => {
      const shouldReplace = forceReplace || shouldBeReplaced;
      indexRef.current = shouldReplace ? historyCursor : ++historyCursor;

      const previousRecord = historyState[indexRef.current];
      if (previousRecord && !previousRecord.isClosed) {
        previousRecord.markReplaced?.();
      }

      historyState[indexRef.current] = {
        index: indexRef.current,
        onBack: lastOnBack.current,
        shouldBeReplaced,
        markReplaced: () => {
          wasReplaced.current = true;
        },
      };

      historyCursor = indexRef.current;

      const urlHash = hash ? `#${hash}` : shouldResetUrlHash ? ' ' : undefined;
      const operation = shouldReplace ? 'replaceState' : 'pushState';

      window.history[operation]({ index: indexRef.current }, '', urlHash);
    },
    [hash, shouldBeReplaced, shouldResetUrlHash]
  );

  const processBack = useCallback(() => {
    if (
      indexRef.current !== undefined &&
      historyState[indexRef.current!] &&
      !wasReplaced.current
    ) {
      historyState[indexRef.current!].isClosed = true;
      wasReplaced.current = true;

      if (indexRef.current === historyCursor && !shouldBeReplaced) {
        historyCursor--;
      }
    }
  }, [shouldBeReplaced]);

  useEffect(() => {
    isFirstRender.current = false;

    return () => {
      if (isActive && !wasReplaced.current) {
        processBack();
      }
    };
  }, [isActive, processBack]);

  useEffect(() => {
    if (isFirstRender.current && !isActive) return;

    if (isActive) {
      pushState();
    } else {
      processBack();
    }
  }, [isActive, processBack, pushState]);
}
