/**
 * T277 [Phase 10] API Error Handler
 *
 * Centralized error handling for API requests with user-friendly messages.
 * Converts technical error responses into readable messages for end users.
 */

import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * User-friendly error messages mapped to HTTP status codes
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You need to be logged in to perform this action.',
  403: "You don't have permission to perform this action.",
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data. Please refresh and try again.',
  422: 'The data you provided is invalid. Please check and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An unexpected server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
};

/**
 * Default error message for unknown errors
 */
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

/**
 * Error messages for specific error codes
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Your session is invalid. Please log in again.',

  // Board/Card operations
  BOARD_NOT_FOUND: "The board you're looking for doesn't exist or has been deleted.",
  CARD_NOT_FOUND: "The card you're looking for doesn't exist or has been deleted.",
  LIST_NOT_FOUND: "The list you're looking for doesn't exist or has been deleted.",

  // Permissions
  INSUFFICIENT_PERMISSIONS: "You don't have permission to perform this action.",
  NOT_BOARD_MEMBER: 'You must be a board member to perform this action.',
  NOT_ORG_MEMBER: 'You must be an organization member to perform this action.',

  // Validation
  INVALID_INPUT: 'Please check your input and try again.',
  REQUIRED_FIELD_MISSING: 'Please fill in all required fields.',

  // Network
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
};

/**
 * Convert axios error to user-friendly API error
 */
export function handleApiError(error: unknown): ApiError {
  // Handle axios errors
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.code;
    const errorMessage = error.response?.data?.message;

    // Use error code message if available
    if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
      return {
        message: ERROR_CODE_MESSAGES[errorCode],
        code: errorCode,
        statusCode,
        details: error.response?.data,
      };
    }

    // Use custom error message from server if readable
    if (errorMessage && typeof errorMessage === 'string' && errorMessage.length < 200) {
      return {
        message: errorMessage,
        code: errorCode,
        statusCode,
        details: error.response?.data,
      };
    }

    // Use status code message
    if (statusCode && ERROR_MESSAGES[statusCode]) {
      return {
        message: ERROR_MESSAGES[statusCode],
        code: errorCode,
        statusCode,
        details: error.response?.data,
      };
    }

    // Network errors (no response)
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      return {
        message: ERROR_CODE_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
      };
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return {
        message: ERROR_CODE_MESSAGES.TIMEOUT,
        code: 'TIMEOUT',
      };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message || DEFAULT_ERROR_MESSAGE,
    };
  }

  // Unknown error type
  return {
    message: DEFAULT_ERROR_MESSAGE,
  };
}

/**
 * Get user-friendly error message from error object
 */
export function getErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.code;

    return (
      statusCode === 401 ||
      errorCode === 'TOKEN_EXPIRED' ||
      errorCode === 'INVALID_TOKEN' ||
      errorCode === 'INVALID_CREDENTIALS'
    );
  }

  return false;
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.code;

    return (
      statusCode === 403 ||
      errorCode === 'INSUFFICIENT_PERMISSIONS' ||
      errorCode === 'NOT_BOARD_MEMBER' ||
      errorCode === 'NOT_ORG_MEMBER'
    );
  }

  return false;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
  }

  return false;
}

/**
 * Log error for debugging (in development) or send to monitoring service (in production)
 */
export function logError(error: unknown, context?: string): void {
  const apiError = handleApiError(error);

  if (import.meta.env.DEV) {
    console.error(`[API Error ${context ? `- ${context}` : ''}]:`, {
      message: apiError.message,
      code: apiError.code,
      statusCode: apiError.statusCode,
      details: apiError.details,
      originalError: error,
    });
  } else {
    // TODO: Send to monitoring service (e.g., Sentry, LogRocket)
    // Example: Sentry.captureException(error, { tags: { context } });
  }
}
