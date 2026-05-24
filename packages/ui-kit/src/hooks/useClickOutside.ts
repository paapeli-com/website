import { useEffect, useRef } from "react";

/**
 * useClickOutside Hook
 * @param onClickOutside - callback when click happens outside the element
 */
export function useClickOutside<T extends HTMLElement>(
  onClickOutside: (event: MouseEvent | TouchEvent) => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside(event);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [onClickOutside]);

  return ref;
}
