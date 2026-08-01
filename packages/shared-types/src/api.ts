/**
 * IEC 62443 API Request/Response Types
 *
 * Covers standardised API envelope types, pagination, filtering,
 * error details, and response metadata.
 */

// ---------------------------------------------------------------------------
// Response Meta
// ---------------------------------------------------------------------------

/**
 * Standard metadata included in every API response.
 */
export interface ResponseMeta {
  /** Unique identifier for the API request (for tracing). */
  requestId: string;
  /** ISO 8601 timestamp of the response. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Response Links
// ---------------------------------------------------------------------------

/**
 * HATEOAS-style navigation links for paginated responses.
 */
export interface ResponseLinks {
  /** URL of the current page. */
  self: string;
  /** URL of the next page (if any). */
  next?: string;
  /** URL of the previous page (if any). */
  prev?: string;
  /** URL of the last page. */
  last?: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Pagination state for a list response.
 */
export interface Pagination {
  /** Current page number (1-based). */
  page: number;
  /** Number of items per page. */
  perPage: number;
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages. */
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Field Error
// ---------------------------------------------------------------------------

/**
 * A validation error for a specific request field.
 */
export interface FieldError {
  /** Field path (e.g. "email", "assets[0].ipAddress"). */
  field: string;
  /** Human-readable error message. */
  message: string;
}

// ---------------------------------------------------------------------------
// Error Detail
// ---------------------------------------------------------------------------

/**
 * Structured error information returned in an error response.
 */
export interface ErrorDetail {
  /** Machine-readable error code (e.g. "VALIDATION_ERROR", "NOT_FOUND"). */
  code: string;
  /** Human-readable error message. */
  message: string;
  /** Field-level validation errors (if applicable). */
  details: FieldError[];
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

/**
 * Standard single-item API response envelope.
 */
export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
  links?: ResponseLinks;
}

/**
 * Standard list API response envelope with pagination.
 */
export interface ApiListResponse<T> {
  data: T[];
  pagination: Pagination;
  meta: ResponseMeta;
  links?: ResponseLinks;
}

/**
 * Standard API error response envelope.
 */
export interface ApiError {
  error: ErrorDetail;
  meta: ResponseMeta;
}

// ---------------------------------------------------------------------------
// Request Parameters
// ---------------------------------------------------------------------------

/**
 * Basic pagination parameters for list endpoints.
 */
export interface PaginationParams {
  /** Page number (1-based). Default: 1. */
  page?: number;
  /** Items per page. Default: 25. */
  perPage?: number;
  /** Sort field and direction (e.g. "createdAt:desc", "name:asc"). */
  sort?: string;
}

/**
 * Filter operator for advanced filtering.
 */
export interface FilterOperator {
  /** Comparison operator (e.g. "eq", "neq", "gt", "lt", "contains", "in"). */
  op: string;
  /** Value to compare against. */
  value: string;
}

/**
 * Filter parameters for list endpoints.
 */
export interface FilterParams {
  /** Map of field names to filter values or operator expressions. */
  filter: Record<string, string | FilterOperator>;
}

/**
 * Comprehensive query parameters for list endpoints, combining
 * pagination, filtering, searching, and field selection.
 */
export interface ListQueryParams {
  /** Page number (1-based). */
  page?: number;
  /** Items per page. */
  perPage?: number;
  /** Sort field and direction (e.g. "createdAt:desc"). */
  sort?: string;
  /** Field-level filters. */
  filter?: Record<string, string | FilterOperator>;
  /** Full-text search query. */
  search?: string;
  /** Related entities to include (e.g. "tenant", "zone"). */
  include?: string[];
  /** Specific fields to return (sparse fieldsets). */
  fields?: string[];
}
