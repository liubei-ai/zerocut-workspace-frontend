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

// Workspace Types
export interface WorkspaceOwner {
  id: number;
  username?: string;
  email: string;
  role: string;
}

export interface WorkspaceMember {
  id: number;
  username?: string;
  email: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
}

export interface WorkspaceAccount {
  id: number;
  creditsBalance: string;
  totalCreditsAdded: string;
  totalCreditsConsumed: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: number;
  name: string;
  apiKey: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  totalApiKeys: number;
  activeApiKeys: number;
}

export interface WorkspaceDetails {
  id: number;
  workspaceId: string;
  name: string;
  description: string;
  settings?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: WorkspaceOwner;
  currentUserRole: string;
  members: WorkspaceMember[];
  account: WorkspaceAccount;
  apiKeys: ApiKey[];
  stats: WorkspaceStats;
}

// User Profile Types
export interface UserProfile {
  id: number;
  authingId: string;
  username?: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Wallet Types
export interface WalletInfo {
  id: number;
  workspaceId: string;
  balance: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: string;
  description: string;
  status: string;
  createdAt: string;
}

// Statistics Types
export interface UserStatHourly {
  hour: string;
  requests: number;
  tokens: number;
  cost: string;
}

export interface UserStatDaily {
  date: string;
  requests: number;
  tokens: number;
  cost: string;
}

// Video Project Types
export interface VideoProject {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

// API Key Management Types
export interface CreateApiKeyRequest {
  name: string;
  description?: string;
}

export interface ApiKeyListResponse {
  apiKeys: ApiKey[];
  total: number;
}

// Consumption Record Types
export interface ConsumptionRecord {
  id: number;
  type: string;
  amount: string;
  description: string;
  createdAt: string;
}

// Recharge Record Types
export interface RechargeRecord {
  id: number;
  amount: string;
  status: string;
  method: string;
  createdAt: string;
}
