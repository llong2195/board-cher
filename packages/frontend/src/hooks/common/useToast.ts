// Custom toast hook with enhanced functionality
// Based on contracts/error-handling.md
// Wraps the basic useToast with success, error, info, warning methods

import { useCallback } from 'react';
import { useToast as useToastPrimitive } from '@/hooks/useToast';

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastMethods {
  success: (options: string | ToastOptions) => void;
  error: (options: string | ToastOptions) => void;
  info: (options: string | ToastOptions) => void;
  warning: (options: string | ToastOptions) => void;
}

export function useToast(): ToastMethods {
  const { addToast } = useToastPrimitive();

  const normalizeOptions = (options: string | ToastOptions): ToastOptions => {
    return typeof options === 'string' ? { title: options } : options;
  };

  const success = useCallback(
    (options: string | ToastOptions) => {
      const opts = normalizeOptions(options);
      addToast({
        title: opts.title,
        description: opts.description,
        variant: 'success',
        duration: opts.duration || 3000,
      });
    },
    [addToast],
  );

  const error = useCallback(
    (options: string | ToastOptions) => {
      const opts = normalizeOptions(options);
      addToast({
        title: opts.title,
        description: opts.description,
        variant: 'error',
        duration: opts.duration || 5000,
      });
    },
    [addToast],
  );

  const info = useCallback(
    (options: string | ToastOptions) => {
      const opts = normalizeOptions(options);
      addToast({
        title: opts.title,
        description: opts.description,
        variant: 'default',
        duration: opts.duration || 4000,
      });
    },
    [addToast],
  );

  const warning = useCallback(
    (options: string | ToastOptions) => {
      const opts = normalizeOptions(options);
      addToast({
        title: opts.title,
        description: opts.description,
        variant: 'warning',
        duration: opts.duration || 4000,
      });
    },
    [addToast],
  );

  return {
    success,
    error,
    info,
    warning,
  };
}
