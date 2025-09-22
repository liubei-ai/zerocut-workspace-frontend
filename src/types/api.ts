// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Pagination Types
export interface PaginationResponse<T> extends Pagination {
  list: T[];
}

export interface User {
  authingId: string;
  username?: string;
  email?: string;
  phone?: string;
}

// Error Types
export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
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
  apiKey?: string; // 只在创建时返回完整密钥
  apiKeyPrefix: string; // 列表中显示的密钥前缀
  status: string;
  description: string;
  permissions: string[]; // 权限信息，当前为null
  lastUsedAt: string | null; // 最后使用时间
  expiresAt: string | null; // 过期时间
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    username: string | null;
    email: string;
  };
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
  settings?: Record<string, string>;
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
  expiresAt?: string;
}

// Consumption Record Types
export interface ConsumptionRecord {
  id: number;
  transactionId: string;
  serviceType?: string;
  serviceDetails?: Record<string, string>;
  creditsAmount: number;
  apiKeyId?: string;
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

// Homepage Types
export interface UserInfoDto {
  id: number;
  authingId: string;
  username?: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceOwnerDto {
  id: number;
  username?: string;
  email: string;
  role: string;
}

export interface UserWorkspaceDto {
  id: number;
  workspaceId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: WorkspaceOwnerDto;
  currentUserRole: string;
}

export interface HomepageResponseDto {
  user: UserInfoDto;
  workspaces: UserWorkspaceDto[];
}
