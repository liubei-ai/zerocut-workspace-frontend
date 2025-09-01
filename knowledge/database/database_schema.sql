-- =====================================================
-- ZeroCut 数据库架构设计 SQL 文件
-- 基于领域驱动设计(DDD)原则
-- 数据库类型: PostgreSQL 17
-- 创建日期: 2024年1月
-- 版本: v1.0
-- =====================================================

-- 设置数据库编码和时区
SET client_encoding = 'UTF8';
SET timezone = 'Asia/Shanghai';

-- =====================================================
-- 1. 用户管理域 (User Management Domain)
-- =====================================================

-- 用户表
CREATE TABLE USER (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    user_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (user_status IN ('active', 'inactive', 'locked', 'deleted')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_user_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_user_login_attempts CHECK (login_attempts >= 0)
);

-- 登录会话表
CREATE TABLE LOGIN_SESSION (
    session_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
);

-- =====================================================
-- 2. 工作空间域 (Workspace Domain)
-- =====================================================

-- 工作空间表
CREATE TABLE WORKSPACE (
    workspace_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_name VARCHAR(100) NOT NULL,
    workspace_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    workspace_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (workspace_status IN ('active', 'inactive', 'deleted')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键
    CONSTRAINT fk_workspace_user FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
);

-- 用户工作空间关联表
CREATE TABLE USER_WORKSPACE (
    user_workspace_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    role_type VARCHAR(20) NOT NULL DEFAULT 'readonly_user',
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    invited_by_user_id BIGINT,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    CONSTRAINT uk_user_workspace UNIQUE (user_id, workspace_id),
    
    -- 检查约束
    CONSTRAINT chk_user_workspace_role CHECK (role_type IN ('super_admin', 'normal_user', 'readonly_user')),
    CONSTRAINT chk_user_workspace_status CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- 外键
    CONSTRAINT fk_user_workspace_user FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_workspace_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_workspace_inviter FOREIGN KEY (invited_by_user_id) REFERENCES "USER"(user_id) ON DELETE SET NULL
);

-- 工作空间邀请表
CREATE TABLE WORKSPACE_INVITATION (
    invitation_id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    inviter_user_id BIGINT NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    role_type VARCHAR(20) NOT NULL DEFAULT 'readonly_user',
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 检查约束
    CONSTRAINT chk_invitation_role CHECK (role_type IN ('super_admin', 'normal_user', 'readonly_user')),
    CONSTRAINT chk_invitation_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    CONSTRAINT chk_invitation_expires CHECK (expires_at > created_at),
    
    -- 外键
    CONSTRAINT fk_invitation_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE CASCADE,
    CONSTRAINT fk_invitation_inviter FOREIGN KEY (inviter_user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
);

-- =====================================================
-- 3. 财务管理域 (Financial Management Domain)
-- =====================================================

-- 账户表
CREATE TABLE ACCOUNT (
    account_id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_recharged DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_consumed DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    low_balance_threshold DECIMAL(15,2) DEFAULT 10.00,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'CNY',
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_account_balance CHECK (balance >= 0),
    CONSTRAINT chk_account_total_recharged CHECK (total_recharged >= 0),
    CONSTRAINT chk_account_total_consumed CHECK (total_consumed >= 0),
    
    -- 外键
    CONSTRAINT fk_account_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE CASCADE
);

-- 充值记录表
CREATE TABLE RECHARGE_RECORD (
    record_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    order_no VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_channel VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
    transaction_id VARCHAR(255),
    payment_time TIMESTAMP WITH TIME ZONE,
    callback_data JSONB,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_recharge_amount CHECK (amount > 0),
    
    -- 外键
    CONSTRAINT fk_recharge_account FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id) ON DELETE CASCADE
);

-- 消费记录表
CREATE TABLE CONSUMPTION_RECORD (
    consumption_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    api_key_id BIGINT,
    service_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,4),
    transaction_details JSONB,
    request_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_consumption_amount CHECK (amount >= 0),
    CONSTRAINT chk_consumption_quantity CHECK (quantity > 0),
    
    -- 外键
    CONSTRAINT fk_consumption_account FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id) ON DELETE CASCADE
);

-- =====================================================
-- 4. API管理域 (API Management Domain)
-- =====================================================

-- API密钥表
CREATE TABLE API_KEY (
    api_key_id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    permissions JSONB DEFAULT '[]',
    rate_limit_per_minute INTEGER DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键
    CONSTRAINT fk_api_key_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE CASCADE
);

-- 添加消费记录的API密钥外键
ALTER TABLE CONSUMPTION_RECORD ADD CONSTRAINT fk_consumption_api_key 
    FOREIGN KEY (api_key_id) REFERENCES API_KEY(api_key_id) ON DELETE SET NULL;

-- =====================================================
-- 5. 数据统计域 (Data Statistics Domain)
-- =====================================================

