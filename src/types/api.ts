// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  authingId: string;
  username?: string;
  email?: string;
  phone?: string;
  token?: string;
}

export interface LoginResponse extends User {
  expiresIn: string;
}

// Error Types
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}
