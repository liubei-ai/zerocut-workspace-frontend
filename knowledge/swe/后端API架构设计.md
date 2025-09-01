# Zerocut 后端API架构设计文档

## 📋 架构概览

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│              (Nginx + Rate Limiting)                   │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                      │
│   ┌─────────────┬─────────────┬─────────────────────┐   │
│   │ Auth Service│ Workspace   │ Business Data       │   │
│   │             │ Service     │ Service             │   │
│   └─────────────┴─────────────┴─────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                   Data Access Layer                     │
│   ┌─────────────┬─────────────┬─────────────────────┐   │
│   │ User        │ Workspace   │ Business Data       │   │
│   │ Repository  │ Repository  │ Repository          │   │
│   └─────────────┴─────────────┴─────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                   Storage Layer                         │
│   ┌─────────────┬─────────────┬─────────────────────┐   │
│   │ PostgreSQL  │ Redis       │ File Storage        │   │
│   │ (主数据库)   │ (缓存)      │ (静态资源)           │   │
│   └─────────────┴─────────────┴─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 技术栈选型

```json
{
  "运行时环境": {
    "Node.js": "20 LTS",
    "TypeScript": "5.x",
    "包管理器": "npm/pnpm"
  },
  "Web框架": {
    "主选方案": "Express.js 4.x",
    "备选方案": "Fastify 4.x",
    "选择理由": "Express生态成熟，中间件丰富"
  },
  "数据库": {
    "主数据库": "PostgreSQL 17",
    "缓存数据库": "Redis 7.x",
    "ORM": "TypeORM 0.3.17+"
  },
  "认证授权": {
    "JWT": "jsonwebtoken",
    "密码加密": "bcrypt",
    "会话管理": "express-session + Redis"
  },
  "数据验证": {
    "请求验证": "Joi",
    "类型安全": "TypeScript"
  },
  "文档工具": {
    "API文档": "Swagger/OpenAPI 3.0",
    "自动生成": "swagger-jsdoc + swagger-ui-express"
  },
  "监控日志": {
    "日志框架": "Winston",
    "性能监控": "Prometheus + Grafana",
    "错误追踪": "Sentry"
  }
}
```

## 🏗 项目结构设计

### 目录结构

```
backend/
├── src/
│   ├── controllers/          # 控制器层
│   │   ├── auth.controller.ts
│   │   ├── workspace.controller.ts
│   │   ├── user.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── account.controller.ts
│   │   └── config.controller.ts
│   ├── services/             # 业务逻辑层
│   │   ├── auth.service.ts
│   │   ├── workspace.service.ts
│   │   ├── user.service.ts
│   │   ├── email.service.ts
│   │   ├── payment.service.ts
│   │   └── notification.service.ts
│   ├── repositories/         # 数据访问层
│   │   ├── user.repository.ts
│   │   ├── workspace.repository.ts
│   │   ├── account.repository.ts
│   │   └── base.repository.ts
│   ├── middleware/           # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── permission.middleware.ts
│   ├── routes/               # 路由定义
│   │   ├── auth.routes.ts
│   │   ├── workspace.routes.ts
│   │   ├── user.routes.ts
│   │   ├── dashboard.routes.ts
│   │   └── index.ts
│   ├── models/               # 数据模型
│   │   ├── user.model.ts
│   │   ├── workspace.model.ts
│   │   ├── account.model.ts
│   │   └── index.ts
│   ├── types/                # TypeScript类型定义
│   │   ├── auth.types.ts
│   │   ├── workspace.types.ts
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   ├── utils/                # 工具函数
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   ├── validation.ts
│   │   ├── email.ts
│   │   └── response.ts
│   ├── config/               # 配置文件
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   └── app.ts
│   ├── entities/             # TypeORM实体
│   │   ├── User.entity.ts
│   │   ├── Workspace.entity.ts
│   │   └── index.ts
│   ├── migrations/           # 数据库迁移文件
│   │   └── *.ts
│   │   ├── migrations/
│   │   └── seed.ts
│   └── app.ts                # 应用入口
├── tests/                    # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                     # 文档
│   ├── api.md
│   └── deployment.md
├── scripts/                  # 脚本文件
│   ├── build.sh
│   ├── deploy.sh
│   └── migrate.sh
├── .env.example              # 环境变量示例
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
├── Dockerfile
└── docker-compose.yml
```

## 🔐 认证授权架构

### JWT Token 策略

```typescript
// JWT配置
interface JWTConfig {
  accessToken: {
    secret: string;
    expiresIn: '15m'; // 15分钟
    algorithm: 'HS256';
  };
  refreshToken: {
    secret: string;
    expiresIn: '7d'; // 7天
    algorithm: 'HS256';
  };
}

// Token载荷结构
interface JWTPayload {
  userId: number;
  email: string;
  workspaceId?: number;
  permissions: string[];
  iat: number;
  exp: number;
}

// 认证中间件
class AuthMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  static async verifyWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    const hasAccess = await WorkspaceService.checkUserAccess(userId, workspaceId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Workspace access denied' });
    }

    next();
  }
}
```

