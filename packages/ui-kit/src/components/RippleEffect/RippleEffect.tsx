import { memo, useMemo, useState } from 'react';

// import { debounce, IS_TOUCH_ENV } from 'amir-utils';
// import { useLastCallback } from 'amir-utils';

import './RippleEffect.scss';
import { debounce, IS_TOUCH_ENV } from '../../util';
import { useLastCallback } from '../../hooks';

interface Ripple {
  x: number;
  y: number;
  size: number;
}

const ANIMATION_DURATION_MS = 700;

const RippleEffect: React.FC = memo(() => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const cleanUpDebounced = useMemo(() => {
    return debounce(() => {
      setRipples([]);
    }, ANIMATION_DURATION_MS, false);
  }, []);

  const handleMouseDown = useLastCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.button !== 0) return;

      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const rippleSize = container.offsetWidth;

      const newRipple: Ripple = {
        x: e.clientX - rect.left - rippleSize / 2,
        y: e.clientY - rect.top - rippleSize / 2,
        size: rippleSize,
      };

      setRipples((prev) => [...prev, newRipple]);
      cleanUpDebounced();
    }
  );

  const handleTouchDown = useLastCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const rippleSize = container.offsetWidth;

    const touch = e.touches[0]!;
    const newRipple: Ripple = {
      x: touch.clientX - rect.left - rippleSize / 2,
      y: touch.clientY - rect.top - rippleSize / 2,
      size: rippleSize,
    };

    setRipples((prev) => [...prev, newRipple]);
    cleanUpDebounced();
  });

  return (
    <div
      className="ripple-container"
      onTouchStart={IS_TOUCH_ENV ? handleTouchDown : undefined}
      onMouseDown={!IS_TOUCH_ENV ? handleMouseDown : undefined}
    >
      {ripples.map(({ x, y, size }, i) => (
        <div
          key={i}
          className="ripple-wave"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      ))}
    </div>
  );
}) as React.FC;

export default RippleEffect ;
