# Zerocut 视频 Agent 管理台 - DDD 用户故事与验收条件

## 领域模型概览

### 核心领域实体

- **用户 (User)**: 系统使用者，具有身份认证和权限管理
- **工作空间 (Workspace)**: 用户数据隔离的基础单元
- **账户 (Account)**: 用户的财务和配置信息容器
- **API密钥 (ApiKey)**: 系统集成的安全凭证
- **充值记录 (RechargeRecord)**: 财务交易的历史记录
- **使用统计 (UsageStats)**: 业务运营数据的聚合
- **客户端配置 (ClientConfig)**: 系统集成参数的配置实体

### 领域服务

- **认证服务 (AuthenticationService)**: 处理用户身份验证
- **工作空间服务 (WorkspaceService)**: 管理用户工作空间生命周期
- **协作服务 (CollaborationService)**: 处理工作空间多用户协作和权限管理
- **邀请服务 (InvitationService)**: 管理工作空间用户邀请流程
- **计费服务 (BillingService)**: 处理充值和消费逻辑
- **统计服务 (StatisticsService)**: 聚合和计算使用数据
- **配置服务 (ConfigurationService)**: 管理系统配置

---

## Epic 1: 用户认证与工作空间管理

### 用户故事 1.1: 用户注册

**故事描述**
作为**新用户**，我需要**通过邮箱或手机号注册账户**，以便**获得视频创作服务的访问权限并节省99%的视频制作成本**

**业务价值**: 每成功注册1个用户，预期带来月均¥500收入，转化率目标15%

**INVEST合规检查**

- ✅ Independent: 可独立开发和测试
- ✅ Negotiable: 注册方式可协商（邮箱/手机号）
- ✅ Valuable: 直接影响用户获取和收入
- ✅ Estimable: 开发工作量可估算（3-5天）
- ✅ Small: 单一功能点，范围明确
- ✅ Testable: 有明确的验收条件

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户成功注册新账户
  Given 用户访问注册页面
  And 系统显示注册表单（邮箱、密码、确认密码、手机号）
  When 用户输入有效邮箱"test@example.com"
  And 用户输入符合强度要求的密码"Test123!@#"
  And 用户输入匹配的确认密码"Test123!@#"
  And 用户输入有效手机号"13812345678"
  And 用户点击"注册"按钮
  Then 系统创建新用户账户
  And 系统自动创建默认工作空间"test-默认工作空间"
  And 系统发送邮箱验证邮件
  And 系统显示"注册成功，请查收验证邮件"消息
  And 用户被重定向到登录页面
```

#### 异常路径

```gherkin
Scenario: 邮箱已存在时注册失败
  Given 用户访问注册页面
  When 用户输入已存在的邮箱"existing@example.com"
  And 用户填写其他有效信息
  And 用户点击"注册"按钮
  Then 系统显示"该邮箱已被注册，请使用其他邮箱或直接登录"
  And 注册表单保持在当前页面
  And 邮箱输入框高亮显示错误状态
```

#### 边界路径

```gherkin
Scenario: 密码强度不足时的处理
  Given 用户访问注册页面
  When 用户输入弱密码"123456"
  Then 系统实时显示"密码强度不足：需包含大小写字母、数字和特殊字符，长度8-20位"
  And "注册"按钮保持禁用状态
  And 密码强度指示器显示为红色
```

**领域模型映射**

- 实体: User, Workspace
- 值对象: Email, Password, PhoneNumber
- 领域服务: AuthenticationService, WorkspaceService
- 领域事件: UserRegistered, DefaultWorkspaceCreated

**价值验证指标**

- 注册成功率 > 85%
- 注册到首次使用转化率 > 60%
- 默认工作空间创建成功率 = 100%

---

### 用户故事 1.2: 用户登录

**故事描述**
作为**已注册用户**，我需要**通过邮箱/手机号和密码登录系统**，以便**访问我的视频创作管理台并管理我的项目**

**业务价值**: 提高用户留存率，目标日活跃用户登录率 > 70%

**INVEST合规检查**

- ✅ Independent: 独立于注册功能
- ✅ Negotiable: 登录方式可扩展（第三方登录）
- ✅ Valuable: 直接影响用户体验和留存
- ✅ Estimable: 2-3天开发工作量
- ✅ Small: 单一认证功能
- ✅ Testable: 有明确的成功/失败标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户成功登录系统
  Given 用户访问登录页面
  And 用户已完成邮箱验证
  When 用户输入正确邮箱"test@example.com"
  And 用户输入正确密码"Test123!@#"
  And 用户点击"登录"按钮
  Then 系统验证用户凭据
  And 系统生成有效的JWT令牌（有效期24小时）
  And 系统记录登录时间和IP地址
  And 用户被重定向到数据看板页面
  And 页面显示用户名和当前工作空间信息
```

