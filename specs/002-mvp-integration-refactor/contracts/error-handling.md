# Error Handling Contract

**Feature**: 002-mvp-integration-refactor  
**Date**: 2025-11-06  
**Purpose**: Define consistent error handling patterns across the application

## Overview

This document specifies how errors should be handled at different layers of the frontend application, ensuring consistent user experience and debugging capability.

---

## Error Types Hierarchy

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// API-specific errors
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number,
    public details?: Record<string, string[]>,
    public path?: string,
  ) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'ApiError';
  }
}

// Network-specific errors
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

// Authorization errors
export class PermissionError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 'PERMISSION_ERROR', 403);
    this.name = 'PermissionError';
  }
}

// Resource not found errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// WebSocket errors
export class WebSocketError extends AppError {
  constructor(
    message: string,
    public reconnecting: boolean = false,
  ) {
    super(message, 'WEBSOCKET_ERROR');
    this.name = 'WebSocketError';
  }
}
```

---

## Layer 1: HTTP Interceptor (Axios)

**Purpose**: Catch all API errors, apply retry logic, transform to custom error types

### Response Interceptor

```typescript
import axios, { AxiosError, AxiosResponse } from 'axios';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Create axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config._retryCount = config._retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor (handle errors, retry)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    // 1. Check if should retry
    if (shouldRetry(error) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;

      // Exponential backoff
      const delay = RETRY_DELAY_BASE * Math.pow(2, config._retryCount - 1);
      await sleep(delay);

      console.log(`Retrying request (attempt ${config._retryCount}/${MAX_RETRIES})...`);
      return apiClient(config);
    }

    // 2. Transform to custom error type
    const customError = transformError(error);

    // 3. Log error for debugging
    logError(customError, config);

    return Promise.reject(customError);
  },
);

// Retry logic
function shouldRetry(error: AxiosError): boolean {
  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors (except 501 Not Implemented)
  if (error.response.status >= 500 && error.response.status !== 501) {
    return true;
  }

  // Retry on 429 Too Many Requests
  if (error.response.status === 429) {
    return true;
  }

  return false;
}

// Transform axios error to custom error type
function transformError(error: AxiosError): AppError {
  // Network error (no response)
  if (!error.response) {
    return new NetworkError(
      error.message || 'Network request failed. Please check your connection.',
    );
  }

  const { status, data } = error.response;
  const message = (data as any)?.message || error.message;

  // Authentication error
  if (status === 401) {
    return new AuthError(message);
  }

  // Authorization error
  if (status === 403) {
    return new PermissionError(message);
  }

  // Not found error
  if (status === 404) {
    return new NotFoundError(message);
  }

  // Validation error
  if (status === 400 && (data as any)?.details) {
    return new ValidationError(message, (data as any).details);
  }

  // Generic API error
  return new ApiError(message, status, (data as any)?.details, error.config?.url);
}

// Error logging
function logError(error: AppError, config: any): void {
  console.error('[API Error]', {
    type: error.name,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    url: config?.url,
    method: config?.method?.toUpperCase(),
  });

  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  if (import.meta.env.PROD) {
    // Sentry.captureException(error);
  }
}

// Utility: sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

## Layer 2: Custom Hooks (React State)

**Purpose**: Expose error state to components, trigger toast notifications

### Hook Error Handling Pattern

```typescript
import { useState } from 'react';
import { useToast } from './useToast';

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>,
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const toast = useToast();

  const mutate = async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);

      // Success callback
      options?.onSuccess?.(result, variables);

      // Success toast (optional)
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }

      return result;
    } catch (err) {
      const appError = err as AppError;
      setError(appError);

      // Error callback
      options?.onError?.(appError, variables);

      // Error toast with retry
      handleErrorToast(appError, () => mutate(variables));

      throw appError;
    } finally {
      setLoading(false);
      options?.onSettled?.(data, error, variables);
    }
  };

  const handleErrorToast = (error: AppError, retry: () => void) => {
    // Authentication error - redirect to login
    if (error instanceof AuthError) {
      toast.error({
        title: 'Authentication required',
        description: 'Please log in to continue',
        action: {
          label: 'Login',
          onClick: () => redirectToLogin(),
        },
      });
      return;
    }

    // Permission error - no retry
    if (error instanceof PermissionError) {
      toast.error({
        title: 'Permission denied',
        description: error.message,
      });
      return;
    }

    // Validation error - show details
    if (error instanceof ValidationError) {
      const errorMessages = Object.values(error.errors).flat();
      toast.error({
        title: 'Validation failed',
        description: errorMessages.join(', '),
      });
      return;
    }

    // Network/API error - allow retry
    toast.error({
      title: 'Operation failed',
      description: error.message,
      action: {
        label: 'Retry',
        onClick: retry,
      },
    });
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    mutate,
    mutateAsync: mutate,
    data,
    loading,
    error,
    reset,
  };
}
```

---

## Layer 3: Toast Notifications (User Feedback)

**Purpose**: Provide user-friendly error messages with retry capability

### Toast Service

