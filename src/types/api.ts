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
  username: string;
  // id: string;
  // name: string;
  // email?: string;
  // avatar?: string;
  // role?: string;
  // permissions?: string[];
  // createdAt?: string;
  // updatedAt?: string;
}

export interface LoginResponse extends User {
  expiresIn: string;
}


export interface UserStatusResponse {
  isAuthenticated: boolean;
  user: User | null;
}

// Error Types
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}