#### 异常路径

```gherkin
Scenario: 密码错误时登录失败
  Given 用户访问登录页面
  When 用户输入正确邮箱"test@example.com"
  And 用户输入错误密码"wrongpassword"
  And 用户点击"登录"按钮
  Then 系统显示"邮箱或密码错误，请重新输入"
  And 密码输入框被清空
  And 系统记录失败登录尝试（IP地址、时间）
  And 连续失败3次后显示验证码
```

#### 边界路径

```gherkin
Scenario: 账户被锁定时的处理
  Given 用户在15分钟内连续登录失败5次
  When 用户再次尝试登录
  Then 系统显示"账户已被临时锁定15分钟，请稍后重试或重置密码"
  And 登录按钮被禁用
  And 系统发送安全提醒邮件到用户邮箱
```

**领域模型映射**

- 实体: User, LoginSession
- 值对象: Credentials, JwtToken
- 领域服务: AuthenticationService
- 领域事件: UserLoggedIn, LoginFailed, AccountLocked

**价值验证指标**

- 登录成功率 > 95%
- 平均登录时间 < 3秒
- 账户安全事件 < 0.1%

---

### 用户故事 1.3: 工作空间用户邀请

**故事描述**
作为**工作空间超级管理员**，我需要**邀请其他用户加入我的工作空间并分配相应权限**，以便**实现团队协作并提高视频创作效率**

**业务价值**: 提升团队协作效率，预期每个协作工作空间月均收入增长150%，团队用户留存率提升40%

**INVEST合规检查**

- ✅ Independent: 可独立开发邀请功能
- ✅ Negotiable: 邀请方式和权限类型可协商
- ✅ Valuable: 直接影响团队协作和收入增长
- ✅ Estimable: 4-6天开发工作量
- ✅ Small: 专注于邀请和权限分配功能
- ✅ Testable: 有明确的邀请成功标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 超级管理员成功邀请用户加入工作空间
  Given 用户"admin@company.com"是工作空间"团队创作空间"的超级管理员
  And 被邀请用户"user@company.com"尚未加入该工作空间
  When 管理员访问工作空间成员管理页面
  And 管理员点击"邀请成员"按钮
  And 管理员输入邮箱"user@company.com"
  And 管理员选择权限类型"普通用户"
  And 管理员点击"发送邀请"按钮
  Then 系统生成唯一邀请令牌（有效期7天）
  And 系统发送邀请邮件到"user@company.com"
  And 系统显示"邀请已发送，等待用户确认"
  And 邀请记录显示在待处理邀请列表中
```

#### 异常路径

```gherkin
Scenario: 邀请已存在用户时的处理
  Given 用户"admin@company.com"是工作空间超级管理员
  When 管理员尝试邀请已在工作空间的用户"existing@company.com"
  Then 系统显示"该用户已是工作空间成员，无需重复邀请"
  And 邀请表单保持在当前页面
  And 邮箱输入框高亮显示提示信息
```

#### 边界路径

```gherkin
Scenario: 工作空间成员数量达到上限时的处理
  Given 工作空间"团队创作空间"已有50个成员（达到上限）
  When 超级管理员尝试邀请新用户
  Then 系统显示"工作空间成员数量已达上限（50人），请升级套餐或移除部分成员"
  And "发送邀请"按钮被禁用
  And 系统显示升级套餐的引导链接