-- 使用统计表
CREATE TABLE USAGE_STATS (
    stats_id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    stats_date DATE NOT NULL,
    api_calls_count BIGINT NOT NULL DEFAULT 0,
    tokens_used BIGINT NOT NULL DEFAULT 0,
    total_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time DECIMAL(10,2) DEFAULT 0.00,
    hourly_breakdown JSONB DEFAULT '{}',
    service_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    CONSTRAINT uk_usage_stats_workspace_date UNIQUE (workspace_id, stats_date),
    
    -- 外键
    CONSTRAINT fk_usage_stats_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE CASCADE
);

-- =====================================================
-- 6. 配置管理域 (Configuration Management Domain)
-- =====================================================

-- 客户端配置表
CREATE TABLE CLIENT_CONFIG (
    config_id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    CONSTRAINT uk_client_config_workspace_type_name UNIQUE (workspace_id, config_type, config_name),
    
    -- 外键
    CONSTRAINT fk_client_config_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE CASCADE
);

-- =====================================================
-- 7. 审计日志域 (Audit Log Domain)
-- =====================================================

-- 系统日志表
CREATE TABLE SYSTEM_LOG (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    workspace_id BIGINT,
    log_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键
    CONSTRAINT fk_system_log_user FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_system_log_workspace FOREIGN KEY (workspace_id) REFERENCES WORKSPACE(workspace_id) ON DELETE SET NULL
);

-- =====================================================
-- 索引创建
-- =====================================================

-- 用户表索引
CREATE INDEX idx_user_email ON "USER"(email);
CREATE INDEX idx_user_phone ON "USER"(phone);
CREATE INDEX idx_user_status ON "USER"(user_status);
CREATE INDEX idx_user_created_at ON "USER"(created_at);

-- 登录会话表索引
CREATE INDEX idx_session_user_id ON LOGIN_SESSION(user_id);
CREATE INDEX idx_session_token ON LOGIN_SESSION(session_token);
CREATE INDEX idx_session_active ON LOGIN_SESSION(is_active, expires_at);

-- 工作空间表索引
CREATE INDEX idx_workspace_user_id ON WORKSPACE(user_id);
CREATE INDEX idx_workspace_code ON WORKSPACE(workspace_code);
CREATE INDEX idx_workspace_default ON WORKSPACE(user_id, is_default);

-- 用户工作空间关联表索引
CREATE INDEX idx_user_workspace_user_id ON USER_WORKSPACE(user_id);
CREATE INDEX idx_user_workspace_workspace_id ON USER_WORKSPACE(workspace_id);
CREATE INDEX idx_user_workspace_role ON USER_WORKSPACE(role_type);
CREATE INDEX idx_user_workspace_status ON USER_WORKSPACE(status);
CREATE INDEX idx_user_workspace_owner ON USER_WORKSPACE(workspace_id, is_owner);

-- 工作空间邀请表索引
CREATE INDEX idx_invitation_workspace_id ON WORKSPACE_INVITATION(workspace_id);
CREATE INDEX idx_invitation_inviter ON WORKSPACE_INVITATION(inviter_user_id);
CREATE INDEX idx_invitation_email ON WORKSPACE_INVITATION(invitee_email);
CREATE INDEX idx_invitation_token ON WORKSPACE_INVITATION(invitation_token);
CREATE INDEX idx_invitation_status ON WORKSPACE_INVITATION(status);
CREATE INDEX idx_invitation_expires ON WORKSPACE_INVITATION(expires_at);

-- 账户表索引
CREATE INDEX idx_account_workspace_id ON ACCOUNT(workspace_id);
CREATE INDEX idx_account_status ON ACCOUNT(account_status);

-- API密钥表索引
CREATE INDEX idx_api_key_workspace_id ON API_KEY(workspace_id);
CREATE INDEX idx_api_key_hash ON API_KEY(key_hash);
CREATE INDEX idx_api_key_active ON API_KEY(is_active);
CREATE INDEX idx_api_key_last_used ON API_KEY(last_used_at);

-- 充值记录表索引
CREATE INDEX idx_recharge_account_id ON RECHARGE_RECORD(account_id);
CREATE INDEX idx_recharge_status ON RECHARGE_RECORD(status);
CREATE INDEX idx_recharge_created_at ON RECHARGE_RECORD(created_at);
CREATE INDEX idx_recharge_order_no ON RECHARGE_RECORD(order_no);

-- 使用统计表索引
CREATE INDEX idx_usage_workspace_date ON USAGE_STATS(workspace_id, stats_date);
CREATE INDEX idx_usage_stats_date ON USAGE_STATS(stats_date);

