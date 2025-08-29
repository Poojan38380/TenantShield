// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
}

// Success response interface
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

// Pagination interface
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response interface
export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: PaginationMeta;
}
