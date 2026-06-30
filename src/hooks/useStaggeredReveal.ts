import { useEffect, useRef, useState } from 'react';

export const STANZA_INITIAL_DELAY_MS = 520;
export const STANZA_PAUSE_MS = 1100;
export const STANZA_FADE_MS = 720;

export function useStaggeredReveal(
  stanzaCount: number,
  enabled: boolean,
  onComplete?: () => void,
  onStep?: (visibleCount: number) => void,
) {
  const [visibleCount, setVisibleCount] = useState(enabled ? 0 : stanzaCount);
  const onCompleteRef = useRef(onComplete);
  const onStepRef = useRef(onStep);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    if (!enabled) {
      setVisibleCount(stanzaCount);
      return;
    }

    if (stanzaCount === 0) {
      onCompleteRef.current?.();
      return;
    }

    setVisibleCount(0);

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let index = 1; index <= stanzaCount; index += 1) {
      const revealDelay =
        STANZA_INITIAL_DELAY_MS +
        (index - 1) * (STANZA_PAUSE_MS + STANZA_FADE_MS);

      timeouts.push(
        setTimeout(() => {
          setVisibleCount(index);
          onStepRef.current?.(index);

          if (index === stanzaCount) {
            timeouts.push(
              setTimeout(() => {
                onCompleteRef.current?.();
              }, STANZA_FADE_MS + 240),
            );
          }
        }, revealDelay),
      );
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [enabled, stanzaCount]);

  return visibleCount;
}