### 权限控制模型

```typescript
// 权限枚举
enum Permission {
  // 工作空间权限
  WORKSPACE_READ = 'workspace:read',
  WORKSPACE_WRITE = 'workspace:write',
  WORKSPACE_DELETE = 'workspace:delete',

  // 成员管理权限
  MEMBER_INVITE = 'member:invite',
  MEMBER_REMOVE = 'member:remove',
  MEMBER_ROLE_CHANGE = 'member:role_change',

  // 财务权限
  FINANCE_READ = 'finance:read',
  FINANCE_WRITE = 'finance:write',

  // API密钥权限
  API_KEY_CREATE = 'api_key:create',
  API_KEY_DELETE = 'api_key:delete',

  // 配置权限
  CONFIG_READ = 'config:read',
  CONFIG_WRITE = 'config:write',
}

// 角色权限映射
const ROLE_PERMISSIONS = {
  super_admin: [
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_WRITE,
    Permission.WORKSPACE_DELETE,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_REMOVE,
    Permission.MEMBER_ROLE_CHANGE,
    Permission.FINANCE_READ,
    Permission.FINANCE_WRITE,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_DELETE,
    Permission.CONFIG_READ,
    Permission.CONFIG_WRITE,
  ],
  normal_user: [
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_WRITE,
    Permission.FINANCE_READ,
    Permission.API_KEY_CREATE,
    Permission.CONFIG_READ,
    Permission.CONFIG_WRITE,
  ],
  readonly_user: [Permission.WORKSPACE_READ, Permission.FINANCE_READ, Permission.CONFIG_READ],
};

// 权限验证装饰器
function RequirePermission(permission: Permission) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const req = args[0] as Request;
      const res = args[1] as Response;

      const userPermissions = req.user.permissions;
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      return method.apply(this, args);
    };
  };
}
```

## 📡 API 接口设计

### RESTful API 规范

```typescript
// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}

// 响应工具类
class ResponseUtil {
  static success<T>(data: T, meta?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }

  static error(code: string, message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }

  static paginated<T>(data: T[], pagination: PaginationInfo): ApiResponse<T[]> {
    return {
      success: true,
      data,
      meta: {
        pagination,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }
}
```

### 核心API接口实现

#### 1. 认证服务 API