```typescript
import { useToast as useToastPrimitive } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const { toast } = useToastPrimitive();

  return {
    success: (options: string | ToastOptions) => {
      const opts = typeof options === 'string'
        ? { title: options }
        : options;

      toast({
        title: opts.title,
        description: opts.description,
        variant: 'default',
        duration: opts.duration || 3000,
      });
    },

    error: (options: string | ToastOptions) => {
      const opts = typeof options === 'string'
        ? { title: options }
        : options;

      toast({
        title: opts.title,
        description: opts.description,
        variant: 'destructive',
        duration: opts.duration || 5000,
        action: opts.action ? (
          <Button
            variant="outline"
            size="sm"
            onClick={opts.action.onClick}
          >
            {opts.action.label}
          </Button>
        ) : undefined,
      });
    },

    info: (options: string | ToastOptions) => {
      const opts = typeof options === 'string'
        ? { title: options }
        : options;

      toast({
        title: opts.title,
        description: opts.description,
        variant: 'default',
        duration: opts.duration || 4000,
      });
    },

    warning: (options: string | ToastOptions) => {
      const opts = typeof options === 'string'
        ? { title: options }
        : options;

      toast({
        title: opts.title,
        description: opts.description,
        variant: 'default', // shadcn/ui doesn't have warning variant by default
        duration: opts.duration || 4000,
      });
    },
  };
}
```

---

## Layer 4: Error Boundaries (React Error Catching)

**Purpose**: Catch component errors, prevent full app crash

### Error Boundary Component

```typescript
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error tracking service
    console.error('[Error Boundary]', error, errorInfo);

    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage**:

```typescript
// App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Individual page/feature boundaries
<ErrorBoundary fallback={<FeatureErrorFallback />}>
  <BoardPage />
</ErrorBoundary>
```

---

## WebSocket Error Handling

### WebSocket Service Error Handling

```typescript
class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    try {
      this.socket = io(WEBSOCKET_URL, {
        auth: { token: getAuthToken() },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupErrorHandlers();
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      throw new WebSocketError('Failed to connect to server');
    }
  }

  private setupErrorHandlers() {
    if (!this.socket) return;

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);

      // Authentication error
      if (error.message.includes('auth')) {
        toast.error({
          title: 'Authentication failed',
          description: 'Please log in again',
          action: {
            label: 'Login',
            onClick: () => redirectToLogin(),
          },
        });
        return;
      }

      // Generic connection error
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error({
          title: 'Connection failed',
          description: 'Could not connect to server. Please check your internet connection.',
          action: {
            label: 'Retry',
            onClick: () => {
              this.reconnectAttempts = 0;
              this.connect();
            },
          },
        });
      }
    });

    // Server error event
    this.socket.on('error', ({ message, code }) => {
      console.error('[WebSocket] Server error:', code, message);

      toast.error({
        title: 'Server error',
        description: message,
      });
    });

    // Reconnecting
    this.socket.on('reconnecting', (attempt) => {
      console.log('[WebSocket] Reconnecting...', attempt);

      if (attempt === 1) {
        toast.info({
          title: 'Reconnecting...',
          duration: null, // Persistent
        });
      }
    });

    // Reconnected
    this.socket.on('reconnect', () => {
      console.log('[WebSocket] Reconnected');
      this.reconnectAttempts = 0;

      toast.success('Reconnected');
    });
  }
}
```

---

## Error Message Guidelines

### User-Facing Messages

**Do**:

- ✅ Use plain language: "Failed to save card" instead of "POST /cards 500"
- ✅ Explain impact: "Your changes were not saved"
- ✅ Provide action: "Click Retry to try again"
- ✅ Be specific when helpful: "Name must be under 100 characters"

**Don't**:

- ❌ Expose technical details: "AxiosError: Request failed with status code 500"
- ❌ Use jargon: "ERR_CONNECTION_REFUSED"
- ❌ Blame user: "You entered invalid data"
- ❌ Be vague: "Something went wrong"

### Message Templates

```typescript
// Generic errors
'Failed to load board';
'Failed to create card';
'Failed to save changes';

// Network errors
'Network request failed. Please check your connection.';
'Connection timeout. Please try again.';

// Validation errors
'Name is required and must be under 100 characters';
'Due date must be in the future';
'At least one assignee is required';

// Permission errors
'You do not have permission to delete this board';
'Only board admins can add members';

// Not found errors
'Board not found. It may have been deleted.';
'Card not found. Please refresh the page.';
```

---

## Testing Error Handling

### Mock Error Responses

```typescript
// Mock API error
jest.spyOn(boardService, 'createBoard').mockRejectedValue(
  new ApiError('Board name already exists', 400)
);

// Mock network error
jest.spyOn(boardService, 'createBoard').mockRejectedValue(
  new NetworkError('Network request failed')
);

// Test error handling
test('shows error toast on API failure', async () => {
  const { getByRole } = render(<CreateBoardForm />);

  await userEvent.type(getByRole('textbox'), 'Test Board');
  await userEvent.click(getByRole('button', { name: /create/i }));

  // Verify error toast appeared
  await waitFor(() => {
    expect(screen.getByText(/failed to create board/i)).toBeInTheDocument();
  });
});
```

---

## Summary

This error handling contract defines:

- ✅ Error type hierarchy (ApiError, NetworkError, ValidationError, etc.)
- ✅ Layer 1: HTTP interceptor with retry logic
- ✅ Layer 2: Custom hooks exposing error state
- ✅ Layer 3: Toast notifications with retry capability
- ✅ Layer 4: Error boundaries catching component errors
- ✅ WebSocket error handling
- ✅ User-friendly error messages
- ✅ Testing patterns

All error handling must follow this multi-layer approach for consistency and user experience.
