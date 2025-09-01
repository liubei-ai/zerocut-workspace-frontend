#!/usr/bin/env python

import os
import subprocess

from cchooks import PostToolUseContext, create_context

c = create_context()

assert isinstance(c, PostToolUseContext)

# 如果不是编辑或写入操作，直接退出
if c.tool_name not in ["Edit", "Write"]:
    c.output.exit_success()

file_path = c.tool_input.get("file_path", "")
if not file_path:
    c.output.exit_success()

# 检查文件扩展名，只处理特定类型的文件
allowed_extensions = [".vue", ".ts", ".js", ".json"]
file_extension = os.path.splitext(file_path)[1].lower()

if file_extension not in allowed_extensions:
    print(
        f"Skipping formatting for {file_path} (unsupported file type: {file_extension})"
    )
    c.output.exit_success()

# 获取项目根目录
project_dir = os.getenv("CLAUDE_PROJECT_DIR", os.getcwd())

# 确定 prettier 配置和工作目录
prettier_config = None
working_dir = None

if file_path.startswith(os.path.join(project_dir, "server/src")):
    prettier_config = os.path.join(project_dir, "server", ".prettierrc")
    working_dir = os.path.join(project_dir, "server")
elif file_path.startswith(os.path.join(project_dir, "frontend/src")):
    prettier_config = os.path.join(project_dir, "frontend", ".prettierrc")
    working_dir = os.path.join(project_dir, "frontend")

# 如果没有找到合适的配置，退出
if not prettier_config or not os.path.exists(prettier_config):
    print(f"No prettier config found for: {file_path}")
    c.output.exit_success()

print("\n\n")
print(f"Using prettier config: {prettier_config}")

# 执行格式化
try:
    result = subprocess.run(
        ["npx", "prettier", "--write", "--config", prettier_config, file_path],
        cwd=working_dir,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode == 0:
        print(f"Successfully formatted: {file_path}")
    else:
        print(f"Prettier error for {file_path}: {result.stderr}")

except subprocess.TimeoutExpired:
    print(f"Prettier timeout for: {file_path}")
except Exception as e:
    print(f"Error running prettier for {file_path}: {str(e)}")

c.output.exit_success()