```typescript
// auth.controller.ts
@Controller('/api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @ValidateBody(RegisterSchema)
  async register(@Body() body: RegisterDto): Promise<ApiResponse<AuthResponse>> {
    try {
      const result = await this.authService.register(body);
      return ResponseUtil.success(result);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/login')
  @ValidateBody(LoginSchema)
  async login(@Body() body: LoginDto): Promise<ApiResponse<AuthResponse>> {
    try {
      const result = await this.authService.login(body);
      return ResponseUtil.success(result);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('/refresh')
  @ValidateBody(RefreshTokenSchema)
  async refreshToken(@Body() body: RefreshTokenDto): Promise<ApiResponse<TokenResponse>> {
    try {
      const result = await this.authService.refreshToken(body.refreshToken);
      return ResponseUtil.success(result);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('/forgot-password')
  @ValidateBody(ForgotPasswordSchema)
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.authService.forgotPassword(body.email);
      return ResponseUtil.success({ message: 'Password reset email sent' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/reset-password')
  @ValidateBody(ResetPasswordSchema)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.authService.resetPassword(body.token, body.password);
      return ResponseUtil.success({ message: 'Password reset successfully' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/logout')
  @UseGuards(AuthGuard)
  async logout(@User() user: JWTPayload): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.authService.logout(user.userId);
      return ResponseUtil.success({ message: 'Logged out successfully' });
    } catch (error) {
      throw new InternalServerErrorException('Logout failed');
    }
  }
}

// 数据传输对象
interface RegisterDto {
  email: string;
  password: string;
  username: string;
  phone?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface AuthResponse {
  user: UserProfile;
  workspace: WorkspaceInfo;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

#### 2. 工作空间服务 API

```typescript
// workspace.controller.ts
@Controller('/api/workspaces')
@UseGuards(AuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Get('/')
  async getUserWorkspaces(@User() user: JWTPayload): Promise<ApiResponse<WorkspaceInfo[]>> {
    try {
      const workspaces = await this.workspaceService.getUserWorkspaces(user.userId);
      return ResponseUtil.success(workspaces);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch workspaces');
    }
  }

  @Post('/')
  @ValidateBody(CreateWorkspaceSchema)
  async createWorkspace(
    @User() user: JWTPayload,
    @Body() body: CreateWorkspaceDto
  ): Promise<ApiResponse<WorkspaceInfo>> {
    try {
      const workspace = await this.workspaceService.createWorkspace(user.userId, body);
      return ResponseUtil.success(workspace);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/:id')
  @UseGuards(WorkspaceAccessGuard)
  async getWorkspace(@Param('id') id: string): Promise<ApiResponse<WorkspaceDetail>> {
    try {
      const workspace = await this.workspaceService.getWorkspaceDetail(parseInt(id));
      return ResponseUtil.success(workspace);
    } catch (error) {
      throw new NotFoundException('Workspace not found');
    }
  }

  @Put('/:id')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission(Permission.WORKSPACE_WRITE)
  @ValidateBody(UpdateWorkspaceSchema)
  async updateWorkspace(
    @Param('id') id: string,
    @Body() body: UpdateWorkspaceDto
  ): Promise<ApiResponse<WorkspaceInfo>> {
    try {
      const workspace = await this.workspaceService.updateWorkspace(parseInt(id), body);
      return ResponseUtil.success(workspace);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('/:id')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission(Permission.WORKSPACE_DELETE)
  async deleteWorkspace(@Param('id') id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.workspaceService.deleteWorkspace(parseInt(id));
      return ResponseUtil.success({ message: 'Workspace deleted successfully' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 成员管理
  @Get('/:id/members')
  @UseGuards(WorkspaceAccessGuard)
  async getWorkspaceMembers(@Param('id') id: string): Promise<ApiResponse<WorkspaceMember[]>> {
    try {
      const members = await this.workspaceService.getWorkspaceMembers(parseInt(id));
      return ResponseUtil.success(members);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch members');
    }
  }

  @Post('/:id/invite')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission(Permission.MEMBER_INVITE)
  @ValidateBody(InviteUserSchema)
  async inviteUser(
    @Param('id') id: string,
    @User() user: JWTPayload,
    @Body() body: InviteUserDto
  ): Promise<ApiResponse<Invitation>> {
    try {
      const invitation = await this.workspaceService.inviteUser(parseInt(id), user.userId, body);
      return ResponseUtil.success(invitation);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/:id/invitations')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission(Permission.MEMBER_INVITE)
  async getWorkspaceInvitations(@Param('id') id: string): Promise<ApiResponse<Invitation[]>> {
    try {
      const invitations = await this.workspaceService.getWorkspaceInvitations(parseInt(id));
      return ResponseUtil.success(invitations);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch invitations');
    }
  }

  @Put('/:id/members/:userId')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission(Permission.MEMBER_ROLE_CHANGE)
  @ValidateBody(UpdateMemberRoleSchema)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleDto
  ): Promise<ApiResponse<WorkspaceMember>> {
    try {
      const member = await this.workspaceService.updateMemberRole(parseInt(id), parseInt(userId), body.role);
      return ResponseUtil.success(member);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('/:id/members/:userId')
  @UseGuards(WorkspaceAccessGuard)
  @RequirePermission(Permission.MEMBER_REMOVE)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.workspaceService.removeMember(parseInt(id), parseInt(userId));
      return ResponseUtil.success({ message: 'Member removed successfully' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
```

#### 3. 邀请管理 API

```typescript
// invitation.controller.ts
@Controller('/api/invitations')
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  @Get('/token/:token')
  async getInvitationByToken(@Param('token') token: string): Promise<ApiResponse<InvitationDetail>> {
    try {
      const invitation = await this.invitationService.getInvitationByToken(token);
      return ResponseUtil.success(invitation);
    } catch (error) {
      throw new NotFoundException('Invitation not found or expired');
    }
  }

  @Post('/:id/accept')
  @UseGuards(AuthGuard)
  async acceptInvitation(
    @Param('id') id: string,
    @User() user: JWTPayload
  ): Promise<ApiResponse<{ workspace: WorkspaceInfo; member: WorkspaceMember }>> {
    try {
      const result = await this.invitationService.acceptInvitation(parseInt(id), user.userId);
      return ResponseUtil.success(result);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/:id/reject')
  @UseGuards(AuthGuard)
  async rejectInvitation(@Param('id') id: string, @User() user: JWTPayload): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.invitationService.rejectInvitation(parseInt(id), user.userId);
      return ResponseUtil.success({ message: 'Invitation rejected' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  async revokeInvitation(@Param('id') id: string, @User() user: JWTPayload): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.invitationService.revokeInvitation(parseInt(id), user.userId);
      return ResponseUtil.success({ message: 'Invitation revoked' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/:id/resend')
  @UseGuards(AuthGuard)
  async resendInvitation(@Param('id') id: string, @User() user: JWTPayload): Promise<ApiResponse<{ message: string }>> {
    try {
      await this.invitationService.resendInvitation(parseInt(id), user.userId);
      return ResponseUtil.success({ message: 'Invitation resent' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
```

#### 4. 业务数据 API

```typescript
// dashboard.controller.ts
@Controller('/api/dashboard')
@UseGuards(AuthGuard, WorkspaceAccessGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('/stats')
  async getDashboardStats(@Query('workspaceId') workspaceId: string): Promise<ApiResponse<DashboardStats>> {
    try {
      const stats = await this.dashboardService.getDashboardStats(parseInt(workspaceId));
      return ResponseUtil.success(stats);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch dashboard stats');
    }
  }

  @Get('/usage-trends')
  async getUsageTrends(
    @Query('workspaceId') workspaceId: string,
    @Query('period') period: string = '7d'
  ): Promise<ApiResponse<UsageTrend[]>> {
    try {
      const trends = await this.dashboardService.getUsageTrends(parseInt(workspaceId), period);
      return ResponseUtil.success(trends);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch usage trends');
    }
  }

  @Get('/real-time-stats')
  async getRealTimeStats(@Query('workspaceId') workspaceId: string): Promise<ApiResponse<RealTimeStats>> {
    try {
      const stats = await this.dashboardService.getRealTimeStats(parseInt(workspaceId));
      return ResponseUtil.success(stats);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch real-time stats');
    }
  }
}

// account.controller.ts
@Controller('/api/account')
@UseGuards(AuthGuard, WorkspaceAccessGuard)
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Get('/balance')
  async getAccountBalance(@Query('workspaceId') workspaceId: string): Promise<ApiResponse<AccountBalance>> {
    try {
      const balance = await this.accountService.getAccountBalance(parseInt(workspaceId));
      return ResponseUtil.success(balance);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch account balance');
    }
  }

  @Get('/recharge-records')
  async getRechargeRecords(
    @Query('workspaceId') workspaceId: string,
    @Query() query: PaginationQuery
  ): Promise<ApiResponse<RechargeRecord[]>> {
    try {
      const records = await this.accountService.getRechargeRecords(parseInt(workspaceId), query);
      return ResponseUtil.paginated(records.data, records.pagination);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch recharge records');
    }
  }

  @Post('/recharge')
  @RequirePermission(Permission.FINANCE_WRITE)
  @ValidateBody(CreateRechargeSchema)
  async createRecharge(
    @Query('workspaceId') workspaceId: string,
    @Body() body: CreateRechargeDto
  ): Promise<ApiResponse<RechargeRecord>> {
    try {
      const recharge = await this.accountService.createRecharge(parseInt(workspaceId), body);
      return ResponseUtil.success(recharge);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('/consumption-records')
  async getConsumptionRecords(
    @Query('workspaceId') workspaceId: string,
    @Query() query: PaginationQuery & DateRangeQuery
  ): Promise<ApiResponse<ConsumptionRecord[]>> {
    try {
      const records = await this.accountService.getConsumptionRecords(parseInt(workspaceId), query);
      return ResponseUtil.paginated(records.data, records.pagination);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch consumption records');
    }
  }
}
```

## 🗄 数据访问层设计

### Repository 模式实现

```typescript
// base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(this.getEntity());
  }

  protected abstract getEntity(): EntityTarget<T>;
  protected repository: Repository<T>;

  abstract create(data: any): Promise<T>;
  abstract findById(id: number): Promise<T | null>;
  abstract update(id: number, data: any): Promise<T>;
  abstract delete(id: number): Promise<void>;
  abstract findMany(options?: any): Promise<T[]>;

  protected async executeTransaction<R>(fn: (manager: EntityManager) => Promise<R>): Promise<R> {
    return await this.dataSource.transaction(fn);
  }

  protected buildPaginationQuery(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
    };
  }

  protected async countTotal(where?: any): Promise<number> {
    return await this.repository.count({ where });
  }

  protected abstract getModelName(): string;
}

// user.repository.ts
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/User.entity';

export class UserRepository extends BaseRepository<User> {
  protected getEntity() {
    return User;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = this.repository.create({
      email: data.email,
      passwordHash: data.passwordHash,
      username: data.username,
      phone: data.phone,
    });
    return await this.repository.save(user);
  }

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: {
        userWorkspaces: {
          workspace: true,
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  async update(id: number, data: UpdateUserData): Promise<User | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.update(id, { status: 'deleted' });
  }

  async findMany(options?: FindUsersOptions): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (options?.where) {
      queryBuilder.where(options.where);
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    queryBuilder.skip((page - 1) * limit).take(limit);

    const orderBy = options?.orderBy || { createdAt: 'DESC' };
    Object.entries(orderBy).forEach(([field, direction]) => {
      queryBuilder.addOrderBy(`user.${field}`, direction as 'ASC' | 'DESC');
    });

    return await queryBuilder.getMany();
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.repository.update(id, { lastLoginAt: new Date() });
  }

  async incrementLoginAttempts(id: number): Promise<void> {
    await this.repository.increment({ id }, 'loginAttempts', 1);
  }

  async resetLoginAttempts(id: number): Promise<void> {
    await this.repository.update(id, {
      loginAttempts: 0,
      lockedUntil: null,
    });
  }

  async lockUser(id: number, lockDuration: number): Promise<void> {
    const lockedUntil = new Date(Date.now() + lockDuration);
    await this.repository.update(id, {
      lockedUntil,
      status: 'locked',
    });
  }
}

// workspace.repository.ts
export class WorkspaceRepository extends BaseRepository<Workspace> {
  protected getModelName(): string {
    return 'workspace';
  }

  async create(data: CreateWorkspaceData): Promise<Workspace> {
    return await this.executeTransaction(async manager => {
      // 创建工作空间
      const workspace = manager.create(Workspace, {
        userId: data.userId,
        name: data.name,
        code: data.code,
        description: data.description,
        isDefault: data.isDefault,
      });
      const savedWorkspace = await manager.save(workspace);

      // 创建用户工作空间关联
      const userWorkspace = manager.create(UserWorkspace, {
        userId: data.userId,
        workspaceId: savedWorkspace.id,
        role: 'super_admin',
        isOwner: true,
      });
      await manager.save(userWorkspace);

      // 创建账户
      const account = manager.create(Account, {
        workspaceId: savedWorkspace.id,
      });
      await manager.save(account);

      return savedWorkspace;
    });
  }

  async findById(id: number): Promise<Workspace | null> {
    return await this.repository.findOne({
      where: { id },
      relations: {
        account: true,
        members: {
          user: true,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isDefault: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        account: true,
        members: {
          id: true,
          role: true,
          isOwner: true,
          user: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: number): Promise<Workspace[]> {
    const userWorkspaceRepo = this.dataSource.getRepository(UserWorkspace);
    const userWorkspaces = await userWorkspaceRepo.find({
      where: {
        userId,
        status: 'active',
      },
      relations: {
        workspace: {
          account: true,
        },
      },
    });

    return userWorkspaces.map(uw => uw.workspace);
  }

  async update(id: number, data: UpdateWorkspaceData): Promise<Workspace> {
    await this.repository.update({ id }, data);
    const updatedWorkspace = await this.repository.findOne({ where: { id } });
    if (!updatedWorkspace) {
      throw new Error('Workspace not found after update');
    }
    return updatedWorkspace;
  }

  async delete(id: number): Promise<void> {
    await this.repository.update({ id }, { status: 'deleted' });
  }

  async findMany(options?: FindWorkspacesOptions): Promise<Workspace[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('workspace')
      .leftJoinAndSelect('workspace.account', 'account')
      .loadRelationCountAndMap('workspace.membersCount', 'workspace.members')
      .loadRelationCountAndMap('workspace.apiKeysCount', 'workspace.apiKeys');

    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`workspace.${key} = :${key}`, { [key]: value });
      });
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    queryBuilder.skip((page - 1) * limit).take(limit);

    const orderBy = options?.orderBy || { createdAt: 'DESC' };
    Object.entries(orderBy).forEach(([key, direction]) => {
      queryBuilder.addOrderBy(`workspace.${key}`, direction as 'ASC' | 'DESC');
    });

    return await queryBuilder.getMany();
  }

  async checkUserAccess(userId: number, workspaceId: number): Promise<boolean> {
    const userWorkspaceRepo = this.dataSource.getRepository(UserWorkspace);
    const userWorkspace = await userWorkspaceRepo.findOne({
      where: {
        userId,
        workspaceId,
        status: 'active',
      },
    });

    return !!userWorkspace;
  }

  async getUserRole(userId: number, workspaceId: number): Promise<string | null> {
    const userWorkspaceRepo = this.dataSource.getRepository(UserWorkspace);
    const userWorkspace = await userWorkspaceRepo.findOne({
      where: {
        userId,
        workspaceId,
        status: 'active',
      },
    });

    return userWorkspace?.role || null;
  }
}
```

## 🔧 服务层设计

### 业务逻辑服务

```typescript
// auth.service.ts
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private workspaceRepository: WorkspaceRepository,
    private emailService: EmailService,
    private redisClient: Redis
  ) {}

  async register(data: RegisterDto): Promise<AuthResponse> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 创建用户和默认工作空间
    const user = await this.userRepository.create({
      email: data.email,
      passwordHash,
      username: data.username,
      phone: data.phone,
    });

    // 创建默认工作空间
    const workspaceCode = `ws_${user.id}_${Date.now()}`;
    const workspace = await this.workspaceRepository.create({
      userId: user.id,
      name: `${data.username}的工作空间`,
      code: workspaceCode,
      isDefault: true,
    });

    // 生成 tokens
    const tokens = await this.generateTokens(user.id, user.email, workspace.id);

    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(user.email, user.username);

    return {
      user: this.mapUserToProfile(user),
      workspace: this.mapWorkspaceToInfo(workspace),
      tokens,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // 查找用户
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 检查账户状态
    if (user.status === 'locked' && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is locked');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.userRepository.incrementLoginAttempts(user.id);

      // 检查是否需要锁定账户
      if (user.loginAttempts >= 4) {
        await this.userRepository.lockUser(user.id, 30 * 60 * 1000); // 锁定30分钟
      }

      throw new Error('Invalid credentials');
    }

    // 重置登录尝试次数
    await this.userRepository.resetLoginAttempts(user.id);
    await this.userRepository.updateLastLogin(user.id);

    // 获取用户工作空间
    const workspaces = await this.workspaceRepository.findByUserId(user.id);
    const defaultWorkspace = workspaces.find(w => w.isDefault) || workspaces[0];

    // 生成 tokens
    const tokens = await this.generateTokens(user.id, user.email, defaultWorkspace.id);

    return {
      user: this.mapUserToProfile(user),
      workspace: this.mapWorkspaceToInfo(defaultWorkspace),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JWTPayload;

      // 检查 token 是否在黑名单中
      const isBlacklisted = await this.redisClient.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new Error('Token is blacklisted');
      }

      // 生成新的 access token
      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          workspaceId: decoded.workspaceId,
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return;
    }

    // 生成重置 token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    // 存储重置 token
    await this.redisClient.setex(`reset:${resetToken}`, 3600, JSON.stringify({ userId: user.id, email: user.email }));

    // 发送重置邮件
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 验证重置 token
    const tokenData = await this.redisClient.get(`reset:${token}`);
    if (!tokenData) {
      throw new Error('Invalid or expired reset token');
    }

    const { userId } = JSON.parse(tokenData);

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await this.userRepository.update(userId, { passwordHash });

    // 删除重置 token
    await this.redisClient.del(`reset:${token}`);

    // 使所有现有 token 失效（可选）
    // await this.invalidateAllUserTokens(userId);
  }

  async logout(userId: number): Promise<void> {
    // 将用户的所有 refresh token 加入黑名单
    // 这里可以实现更复杂的 token 管理逻辑
    await this.redisClient.setex(`user_logout:${userId}`, 7 * 24 * 60 * 60, 'true');
  }

  private async generateTokens(userId: number, email: string, workspaceId: number): Promise<TokenResponse> {
    const payload = {
      userId,
      email,
      workspaceId,
    };

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
    };
  }

  private mapUserToProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    };
  }

  private mapWorkspaceToInfo(workspace: Workspace): WorkspaceInfo {
    return {
      id: workspace.id,
      name: workspace.name,
      code: workspace.code,
      description: workspace.description,
      isDefault: workspace.isDefault,
      createdAt: workspace.createdAt,
    };
  }
}
```

## 📊 缓存策略设计

### Redis 缓存实现

```typescript
// cache.service.ts
export class CacheService {
  constructor(private redisClient: Redis) {}

  // 用户信息缓存
  async cacheUser(userId: number, user: User, ttl: number = 3600): Promise<void> {
    const key = `user:${userId}`;
    await this.redisClient.setex(key, ttl, JSON.stringify(user));
  }

  async getCachedUser(userId: number): Promise<User | null> {
    const key = `user:${userId}`;
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 工作空间权限缓存
  async cacheUserWorkspacePermissions(
    userId: number,
    workspaceId: number,
    permissions: string[],
    ttl: number = 1800
  ): Promise<void> {
    const key = `permissions:${userId}:${workspaceId}`;
    await this.redisClient.setex(key, ttl, JSON.stringify(permissions));
  }

  async getCachedUserWorkspacePermissions(userId: number, workspaceId: number): Promise<string[] | null> {
    const key = `permissions:${userId}:${workspaceId}`;
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 统计数据缓存
  async cacheDashboardStats(workspaceId: number, stats: DashboardStats, ttl: number = 300): Promise<void> {
    const key = `dashboard:${workspaceId}`;
    await this.redisClient.setex(key, ttl, JSON.stringify(stats));
  }

  async getCachedDashboardStats(workspaceId: number): Promise<DashboardStats | null> {
    const key = `dashboard:${workspaceId}`;
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 清除缓存
  async clearUserCache(userId: number): Promise<void> {
    const pattern = `user:${userId}*`;
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  async clearWorkspaceCache(workspaceId: number): Promise<void> {
    const patterns = [`dashboard:${workspaceId}*`, `permissions:*:${workspaceId}*`, `workspace:${workspaceId}*`];

    for (const pattern of patterns) {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    }
  }

  // 分布式锁
  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redisClient.set(lockKey, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.redisClient.del(lockKey);
  }
}
```

## 🔍 数据验证设计

### Joi 验证模式

```typescript
// validation/schemas.ts
import Joi from 'joi';

// 用户注册验证
export const RegisterSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': '密码至少需要8个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      'any.required': '密码是必填项',
    }),
  username: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .required()
    .messages({
      'string.min': '用户名至少需要2个字符',
      'string.max': '用户名不能超过50个字符',
      'string.pattern.base': '用户名只能包含字母、数字、下划线和中文',
      'any.required': '用户名是必填项',
    }),
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern.base': '请输入有效的手机号码',
    }),
});

// 用户登录验证
export const LoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项',
  }),
  password: Joi.string().required().messages({
    'any.required': '密码是必填项',
  }),
});

// 工作空间创建验证
export const CreateWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': '工作空间名称至少需要2个字符',
    'string.max': '工作空间名称不能超过100个字符',
    'any.required': '工作空间名称是必填项',
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': '描述不能超过500个字符',
  }),
});

// 邀请用户验证
export const InviteUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱是必填项',
  }),
  role: Joi.string().valid('super_admin', 'normal_user', 'readonly_user').required().messages({
    'any.only': '角色必须是 super_admin、normal_user 或 readonly_user 之一',
    'any.required': '角色是必填项',
  }),
  message: Joi.string().max(200).optional().messages({
    'string.max': '邀请消息不能超过200个字符',
  }),
});

// 分页查询验证
export const PaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': '页码必须是整数',
    'number.min': '页码必须大于0',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.integer': '每页数量必须是整数',
    'number.min': '每页数量必须大于0',
    'number.max': '每页数量不能超过100',
  }),
});

