// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  timestamp: string;
  data: T;
  path?: string;
  details?: unknown;
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

export interface SyncedUser {
  id: number;
  role: UserRole;
  username?: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  newbieCreditsRecord?: RechargeRecord;
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
  lastUsedAt: string | null; // 最后使用时间
  expiresAt: string | null; // 过期时间
  rate: number; // 费率
  availableBalance?: number | null; // 可用余额（金额，派生；不限额时为 null）
  remainingBalance?: number | null; // 剩余可用余额（金额，派生；不限额时为 null）
  creditsLimit: number | null;
  creditsConsumed: number;
  remainingCredits?: number | null;
  isDefault: boolean;
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
  name?: string; // 用户真实姓名
  avatar?: string; // 用户头像URL
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

// Video Workflow Usage Records
export type VideoWorkflowSource = 'workflow' | 'api';

export interface ProjectOverviewItem {
  id: number;
  projectName: string;
  status?: string;
  createdAt: string;
  callCount: number;
  creditsConsumed: number;
  lastCalledAt?: string | null;
}

export interface VideoWorkflowRecordItem {
  id: number;
  type: string;
  status: string;
  param?: Record<string, any> | null;
  output?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  uid?: number;
  apiKey?: string;
  transactionId?: string;
  creditsAmount?: number;
}

export interface ProjectMeta {
  id: number;
  projectName: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecordsResponse extends PaginationResponse<VideoWorkflowRecordItem> {
  project: ProjectMeta;
}

// API Key Management Types
export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string;
  availableBalance?: number; // 可用余额（金额），留空=不限额
  rate: number; // 费率（>0，最多两位小数）
}

export interface UpdateApiKeyRequest {
  name?: string;
  expiresAt?: string | null;
  availableBalance?: number; // 费率只读，仅可改余额；后端用既有费率重算
}

// Consumption Record Types
export interface ConsumptionRecord {
  id: number;
  transactionId: string;
  prompt?: string;
  serviceDetails?: Record<string, any>;
  displayDetails?: {
    reason?: string;
    urls?: string[];
    prompt?: string;
    outputTokens?: number;
    taskId?: string;
  };
  creditsAmount: number;
  apiKeyId?: string;
  createdAt: string;
}

// 按 ApiKey / 子账号查询的金额化消费记录（最小安全子集：不含 prompt、urls）
export interface AmountConsumptionRecord {
  id: number;
  transactionId: string;
  amount: number; // 金额（两位小数）
  displayDetails?: {
    reason?: string;
    outputTokens?: number;
  };
  apiKeyId?: string;
  createdAt: string;
}

// 子账号会话信息
export interface SubAccountSessionInfo {
  workspaceId: string; // 16 位字符串工作空间标识符
  apiKeyMasked: string;
  scope: string;
  expiresAt: string;
}

export interface VoiceClone {
  id: number;
  workspaceId: string;
  voice_id: string;
  voice_name: string;
  demo_audio: string;
  createdAt: string;
  updatedAt: string;
}

// Recharge Record Types
export interface RechargeRecord {
  id: number;
  orderNo: string;
  thirdPartyOrderNo?: string;
  amount: string;
  creditsAmount: number;
  conversionRate: number;
  paymentMethod: string;
  status: string;
  paymentUrl?: string;
  paymentDetails?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  creditsValidityDays?: number;
}

export type UserRole = 'user' | 'super_admin' | 'ops_admin' | 'finance_admin' | 'support';

// Homepage Types
export interface UserInfoDto {
  id: number;
  role: UserRole;
  /** 后端下发的权限点列表，用于前端三级守卫 */
  permissions?: string[];
  username?: string;
  email?: string;
  phone?: string;
  name?: string; // 用户真实姓名
  avatar?: string; // 用户头像URL
  openid?: string;
  unionid?: string;
}

export interface WorkspaceOwnerDto {
  id: number;
  role: string;
  username?: string;
  email?: string;
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
