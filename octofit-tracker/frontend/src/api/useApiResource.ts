import { useEffect, useState } from 'react';
import { getJson } from './client.js';

type ApiResource<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useApiResource<T>(path: string): ApiResource<T> {
  const [resource, setResource] = useState<ApiResource<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setResource({ data: null, loading: true, error: null });
    getJson<T>(path)
      .then((data) => {
        if (active) setResource({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setResource({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      });
    return () => { active = false; };
  }, [path]);

  return resource;
}