// 验证中间件
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json(ResponseUtil.error('VALIDATION_ERROR', '请求数据验证失败', errors));
    }

    req.body = value;
    next();
  };
}

export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json(ResponseUtil.error('VALIDATION_ERROR', '查询参数验证失败', errors));
    }

    req.query = value;
    next();
  };
}
```

## 📝 日志与监控

### Winston 日志配置

```typescript
// utils/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'zerocut-api' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    // 错误日志文件
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // 所有日志文件
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// 请求日志中间件
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.userId,
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
}

export default logger;
```

### 性能监控配置

```typescript
// monitoring/metrics.ts
import prometheus from 'prom-client';

// 创建指标收集器
const register = new prometheus.Registry();

// HTTP请求计数器
const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP请求持续时间
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// 数据库连接池指标
const dbConnectionsActive = new prometheus.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Redis连接指标
const redisConnectionsActive = new prometheus.Gauge({
  name: 'redis_connections_active',
  help: 'Number of active Redis connections',
  registers: [register],
});

// 业务指标
const userRegistrations = new prometheus.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register],
});

const workspaceCreations = new prometheus.Counter({
  name: 'workspace_creations_total',
  help: 'Total number of workspace creations',
  registers: [register],
});

// 监控中间件
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
}

export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  dbConnectionsActive,
  redisConnectionsActive,
  userRegistrations,
  workspaceCreations,
};
```

## 🚀 部署配置

### Docker 配置

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/
COPY entities/ ./entities/
COPY migrations/ ./migrations/

# 构建 TypeORM 实体
RUN npm run build

# 构建应用
RUN npm run build

# 生产镜像
FROM node:20-alpine AS production

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/entities ./entities
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations

# 创建日志目录
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

CMD ["node", "dist/app.js"]
```

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API 服务
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/zerocut
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - zerocut-network

  # PostgreSQL 数据库
  postgres:
    image: postgres:17-alpine
    environment:
      - POSTGRES_DB=zerocut
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database_schema.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - zerocut-network

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - zerocut-network

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - zerocut-network

  # Prometheus 监控
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - zerocut-network

  # Grafana 可视化
  grafana:
    image: grafana/grafana:latest
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - zerocut-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  zerocut-network:
    driver: bridge
