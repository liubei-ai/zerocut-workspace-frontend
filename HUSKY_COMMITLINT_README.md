# Husky & CommitLint 配置说明

本项目已配置了 Husky 和 CommitLint，用于在代码提交前进行自动化检查和规范化。

## 🚀 功能特性

- **Pre-commit Hook**: 提交前自动运行 ESLint 和 Prettier 格式化代码
- **Commit Message 规范**: 强制使用 Conventional Commits 规范
- **代码风格统一**: 自动修复代码格式问题

## 📦 已安装的工具

- `husky`: Git hooks 管理工具
- `@commitlint/cli` & `@commitlint/config-conventional`: Commit 信息规范检查
- `lint-staged`: 只对暂存文件运行 linters
- `prettier`: 代码格式化工具
- `eslint`: 代码质量检查工具

## 🎯 Commit 信息规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修改bug的代码变动）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回滚
- `build`: 构建系统或外部依赖项的更改
- `ci`: CI配置文件和脚本的更改

### 示例

```bash
# 正确的提交信息
feat(auth): add user login functionality
fix(api): resolve timeout issue in user service
docs: update README with new installation steps
style: format code with prettier
refactor(utils): simplify date formatting function

# 错误的提交信息（会被拒绝）
add new feature
fixed bug
update docs
```

## 🛠️ 可用脚本

```bash
# 代码检查和修复
pnpm run lint          # 运行 ESLint 并自动修复
pnpm run lint:check    # 只检查，不修复

# 代码格式化
pnpm run format        # 格式化所有文件
pnpm run format:check  # 检查格式是否正确

# 测试
pnpm run test          # 运行测试
```

## 🔧 工作流程

1. **编写代码**: 正常开发你的功能
2. **暂存文件**: `git add .`
3. **提交代码**: `git commit -m "feat: add new feature"`

### 自动化流程

当你运行 `git commit` 时：

1. **Pre-commit Hook** 会自动运行：

   - 对暂存的文件运行 ESLint 检查和修复
   - 对暂存的文件运行 Prettier 格式化
   - 如果有错误，提交会被阻止

2. **Commit-msg Hook** 会检查：
   - 提交信息是否符合 Conventional Commits 规范
   - 如果不符合规范，提交会被拒绝

## 📝 配置文件说明

- `.husky/pre-commit`: Pre-commit hook 配置
- `.husky/commit-msg`: Commit message hook 配置
- `commitlint.config.js`: CommitLint 规则配置
- `.prettierrc`: Prettier 格式化规则
- `.eslintrc.js`: ESLint 检查规则
- `package.json` 中的 `lint-staged`: 指定对哪些文件运行哪些工具

## 🚨 常见问题

### 提交被拒绝怎么办？

1. **代码格式问题**:

   ```bash
   pnpm run format  # 格式化代码
   git add .        # 重新暂存
   git commit -m "your message"
   ```

2. **ESLint 错误**:

   ```bash
   pnpm run lint    # 自动修复
   # 手动修复无法自动修复的问题
   git add .
   git commit -m "your message"
   ```

3. **Commit 信息格式错误**:
   ```bash
   # 使用正确的格式重新提交
   git commit -m "feat: your feature description"
   ```

### 跳过检查（不推荐）

如果在紧急情况下需要跳过检查：

```bash
git commit -m "your message" --no-verify
```

**注意**: 这会跳过所有 git hooks，请谨慎使用。

## 🎉 好处

- **代码质量**: 自动检查和修复常见问题
- **团队协作**: 统一的代码风格和提交规范
- **版本管理**: 清晰的提交历史，便于生成 changelog
- **自动化**: 减少手动检查，提高开发效率
