// Error type hierarchy for the application
// Based on contracts/error-handling.md

// Base error class
export class AppError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// API-specific errors
export class ApiError extends AppError {
  details?: Record<string, string[]>;
  path?: string;

  constructor(
    message: string,
    statusCode: number,
    details?: Record<string, string[]>,
    path?: string,
  ) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'ApiError';
    this.details = details;
    this.path = path;
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
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.errors = errors;
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
  reconnecting: boolean;

  constructor(message: string, reconnecting: boolean = false) {
    super(message, 'WEBSOCKET_ERROR');
    this.name = 'WebSocketError';
    this.reconnecting = reconnecting;
  }
}
