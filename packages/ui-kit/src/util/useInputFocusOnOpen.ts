import type { RefObject } from 'react';
import { useEffect } from 'react';

// import { requestMutation } from '../lib/fasterdom/fasterdom';
import { IS_MOBILE } from './windowEnvironment';

// Focus slows down animation, also it breaks transition layout in Chrome
const FOCUS_DELAY_MS = 500;
const MODAL_HIDE_DELAY_MS = 300;

export function useInputFocusOnOpen(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  isOpen?: boolean,
  onClose?: any,
) {
  // const { IS_MOBILE } = useAppLayout();

  useEffect(() => {
    if (isOpen) {
      if (!IS_MOBILE) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (inputRef.current?.isConnected) {
              inputRef.current.focus();
            }
          });
        }, FOCUS_DELAY_MS);
      }
    } else {
      if (inputRef.current?.isConnected) {
        inputRef.current.blur();
      }

      if (onClose) {
        setTimeout(onClose, MODAL_HIDE_DELAY_MS);
      }
    }
  }, [inputRef, IS_MOBILE, isOpen, onClose]);
}