-- 消费记录表索引
CREATE INDEX idx_consumption_account_id ON CONSUMPTION_RECORD(account_id);
CREATE INDEX idx_consumption_api_key_id ON CONSUMPTION_RECORD(api_key_id);
CREATE INDEX idx_consumption_created_at ON CONSUMPTION_RECORD(created_at);
CREATE INDEX idx_consumption_service_type ON CONSUMPTION_RECORD(service_type);

-- 客户端配置表索引
CREATE INDEX idx_client_config_workspace_id ON CLIENT_CONFIG(workspace_id);
CREATE INDEX idx_client_config_type ON CLIENT_CONFIG(config_type);
CREATE INDEX idx_client_config_active ON CLIENT_CONFIG(is_active);

-- 系统日志表索引
CREATE INDEX idx_log_user_id ON SYSTEM_LOG(user_id);
CREATE INDEX idx_log_workspace_id ON SYSTEM_LOG(workspace_id);
CREATE INDEX idx_log_type_created ON SYSTEM_LOG(log_type, created_at);
CREATE INDEX idx_log_created_at ON SYSTEM_LOG(created_at);

-- =====================================================
-- 触发器和函数
-- =====================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "USER"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_updated_at BEFORE UPDATE ON WORKSPACE
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workspace_updated_at BEFORE UPDATE ON USER_WORKSPACE
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_invitation_updated_at BEFORE UPDATE ON WORKSPACE_INVITATION
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON ACCOUNT
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recharge_record_updated_at BEFORE UPDATE ON RECHARGE_RECORD
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_key_updated_at BEFORE UPDATE ON API_KEY
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at BEFORE UPDATE ON USAGE_STATS
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_config_updated_at BEFORE UPDATE ON CLIENT_CONFIG
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 初始化数据
-- =====================================================

-- 插入系统管理员用户
INSERT INTO "USER" (email, password_hash, username, user_status, email_verified)
VALUES 
    ('admin@zerocut.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtO8/LBvpe', '系统管理员', 'active', true),
    ('demo@zerocut.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtO8/LBvpe', '演示用户', 'active', true);

-- 为管理员创建默认工作空间
INSERT INTO WORKSPACE (user_id, workspace_name, workspace_code, is_default)
VALUES 
    (1, '系统管理工作空间', 'admin-workspace', true),
    (2, '我的工作空间', 'demo-workspace', true);

-- 创建用户工作空间关联（所有者权限）
INSERT INTO USER_WORKSPACE (user_id, workspace_id, role_type, is_owner)
VALUES 
    (1, 1, 'super_admin', true),
    (2, 2, 'super_admin', true);

-- 为每个工作空间创建账户
INSERT INTO ACCOUNT (workspace_id, balance, low_balance_threshold)
VALUES 
    (1, 1000.00, 100.00),
    (2, 100.00, 10.00);

-- 创建示例API密钥
INSERT INTO API_KEY (workspace_id, key_name, key_hash, key_prefix, environment)
VALUES 
    (1, '管理员API密钥', 'hash_admin_key_123', 'zc_admin_', 'production'),
    (2, '演示API密钥', 'hash_demo_key_456', 'zc_demo_', 'development');

-- 创建示例配置
INSERT INTO CLIENT_CONFIG (workspace_id, config_type, config_name, config_data)
VALUES 
    (1, 'dashboard', '仪表板配置', '{"theme": "dark", "language": "zh-CN", "autoRefresh": true}'),
    (2, 'dashboard', '仪表板配置', '{"theme": "light", "language": "zh-CN", "autoRefresh": false}'),
    (1, 'api', 'API配置', '{"timeout": 30000, "retryCount": 3, "rateLimit": 1000}'),
    (2, 'api', 'API配置', '{"timeout": 10000, "retryCount": 2, "rateLimit": 100}');

-- 创建示例使用统计
INSERT INTO USAGE_STATS (workspace_id, stats_date, api_calls_count, tokens_used, total_cost)
VALUES 
    (1, CURRENT_DATE - INTERVAL '1 day', 1500, 45000, 15.50),
    (1, CURRENT_DATE, 800, 24000, 8.20),
    (2, CURRENT_DATE - INTERVAL '1 day', 250, 7500, 2.50),
    (2, CURRENT_DATE, 120, 3600, 1.20);

-- 记录初始化日志
INSERT INTO SYSTEM_LOG (user_id, workspace_id, log_type, action, details)
VALUES 
    (1, 1, 'system', 'database_initialized', '{"version": "1.0", "tables_created": 12, "initial_data": true}'),
    (1, 1, 'user', 'admin_created', '{"admin_user": "admin@zerocut.com"}'),
    (2, 2, 'user', 'demo_user_created', '{"demo_user": "demo@zerocut.com"}');

-- =====================================================
-- 视图创建
-- =====================================================

