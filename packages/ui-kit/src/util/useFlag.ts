import { useCallback, useState } from 'react';
type NoneToVoidFunction = any
export const useFlag = (initial = false): [boolean, any, NoneToVoidFunction] => {
  const [value, setValue] = useState(initial);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, setTrue, setFalse];
};