```

**领域模型映射**

- 实体: UserWorkspace, WorkspaceInvitation, User, Workspace
- 值对象: InvitationToken, RoleType, Email
- 领域服务: InvitationService, CollaborationService
- 领域事件: UserInvited, InvitationSent, WorkspaceMemberAdded

**价值验证指标**

- 邀请发送成功率 > 98%
- 邀请接受率 > 75%
- 团队工作空间月活跃度 > 85%

---

### 用户故事 1.4: 接受工作空间邀请

**故事描述**
作为**被邀请用户**，我需要**通过邮件链接接受工作空间邀请并加入团队**，以便**参与团队视频创作项目并享受协作便利**

**业务价值**: 扩大用户基础，提高平台活跃度，预期每个接受邀请的用户月均贡献¥200收入

**INVEST合规检查**

- ✅ Independent: 可独立开发邀请接受功能
- ✅ Negotiable: 接受流程可优化
- ✅ Valuable: 直接影响用户增长和团队协作
- ✅ Estimable: 3-4天开发工作量
- ✅ Small: 专注于邀请接受流程
- ✅ Testable: 有明确的加入成功标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户成功接受工作空间邀请
  Given 用户"user@company.com"收到工作空间邀请邮件
  And 邀请令牌"inv_abc123"仍在有效期内（7天）
  And 用户已注册并登录系统
  When 用户点击邮件中的邀请链接
  Then 系统验证邀请令牌有效性
  And 系统显示邀请详情页面（工作空间名称、邀请人、权限类型）
  When 用户点击"接受邀请"按钮
  Then 系统将用户添加到工作空间成员列表
  And 系统分配"普通用户"权限
  And 系统发送确认邮件给邀请人和被邀请人
  And 用户被重定向到工作空间数据看板
  And 系统显示"欢迎加入团队创作空间！"
```

#### 异常路径

```gherkin
Scenario: 邀请令牌已过期时的处理
  Given 用户收到的邀请令牌"inv_expired123"已超过7天有效期
  When 用户点击过期的邀请链接
  Then 系统显示"邀请链接已过期，请联系管理员重新发送邀请"
  And 系统提供"申请新邀请"按钮
  And 系统记录过期邀请访问日志
```

#### 边界路径

```gherkin
Scenario: 未注册用户接受邀请时的处理
  Given 邀请发送给未注册邮箱"newuser@company.com"
  When 未注册用户点击邀请链接
  Then 系统显示"请先注册账户以接受邀请"
  And 系统自动跳转到注册页面
  And 注册表单预填充邮箱"newuser@company.com"
  And 注册成功后自动处理待接受的邀请
```

**领域模型映射**

- 实体: UserWorkspace, WorkspaceInvitation, User
- 值对象: InvitationToken, RoleType
- 领域服务: InvitationService, CollaborationService
- 领域事件: InvitationAccepted, WorkspaceMemberAdded, UserJoinedWorkspace

**价值验证指标**

- 邀请接受成功率 > 95%
- 邀请接受平均时间 < 24小时
- 新加入成员7天留存率 > 80%

---

### 用户故事 1.5: 工作空间权限管理

**故事描述**
作为**工作空间超级管理员**，我需要**管理成员权限（查看、修改、删除成员）**，以便**确保工作空间安全并合理分配团队职责**

**业务价值**: 提升工作空间安全性和管理效率，减少误操作风险，预期减少30%的数据安全事件

**INVEST合规检查**

- ✅ Independent: 可独立开发权限管理功能
- ✅ Negotiable: 权限粒度可调整
- ✅ Valuable: 直接影响数据安全和团队管理
- ✅ Estimable: 5-7天开发工作量
- ✅ Small: 专注于权限管理功能
- ✅ Testable: 有明确的权限验证标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 超级管理员成功修改成员权限
  Given 用户"admin@company.com"是工作空间"团队创作空间"的超级管理员
  And 用户"user@company.com"当前是"普通用户"权限
  When 管理员访问成员管理页面
  And 管理员点击用户"user@company.com"的权限设置
  And 管理员选择新权限"只读用户"
  And 管理员点击"保存修改"按钮
  Then 系统更新用户权限为"只读用户"
  And 系统记录权限变更日志（操作人、时间、变更内容）
  And 系统发送权限变更通知邮件给被修改用户
  And 系统显示"权限修改成功"
  And 用户权限立即生效（下次操作时验证）