```

### Nginx 配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    server {
        listen 80;
        server_name localhost;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API 代理
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 超时配置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # 认证接口特殊限流
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;

            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 健康检查
        location /health {
            proxy_pass http://api/health;
            access_log off;
        }

        # 静态文件
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 🧪 测试策略

### Jest 测试配置

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/app.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};

// tests/setup.ts
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { User, Workspace, UserWorkspace, Account } from '../src/entities';

// 测试数据库配置
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5433/zerocut_test',
  entities: [User, Workspace, UserWorkspace, Account],
  synchronize: true,
  dropSchema: true,
  logging: false,
});

// 测试 Redis 配置
const redis = new Redis({
  host: 'localhost',
  port: 6380,
  db: 1,
});

// 全局测试设置
beforeAll(async () => {
  // 初始化数据库连接
  await dataSource.initialize();

  // 清理测试 Redis
  await redis.flushdb();
});

afterAll(async () => {
  await dataSource.destroy();
  await redis.disconnect();
});

beforeEach(async () => {
  // 每个测试前清理数据
  await dataSource.getRepository(UserWorkspace).clear();
  await dataSource.getRepository(Account).clear();
  await dataSource.getRepository(Workspace).clear();
  await dataSource.getRepository(User).clear();
  await redis.flushdb();
});

export { dataSource, redis };
```