-- 用户工作空间详情视图
CREATE VIEW v_user_workspace_details AS
SELECT 
    uw.user_workspace_id,
    u.user_id,
    u.email,
    u.username,
    w.workspace_id,
    w.workspace_name,
    w.workspace_code,
    uw.role_type,
    uw.is_owner,
    uw.status,
    uw.joined_at,
    a.balance as workspace_balance
FROM USER_WORKSPACE uw
JOIN "USER" u ON uw.user_id = u.user_id
JOIN WORKSPACE w ON uw.workspace_id = w.workspace_id
JOIN ACCOUNT a ON w.workspace_id = a.workspace_id
WHERE uw.status = 'active' AND u.user_status = 'active' AND w.workspace_status = 'active';

-- 工作空间统计视图
CREATE VIEW v_workspace_stats AS
SELECT 
    w.workspace_id,
    w.workspace_name,
    w.workspace_code,
    a.balance,
    a.total_recharged,
    a.total_consumed,
    COUNT(DISTINCT uw.user_id) as member_count,
    COUNT(DISTINCT ak.api_key_id) as api_key_count,
    COALESCE(us.api_calls_count, 0) as today_api_calls,
    COALESCE(us.total_cost, 0) as today_cost
FROM WORKSPACE w
JOIN ACCOUNT a ON w.workspace_id = a.workspace_id
LEFT JOIN USER_WORKSPACE uw ON w.workspace_id = uw.workspace_id AND uw.status = 'active'
LEFT JOIN API_KEY ak ON w.workspace_id = ak.workspace_id AND ak.is_active = true
LEFT JOIN USAGE_STATS us ON w.workspace_id = us.workspace_id AND us.stats_date = CURRENT_DATE
WHERE w.workspace_status = 'active'
GROUP BY w.workspace_id, w.workspace_name, w.workspace_code, a.balance, a.total_recharged, a.total_consumed, us.api_calls_count, us.total_cost;

-- =====================================================
-- 存储过程
-- =====================================================

-- 创建用户并自动创建默认工作空间的存储过程
CREATE OR REPLACE FUNCTION create_user_with_workspace(
    p_email VARCHAR(255),
    p_password_hash VARCHAR(255),
    p_username VARCHAR(100),
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(
    user_id BIGINT,
    workspace_id BIGINT,
    workspace_code VARCHAR(50)
) AS $$
DECLARE
    v_user_id BIGINT;
    v_workspace_id BIGINT;
    v_workspace_code VARCHAR(50);
    v_account_id BIGINT;
BEGIN
    -- 创建用户
    INSERT INTO "USER" (email, password_hash, username, phone)
    VALUES (p_email, p_password_hash, p_username, p_phone)
    RETURNING "USER".user_id INTO v_user_id;
    
    -- 生成工作空间代码
    v_workspace_code := 'ws_' || v_user_id || '_' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT;
    
    -- 创建默认工作空间
    INSERT INTO WORKSPACE (user_id, workspace_name, workspace_code, is_default)
    VALUES (v_user_id, p_username || '的工作空间', v_workspace_code, true)
    RETURNING WORKSPACE.workspace_id INTO v_workspace_id;
    
    -- 创建用户工作空间关联（所有者）
    INSERT INTO USER_WORKSPACE (user_id, workspace_id, role_type, is_owner)
    VALUES (v_user_id, v_workspace_id, 'super_admin', true);
    
    -- 创建账户
    INSERT INTO ACCOUNT (workspace_id)
    VALUES (v_workspace_id)
    RETURNING account_id INTO v_account_id;
    
    -- 记录日志
    INSERT INTO SYSTEM_LOG (user_id, workspace_id, log_type, action, details)
    VALUES (v_user_id, v_workspace_id, 'user', 'user_registered', 
            json_build_object('email', p_email, 'workspace_created', true));
    
    -- 返回结果
    RETURN QUERY SELECT v_user_id, v_workspace_id, v_workspace_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 权限设置（可选）
-- =====================================================

-- 创建应用用户角色
-- CREATE ROLE zerocut_app_user WITH LOGIN PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE zerocut TO zerocut_app_user;
-- GRANT USAGE ON SCHEMA public TO zerocut_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zerocut_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO zerocut_app_user;

-- =====================================================
-- 完成提示
-- =====================================================

-- 显示创建完成信息
DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ZeroCut 数据库架构创建完成！';
    RAISE NOTICE '版本: v1.0';
    RAISE NOTICE '创建时间: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '表数量: 12';
    RAISE NOTICE '索引数量: 30+';
    RAISE NOTICE '视图数量: 2';
    RAISE NOTICE '存储过程数量: 1';
    RAISE NOTICE '初始用户: admin@zerocut.com / demo@zerocut.com';
    RAISE NOTICE '默认密码: password (请及时修改)';
    RAISE NOTICE '=======================================================';
END $$;

-- 查询验证
SELECT 'Database schema created successfully!' as status,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';