```

#### 异常路径

```gherkin
Scenario: 普通用户尝试修改权限时被拒绝
  Given 用户"normaluser@company.com"是"普通用户"权限
  When 用户尝试访问成员权限管理页面
  Then 系统显示"权限不足，仅超级管理员可管理成员权限"
  And 用户被重定向到工作空间主页
  And 系统记录未授权访问尝试日志
```

#### 边界路径

```gherkin
Scenario: 工作空间仅剩一个超级管理员时的保护
  Given 工作空间"团队创作空间"仅有1个超级管理员"admin@company.com"
  When 管理员尝试将自己的权限降级为"普通用户"
  Then 系统显示"工作空间必须至少保留一个超级管理员"
  And 权限修改操作被阻止
  And 系统建议"请先指定其他超级管理员，再修改自己的权限"
```

**领域模型映射**

- 实体: UserWorkspace, User, Workspace
- 值对象: RoleType, Permission
- 领域服务: CollaborationService, PermissionService
- 领域事件: PermissionChanged, AdminRoleProtected, UnauthorizedAccess

**价值验证指标**

- 权限修改成功率 > 99%
- 权限变更响应时间 < 1秒
- 未授权访问拦截率 = 100%

---

## Epic 2: 数据看板与监控

### 用户故事 2.1: 实时数据监控

**故事描述**
作为**视频创作者**，我需要**实时查看我的账户余额、使用量统计和消费趋势**，以便**及时了解服务使用情况并优化成本控制**

**业务价值**: 提高用户粘性，减少因余额不足导致的服务中断，预期减少20%的用户流失

**INVEST合规检查**

- ✅ Independent: 可独立开发数据展示功能
- ✅ Negotiable: 数据展示方式可调整
- ✅ Valuable: 直接影响用户体验和留存
- ✅ Estimable: 5-7天开发工作量
- ✅ Small: 专注于数据展示功能
- ✅ Testable: 有明确的数据准确性标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户查看实时数据看板
  Given 用户已登录系统
  And 用户当前账户余额为¥1,234.56
  And 用户今日已生成视频时长2,435分钟
  When 用户访问数据看板页面
  Then 系统显示账户余额"¥1,234.56"
  And 系统显示今日生成视频时长"2,435分钟"
  And 系统显示今日生成图片数量"1,234张"
  And 系统显示今日合成视频数量"89个"
  And 系统显示今日消费金额"¥156.78"
  And 所有数据更新时间显示为"最后更新：2分钟前"
```

#### 异常路径

```gherkin
Scenario: 数据加载失败时的处理
  Given 用户已登录系统
  When 用户访问数据看板页面
  And 后端数据服务不可用
  Then 系统显示"数据加载中..."加载状态
  And 5秒后显示"数据暂时无法加载，请刷新页面重试"
  And 系统提供"刷新"按钮
  And 系统显示上次成功加载的缓存数据（如果有）
```

#### 边界路径

```gherkin
Scenario: 余额不足时的预警处理
  Given 用户账户余额为¥50.00
  And 系统预警阈值设置为¥100.00
  When 用户访问数据看板页面
  Then 系统在余额卡片显示橙色预警标识
  And 系统显示"余额不足，建议及时充值"提醒
  And 系统提供"立即充值"快捷按钮
  And 预警信息在页面顶部显示横幅通知
```

**领域模型映射**

- 实体: Account, UsageStats, DashboardData
- 值对象: Balance, VideoMetrics, ConsumptionData
- 领域服务: StatisticsService, AlertService
- 领域事件: LowBalanceDetected, DataRefreshed

**价值验证指标**

- 数据准确率 = 100%
- 数据刷新延迟 < 5分钟
- 余额预警触发率 > 90%

---

## Epic 3: 账户管理与安全

### 用户故事 3.1: API密钥管理

**故事描述**
作为**开发者用户**，我需要**创建、查看和管理多个API密钥**，以便**在不同环境中安全地集成Zerocut服务并控制访问权限**

**业务价值**: 提高开发者用户满意度，支持企业级集成，预期增加30%的API调用量