### 单元测试示例

```typescript
// tests/unit/auth.service.test.ts
import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { WorkspaceRepository } from '../../src/repositories/workspace.repository';
import { EmailService } from '../../src/services/email.service';
import { dataSource, redis } from '../setup';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let workspaceRepository: WorkspaceRepository;
  let emailService: EmailService;

  beforeEach(() => {
    userRepository = new UserRepository(dataSource);
    workspaceRepository = new WorkspaceRepository(dataSource);
    emailService = new EmailService();
    authService = new AuthService(userRepository, workspaceRepository, emailService, redis);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        username: 'testuser',
      };

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('workspace');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.username).toBe(registerData.username);
    });

    it('should throw error if email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'Test123!@#',
        username: 'testuser',
      };

      // 先创建一个用户
      await authService.register(registerData);

      // 尝试用相同邮箱再次注册
      await expect(authService.register(registerData)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // 创建测试用户
      await authService.register({
        email: 'login@example.com',
        password: 'Test123!@#',
        username: 'loginuser',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Test123!@#',
      };

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('workspace');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(loginData.email);
    });

    it('should throw error with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### 集成测试示例

```typescript
// tests/integration/auth.controller.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../setup';

describe('Auth Controller Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'integration@example.com',
        password: 'Test123!@#',
        username: 'integrationuser',
      };

      const response = await request(app).post('/api/auth/register').send(registerData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(registerData.email);
    });

    it('should return validation error for invalid email', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        username: 'testuser',
      };

      const response = await request(app).post('/api/auth/register').send(registerData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 创建测试用户
      await request(app).post('/api/auth/register').send({
        email: 'logintest@example.com',
        password: 'Test123!@#',
        username: 'logintest',
      });
    });

    it('should login successfully', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'Test123!@#',
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });
  });
});
```

## 📋 开发时间线

### 第一阶段：基础架构搭建 (1-2周)

- [x] 项目初始化和依赖安装
- [x] TypeScript 配置
- [x] 数据库连接和 Prisma 配置
- [x] Redis 连接配置
- [x] 基础中间件实现
- [x] 日志系统配置
- [x] 错误处理机制

### 第二阶段：认证授权模块 (1-2周)

- [ ] JWT 认证实现
- [ ] 用户注册/登录 API
- [ ] 密码重置功能
- [ ] 权限控制中间件
- [ ] 会话管理
- [ ] 安全策略实施

### 第三阶段：核心业务模块 (2-3周)

- [ ] 工作空间管理 API
- [ ] 用户管理 API
- [ ] 邀请系统实现
- [ ] 角色权限管理
- [ ] 数据统计 API
- [ ] 账户财务 API

### 第四阶段：高级功能 (1-2周)

- [ ] API 密钥管理
- [ ] 配置管理系统
- [ ] 实时数据推送
- [ ] 文件上传处理
- [ ] 邮件通知系统

### 第五阶段：性能优化 (1周)

- [ ] 缓存策略实施
- [ ] 数据库查询优化
- [ ] API 响应时间优化
- [ ] 并发处理优化

### 第六阶段：测试和部署 (1-2周)

- [ ] 单元测试编写
- [ ] 集成测试实施
- [ ] API 文档生成
- [ ] Docker 容器化
- [ ] CI/CD 流水线
- [ ] 生产环境部署

## 🎯 验收标准

### 功能验收

- ✅ 所有 API 接口正常工作
- ✅ 认证授权机制完善
- ✅ 数据验证和错误处理完整
- ✅ 业务逻辑正确实现
- ✅ 权限控制精确有效

### 性能验收

- ✅ API 响应时间 < 200ms (95%)
- ✅ 并发处理能力 > 1000 QPS
- ✅ 数据库查询优化完成
- ✅ 缓存命中率 > 80%

### 安全验收

- ✅ 所有输入数据验证
- ✅ SQL 注入防护
- ✅ XSS 攻击防护
- ✅ CSRF 攻击防护
- ✅ 敏感数据加密存储

### 可维护性验收

- ✅ 代码覆盖率 > 80%
- ✅ API 文档完整
- ✅ 错误日志详细
- ✅ 监控指标完善
- ✅ 部署流程自动化

---

**注意事项：**

1. 严格遵循 RESTful API 设计规范
2. 确保所有敏感操作都有权限验证
3. 实施完善的错误处理和日志记录
4. 定期进行安全审计和性能测试
5. 保持代码质量和文档更新
