// Error utility functions and type guards
// Based on contracts/error-handling.md

import { ApiError, NetworkError, ValidationError, WebSocketError } from '@/types/error.types';

// Type guard for API errors
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'ApiError';
}

// Type guard for network errors
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof Error && error.name === 'NetworkError';
}

// Type guard for validation errors
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && error.name === 'ValidationError';
}

// Type guard for WebSocket errors
export function isWebSocketError(error: unknown): error is WebSocketError {
  return error instanceof Error && error.name === 'WebSocketError';
}

// Extract user-friendly error message from any error type
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (isValidationError(error)) {
    const messages = Object.values(error.errors).flat();
    return messages.join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Get error details for debugging
export function getErrorDetails(error: unknown): Record<string, unknown> {
  if (isApiError(error)) {
    return {
      type: 'ApiError',
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      path: error.path,
    };
  }
  if (isValidationError(error)) {
    return {
      type: 'ValidationError',
      message: error.message,
      errors: error.errors,
    };
  }
  if (isWebSocketError(error)) {
    return {
      type: 'WebSocketError',
      message: error.message,
      reconnecting: error.reconnecting,
    };
  }
  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    type: 'Unknown',
    value: String(error),
  };
}
