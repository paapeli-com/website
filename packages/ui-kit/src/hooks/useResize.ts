import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';

import {useLastCallback} from './useLastCallback';
import { useFlag } from '../util';

export function useResize(
  elementRef: RefObject<HTMLElement | null>,
  onResize: (width: number) => void,
  onReset: any,
  initialWidth?: number,
  cssPropertyName?: string,
) {
  const [isActive, markIsActive, unmarkIsActive] = useFlag();
  const [initialMouseX, setInitialMouseX] = useState<number>(0);
  const [initialElementWidth, setInitialElementWidth] = useState<number>(0);

  const setElementStyle = useLastCallback((width?: number) => {
    requestAnimationFrame(() => {
      if(!width) return

      if (!elementRef.current) {
        return;
      }

      const widthPx = width ? `${width}px` : '';
      if((width < 100)){
        elementRef.current.style.display = 'none';
      }else if(width < 600){
        elementRef.current.style.display = '';
        elementRef.current.style.width = widthPx;
        if (cssPropertyName) {
          elementRef.current.style.setProperty(cssPropertyName, widthPx);
        }
      }
    });
  });

  useLayoutEffect(() => {
    if (!elementRef.current || !initialWidth) {
      return;
    }

    setElementStyle(initialWidth);
  }, [cssPropertyName, elementRef, initialWidth, setElementStyle]);

  function handleMouseUp() {
    requestAnimationFrame(() => {
      document.body.classList.remove('cursor-ew-resize');
    });
  }

  function initResize(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();

    requestAnimationFrame(() => {
      document.body.classList.add('cursor-ew-resize');
    });

    setInitialMouseX(e.clientX);
    setInitialElementWidth(elementRef.current!.offsetWidth);
    markIsActive();
  }

  function resetResize(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();
    setElementStyle(undefined);
    onReset();
  }

  useEffect(() => {
    if (!isActive) return undefined;

    const handleMouseMove = (e: MouseEvent) => {
      // const newWidth = Math.ceil(initialElementWidth + (e.clientX - initialMouseX));
      const newWidth = (initialMouseX - e.clientX) + initialElementWidth
      setElementStyle(newWidth);
    };

    function stopDrag() {
      cleanup();
      onResize(elementRef.current!.offsetWidth);
    }

    function cleanup() {
      handleMouseUp();
      document.removeEventListener('mousemove', handleMouseMove, false);
      document.removeEventListener('mouseup', stopDrag, false);
      document.removeEventListener('blur', stopDrag, false);
      unmarkIsActive();
    }

    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('mouseup', stopDrag, false);
    document.addEventListener('blur', stopDrag, false);

    return cleanup;
  }, [initialElementWidth, initialMouseX, elementRef, onResize, isActive, unmarkIsActive, setElementStyle]);

  return { initResize, resetResize, handleMouseUp };
}
