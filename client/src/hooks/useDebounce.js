import { useState, useEffect } from 'react';

/**
 * Custom Hook: useDebounce
 * Delays updating a value until after the specified delay has passed.
 * Used for responsive transaction search and filtering without lag.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
