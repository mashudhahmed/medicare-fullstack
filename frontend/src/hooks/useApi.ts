import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseApiOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  autoExecute?: boolean;
}

type ApiFunction<T, P extends unknown[]> = (...args: P) => Promise<T>;

export const useApi = <T, P extends unknown[]>(
  apiFunction: ApiFunction<T, P>,
  options: UseApiOptions = {}
) => {
  const { showSuccessToast = false, successMessage = 'Operation successful' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: P): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        if (showSuccessToast) {
          toast.success(successMessage);
        }
        return result;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } }; message?: string };
        const message = error.response?.data?.error || error.message || 'An error occurred';
        setError(message);
        toast.error(message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, showSuccessToast, successMessage]
  );

  return { data, loading, error, execute, setData };
};

export default useApi;