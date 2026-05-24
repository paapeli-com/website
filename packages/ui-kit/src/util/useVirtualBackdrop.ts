import { useEffect, type RefObject } from 'react';
const BACKDROP_CLASSNAME = 'backdrop';

// This effect implements closing menus by clicking outside of them
// without adding extra elements to the DOM
export default function useVirtualBackdrop(
  isOpen: boolean | undefined,
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void | undefined,
  ignoreRightClick?: boolean,
  excludedClosestSelector?: string,
  backDrop:string = BACKDROP_CLASSNAME
) {
  useEffect(() => {
    if (!isOpen || !onClose) {
      return undefined;
    }

    const handleEvent = (e: MouseEvent) => {
      const container = containerRef.current;
      const target = e.target as HTMLElement | null;
      if (!container || !target || (ignoreRightClick && e.button === 2)) {
        return;
      }
      if ((
        !container.contains(e.target as Node | null)
        || target.classList.contains(backDrop)
      )) {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleEvent);
    });

    return () => {
      document.removeEventListener('mousedown', handleEvent);
    };
  }, [excludedClosestSelector, ignoreRightClick, isOpen, containerRef, onClose]);
}
