#!/usr/bin/env python
from cchooks import PreToolUseContext, create_context

c = create_context()

assert isinstance(c, PreToolUseContext)

# 将使用的命令追加到 @bash-command-log.txt
if c.tool_name == "Bash":
    command = c.tool_input.get("command", "")
    if command:
        try:
            with open(".claude/logs/bash-command-log.txt", "a", encoding="utf-8") as f:
                f.write(command.strip() + "\n")
        except Exception as e:
            # 记录失败不影响主流程，忽略异常
            pass

# 阻止危险命令
if c.tool_name == "Bash" and "rm -rf" in c.tool_input.get("command", ""):
    c.output.deny(
        "You should not execute this command: System protection: rm -rf blocked"
    )
else:
    c.output.exit_success()