**INVEST合规检查**

- ✅ Independent: 可独立开发和测试
- ✅ Negotiable: 密钥类型和权限可扩展
- ✅ Valuable: 直接支持技术集成需求
- ✅ Estimable: 4-6天开发工作量
- ✅ Small: 专注于密钥管理功能
- ✅ Testable: 有明确的操作成功标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户成功创建新的API密钥
  Given 用户已登录账户管理页面
  And 用户当前拥有2个API密钥
  When 用户点击"创建新密钥"按钮
  And 用户输入密钥名称"生产环境密钥"
  And 用户选择环境类型"生产环境"
  And 用户点击"确认创建"按钮
  Then 系统生成32位随机API密钥"zc_prod_A9tL7xY2pQw3mN8kR5vB..."
  And 系统显示完整密钥（仅此一次）
  And 系统记录创建时间和用户信息
  And 密钥状态设置为"活跃"
  And 系统显示"密钥创建成功，请妥善保存"提示
```

#### 异常路径

```gherkin
Scenario: 达到密钥数量限制时创建失败
  Given 用户已拥有5个API密钥（系统限制）
  When 用户尝试创建新密钥
  Then 系统显示"已达到密钥数量上限（5个），请删除不用的密钥后重试"
  And "创建新密钥"按钮被禁用
  And 系统显示当前密钥列表和使用状态
```

#### 边界路径

```gherkin
Scenario: 密钥30天未使用时自动标记为非活跃
  Given 用户拥有API密钥"zc_test_B8sM6wX1oRv2lK7jQ4uA"
  And 该密钥最后使用时间为31天前
  When 系统执行日常维护任务
  Then 系统将密钥状态更新为"非活跃"
  And 系统发送邮件通知用户"API密钥因长期未使用已被标记为非活跃"
  And 密钥在列表中显示灰色状态图标
```

**领域模型映射**

- 实体: ApiKey, User
- 值对象: KeyName, Environment, KeyStatus
- 领域服务: ApiKeyService, SecurityService
- 领域事件: ApiKeyCreated, ApiKeyDeactivated, ApiKeyUsed

**价值验证指标**

- 密钥创建成功率 = 100%
- 密钥安全事件 = 0
- 开发者用户API调用成功率 > 99.5%

---

## Epic 4: 财务管理

### 用户故事 4.1: 充值记录查询

**故事描述**
作为**付费用户**，我需要**查询和筛选我的充值历史记录**，以便**跟踪财务支出并进行成本分析**

**业务价值**: 提高用户对财务透明度的信任，减少财务相关客服咨询50%

**INVEST合规检查**

- ✅ Independent: 可独立开发查询功能
- ✅ Negotiable: 筛选条件可调整
- ✅ Valuable: 提高用户信任和满意度
- ✅ Estimable: 3-4天开发工作量
- ✅ Small: 专注于记录查询功能
- ✅ Testable: 有明确的查询准确性标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户成功查询充值记录
  Given 用户已登录充值记录页面
  And 用户在过去30天内有3笔充值记录
  When 用户选择时间范围"最近30天"
  And 用户选择状态筛选"全部"
  And 用户点击"查询"按钮
  Then 系统显示3条充值记录
  And 每条记录显示：充值金额、支付方式、订单状态、创建时间
  And 记录按创建时间倒序排列
  And 系统显示总充值金额"¥1,500.00"
```

#### 异常路径

```gherkin
Scenario: 查询条件无匹配结果
  Given 用户已登录充值记录页面
  When 用户选择时间范围"最近7天"
  And 用户在最近7天内无充值记录
  And 用户点击"查询"按钮
  Then 系统显示"暂无符合条件的充值记录"
  And 系统显示空状态图标和说明文字
  And 系统提供"立即充值"引导按钮
```

#### 边界路径

```gherkin
Scenario: 大量记录分页加载
  Given 用户拥有超过100条充值记录
  When 用户查询"全部时间"的记录
  Then 系统每页显示20条记录
  And 系统显示分页导航"第1页，共6页"
  And 系统提供"下一页"、"上一页"、"跳转到"功能
  And 页面加载时间 < 2秒
```

**领域模型映射**

