// API response and hook types
// Based on data-model.md

// Standard API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

// API error response
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, string[]>; // Validation errors
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Generic hook return types for queries (GET operations)
export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Generic hook return types for mutations (POST, PATCH, DELETE operations)
export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// Mutation options
export interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
  successMessage?: string;
}

// Query options
export interface QueryOptions {
  enabled?: boolean; // If false, don't auto-fetch on mount
  refetchInterval?: number; // Auto-refetch every N ms (optional)
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}
