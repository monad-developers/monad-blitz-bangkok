import { useEffect, useState } from "react";

export const useLoading = (initialState = true, delay = 1000) => {
  const [isLoading, setIsLoading] = useState(initialState);

  useEffect(() => {
    if (initialState) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [initialState, delay]);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
};
