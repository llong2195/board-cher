// API Client with interceptors for error handling and retry logic
// Based on contracts/error-handling.md

import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  ApiError,
  NetworkError,
  AuthError,
  PermissionError,
  NotFoundError,
  ValidationError,
} from '@/types/error.types';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Extend AxiosRequestConfig to include retry count
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token and initialize retry count
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add authentication token if available
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Initialize retry count
    const retryConfig = config as RetryConfig;
    retryConfig._retryCount = retryConfig._retryCount || 0;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors and retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    if (!config) {
      return Promise.reject(transformError(error));
    }

    // Check if should retry
    if (shouldRetry(error) && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;

      // Exponential backoff
      const delay = RETRY_DELAY_BASE * Math.pow(2, config._retryCount - 1);
      await sleep(delay);

      console.log(`Retrying request (attempt ${config._retryCount}/${MAX_RETRIES})...`);
      return apiClient(config);
    }

    // Transform to custom error type
    const customError = transformError(error);

    // Log error for debugging
    logError(customError, config);

    return Promise.reject(customError);
  },
);

// Determine if request should be retried
function shouldRetry(error: AxiosError): boolean {
  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  const status = error.response.status;

  // Retry on 5xx server errors (except 501 Not Implemented)
  if (status >= 500 && status !== 501) {
    return true;
  }

  // Retry on 429 Too Many Requests
  if (status === 429) {
    return true;
  }

  return false;
}

// Transform axios error to custom error type
function transformError(error: AxiosError): Error {
  // Network error (no response)
  if (!error.response) {
    return new NetworkError(
      error.message || 'Network request failed. Please check your connection.',
    );
  }

  const { status, data } = error.response;
  const message = (data as { message?: string })?.message || error.message;

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
  if (status === 400 && (data as { details?: unknown })?.details) {
    return new ValidationError(message, (data as { details: Record<string, string[]> }).details);
  }

  // Generic API error
  return new ApiError(
    message,
    status,
    (data as { details?: Record<string, string[]> })?.details,
    error.config?.url,
  );
}

// Log error for debugging
function logError(error: Error, config: RetryConfig): void {
  console.error('[API Error]', {
    type: error.name,
    message: error.message,
    url: config?.url,
    method: config?.method?.toUpperCase(),
  });

  // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error);
  // }
}

// Utility: sleep for async delay
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Get authentication token from localStorage or context
function getAuthToken(): string | null {
  // TODO: Implement proper auth token management
  // This could come from localStorage, sessionStorage, or auth context
  return localStorage.getItem('auth_token');
}