- 实体: RechargeRecord, PaymentOrder
- 值对象: Amount, PaymentMethod, OrderStatus
- 领域服务: BillingService, QueryService
- 领域事件: RecordsQueried, PaymentCompleted

**价值验证指标**

- 查询响应时间 < 2秒
- 数据准确率 = 100%
- 用户财务查询满意度 > 95%

---

## Epic 5: 系统配置与集成

### 用户故事 5.1: 客户端配置管理

**故事描述**
作为**技术集成用户**，我需要**配置和管理Trae.ai客户端集成参数**，以便**无缝集成Zerocut服务到我的工作流程中**

**业务价值**: 提高技术用户的集成成功率，减少技术支持成本，预期提升集成成功率至85%

**INVEST合规检查**

- ✅ Independent: 可独立开发配置功能
- ✅ Negotiable: 配置项可扩展
- ✅ Valuable: 直接支持技术集成需求
- ✅ Estimable: 4-5天开发工作量
- ✅ Small: 专注于配置管理功能
- ✅ Testable: 有明确的配置有效性标准

**验收条件**

#### 正向路径

```gherkin
Scenario: 用户成功配置Trae.ai集成
  Given 用户已登录客户端配置页面
  When 用户启用"Trae.ai集成"
  And 用户设置最大令牌数为"100000"
  And 用户设置温度参数为"0.7"
  And 用户选择模型"claude-4-sonnet"
  And 用户输入系统提示词"你是一个专业的视频创作助手..."
  And 用户点击"保存配置"按钮
  Then 系统验证配置参数有效性
  And 系统保存配置到用户工作空间
  And 系统显示"配置保存成功"确认消息
  And 系统生成配置JSON供下载
```

#### 异常路径

```gherkin
Scenario: 配置参数验证失败
  Given 用户在配置页面
  When 用户设置最大令牌数为"999999"（超出限制）
  And 用户点击"保存配置"按钮
  Then 系统显示"最大令牌数不能超过200000"错误提示
  And 令牌数输入框高亮显示错误状态
  And "保存配置"按钮保持禁用状态
  And 其他有效配置项保持用户输入值
```

#### 边界路径

```gherkin
Scenario: 配置文件大小达到上限
  Given 用户输入的系统提示词长度为10000字符
  And 系统限制提示词最大长度为8000字符
  When 用户尝试保存配置
  Then 系统显示"系统提示词过长，请控制在8000字符以内（当前10000字符）"
  And 系统显示字符计数器"10000/8000"
  And 提示词输入框显示红色边框
```

**领域模型映射**

- 实体: ClientConfig, Workspace
- 值对象: ModelParameters, PromptTemplate, ConfigurationJson
- 领域服务: ConfigurationService, ValidationService
- 领域事件: ConfigurationSaved, ConfigurationValidated

**价值验证指标**

- 配置保存成功率 > 98%
- 配置验证准确率 = 100%
- 技术用户集成成功率 > 85%

---

## 黄金三问自检总结

### 1. 不做此功能哪个角色会受损？

- **用户注册/登录**: 所有潜在用户无法访问服务 → 业务无法启动
- **数据看板**: 现有用户无法监控使用情况 → 用户流失
- **API密钥管理**: 开发者用户无法集成 → 失去技术用户群体
- **充值记录**: 付费用户缺乏财务透明度 → 信任度下降
- **客户端配置**: 技术用户无法定制化集成 → 集成成功率低

### 2. 如何测量价值实现？

- **用户增长**: 注册转化率、日活跃用户数
- **收入指标**: 月均用户价值、充值成功率
- **技术指标**: API调用成功率、集成成功率
- **用户满意度**: NPS评分、功能使用率
- **运营效率**: 客服咨询减少率、自助服务完成率

### 3. 能否独立交付？

- ✅ 每个用户故事都可以独立开发、测试和部署
- ✅ 具有明确的验收条件和价值验证指标
- ✅ 遵循INVEST原则，确保交付质量
- ✅ 包含完整的正向、异常和边界路径测试场景

---

**文档版本**: v1.0  
**创建日期**: 2025年9月  
**DDD专家**: AI助手  
**审核状态**: 待产品负责人审核
