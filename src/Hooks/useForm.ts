import { useCallback, useRef, useState } from 'react';
import { router, type RequestBody, type VisitOptions } from '@/Lib/router';

// Drop-in twin of Inertia's useForm. Components written against this hook
// keep working unchanged once the import flips to '@inertiajs/react' — same
// data/setData, same submit methods, same errors and processing flags.

type FormErrors<T> = Partial<Record<keyof T & string, string>>;

export function useForm<T extends RequestBody>(initial: T) {
  const [data, setDataState] = useState<T>(initial);
  const [errors, setErrorsState] = useState<FormErrors<T>>({});
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);
  const initialRef = useRef(initial);
  const transformRef = useRef<(data: T) => RequestBody>((d) => d);
  const successTimer = useRef<number | undefined>(undefined);

  const setData = useCallback(<K extends keyof T & string>(key: K | Partial<T>, value?: T[K]) => {
    if (typeof key === 'string') {
      setDataState((current) => ({ ...current, [key]: value }));
    } else {
      setDataState((current) => ({ ...current, ...key }));
    }
  }, []);

  const reset = useCallback((...fields: (keyof T & string)[]) => {
    if (fields.length === 0) {
      setDataState(initialRef.current);
    } else {
      setDataState((current) => {
        const next = { ...current };
        for (const field of fields) next[field] = initialRef.current[field];
        return next;
      });
    }
  }, []);

  const setError = useCallback((field: keyof T & string, message: string) => {
    setErrorsState((current) => ({ ...current, [field]: message }));
  }, []);

  const clearErrors = useCallback((...fields: (keyof T & string)[]) => {
    if (fields.length === 0) {
      setErrorsState({});
    } else {
      setErrorsState((current) => {
        const next = { ...current };
        for (const field of fields) delete next[field];
        return next;
      });
    }
  }, []);

  const transform = useCallback((fn: (data: T) => RequestBody) => {
    transformRef.current = fn;
  }, []);

  const submit = useCallback(
    (method: 'post' | 'put' | 'patch' | 'delete', url: string, options: VisitOptions = {}) => {
      setProcessing(true);
      setErrorsState({});
      const body = transformRef.current(data);
      const visit: VisitOptions = {
        ...options,
        onSuccess: () => {
          setRecentlySuccessful(true);
          window.clearTimeout(successTimer.current);
          successTimer.current = window.setTimeout(() => setRecentlySuccessful(false), 2000);
          options.onSuccess?.();
        },
        onError: (submitErrors) => {
          setErrorsState(submitErrors as FormErrors<T>);
          options.onError?.(submitErrors);
        },
        onFinish: () => {
          setProcessing(false);
          options.onFinish?.();
        },
      };
      return method === 'delete' ? router.delete(url, visit) : router[method](url, body, visit);
    },
    [data],
  );

  return {
    data,
    setData,
    errors,
    setError,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0,
    processing,
    recentlySuccessful,
    reset,
    transform,
    post: (url: string, options?: VisitOptions) => submit('post', url, options),
    put: (url: string, options?: VisitOptions) => submit('put', url, options),
    patch: (url: string, options?: VisitOptions) => submit('patch', url, options),
    delete: (url: string, options?: VisitOptions) => submit('delete', url, options),
  };
}
