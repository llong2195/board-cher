/**
 * Unit tests for error utility functions
 * Tests type guards, error message extraction, and error transformation
 */

import { describe, it, expect } from 'vitest';
import {
  isApiError,
  isNetworkError,
  isValidationError,
  isAuthError,
  isPermissionError,
  isNotFoundError,
  isWebSocketError,
  getErrorMessage,
} from '@/lib/errors';
import {
  ApiError,
  NetworkError,
  ValidationError,
  AuthError,
  PermissionError,
  NotFoundError,
  WebSocketError,
} from '@/types/error.types';

describe('Error Type Guards', () => {
  describe('isApiError', () => {
    it('should return true for ApiError instances', () => {
      const error = new ApiError('API failed', 500);
      expect(isApiError(error)).toBe(true);
    });

    it('should return false for non-ApiError instances', () => {
      const error = new Error('Generic error');
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for NetworkError instances', () => {
      const error = new NetworkError('Connection failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new ApiError('API failed', 500);
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for ValidationError instances', () => {
      const error = new ValidationError('Invalid input', ['Field required']);
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new NetworkError('Connection failed');
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for AuthError instances', () => {
      const error = new AuthError('Unauthorized');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new ApiError('API failed', 500);
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isPermissionError', () => {
    it('should return true for PermissionError instances', () => {
      const error = new PermissionError('Forbidden', 'board', 'delete');
      expect(isPermissionError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new AuthError('Unauthorized');
      expect(isPermissionError(error)).toBe(false);
    });
  });

  describe('isNotFoundError', () => {
    it('should return true for NotFoundError instances', () => {
      const error = new NotFoundError('board', '123');
      expect(isNotFoundError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new ApiError('API failed', 500);
      expect(isNotFoundError(error)).toBe(false);
    });
  });

  describe('isWebSocketError', () => {
    it('should return true for WebSocketError instances', () => {
      const error = new WebSocketError('Connection lost', 'CONNECTION_FAILED');
      expect(isWebSocketError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new NetworkError('Connection failed');
      expect(isWebSocketError(error)).toBe(false);
    });
  });
});

describe('getErrorMessage', () => {
  it('should extract message from Error instances', () => {
    const error = new Error('Test error');
    expect(getErrorMessage(error)).toBe('Test error');
  });

  it('should extract message from ApiError', () => {
    const error = new ApiError('API request failed', 500);
    expect(getErrorMessage(error)).toBe('API request failed');
  });

  it('should extract message from NetworkError', () => {
    const error = new NetworkError('Network connection lost');
    expect(getErrorMessage(error)).toBe('Network connection lost');
  });

  it('should extract message from ValidationError', () => {
    const error = new ValidationError('Validation failed', ['Name is required']);
    expect(getErrorMessage(error)).toBe('Validation failed');
  });

  it('should handle ValidationError with details', () => {
    const error = new ValidationError('Validation failed', [
      'Name is required',
      'Email is invalid',
    ]);
    const message = getErrorMessage(error);
    expect(message).toContain('Validation failed');
  });

  it('should handle AuthError', () => {
    const error = new AuthError('User not authenticated');
    expect(getErrorMessage(error)).toBe('User not authenticated');
  });

  it('should handle PermissionError', () => {
    const error = new PermissionError('Access denied', 'board', 'delete');
    expect(getErrorMessage(error)).toBe('Access denied');
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('board', '123');
    const message = getErrorMessage(error);
    expect(message).toContain('board');
    expect(message).toContain('123');
  });

  it('should handle WebSocketError', () => {
    const error = new WebSocketError('Connection failed', 'CONNECTION_FAILED');
    expect(getErrorMessage(error)).toBe('Connection failed');
  });

  it('should handle string errors', () => {
    expect(getErrorMessage('Simple error string')).toBe('Simple error string');
  });

  it('should handle unknown error objects', () => {
    const error = { someProperty: 'value' };
    expect(getErrorMessage(error)).toBe('An unknown error occurred');
  });

  it('should handle null errors', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
  });

  it('should handle undefined errors', () => {
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('should handle errors with custom toString', () => {
    const error = {
      toString: () => 'Custom error string',
    };
    expect(getErrorMessage(error)).toBe('Custom error string');
  });
});

describe('Error Properties', () => {
  describe('ApiError', () => {
    it('should store status code', () => {
      const error = new ApiError('API failed', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should store response data', () => {
      const responseData = { detail: 'Not found' };
      const error = new ApiError('API failed', 404, responseData);
      expect(error.data).toEqual(responseData);
    });

    it('should have correct name', () => {
      const error = new ApiError('API failed', 500);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('ValidationError', () => {
    it('should store validation details', () => {
      const details = ['Field required', 'Invalid format'];
      const error = new ValidationError('Validation failed', details);
      expect(error.details).toEqual(details);
    });

    it('should have correct name', () => {
      const error = new ValidationError('Validation failed', []);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('PermissionError', () => {
    it('should store resource and action', () => {
      const error = new PermissionError('Forbidden', 'board', 'delete');
      expect(error.resource).toBe('board');
      expect(error.action).toBe('delete');
    });

    it('should have correct name', () => {
      const error = new PermissionError('Forbidden', 'card', 'edit');
      expect(error.name).toBe('PermissionError');
    });
  });

  describe('NotFoundError', () => {
    it('should store resource type and ID', () => {
      const error = new NotFoundError('board', '123');
      expect(error.resourceType).toBe('board');
      expect(error.resourceId).toBe('123');
    });

    it('should have correct name', () => {
      const error = new NotFoundError('card', '456');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('WebSocketError', () => {
    it('should store error code', () => {
      const error = new WebSocketError('Connection failed', 'CONNECTION_FAILED');
      expect(error.code).toBe('CONNECTION_FAILED');
    });

    it('should have correct name', () => {
      const error = new WebSocketError('Timeout', 'TIMEOUT');
      expect(error.name).toBe('WebSocketError');
    });
  });
});

describe('Error Inheritance', () => {
  it('ApiError should be instance of Error', () => {
    const error = new ApiError('Test', 500);
    expect(error instanceof Error).toBe(true);
  });

  it('NetworkError should be instance of Error', () => {
    const error = new NetworkError('Test');
    expect(error instanceof Error).toBe(true);
  });

  it('ValidationError should be instance of Error', () => {
    const error = new ValidationError('Test', []);
    expect(error instanceof Error).toBe(true);
  });

  it('should maintain error stack trace', () => {
    const error = new ApiError('Test', 500);
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});
