# cchooks

Claude Code Hook SDK for Python

A lightweight Python Toolkit that makes building Claude Code hooks as simple as writing a few lines of code. Stop worrying about JSON parsing and focus on what your hook should actually do.

## Features

- **One-liner setup**: `create_context()` handles all the boilerplate
- **Zero config**: Automatic JSON parsing and validation from stdin
- **Smart detection**: Automatically figures out which hook you're building
- **7 hook types**: Support for all Claude Code hook events including UserPromptSubmit
- **Two modes**: Simple exit codes OR advanced JSON control
- **Type-safe**: Full type hints and IDE autocompletion

## Installation

```bash
pip install cchooks
# or
uv add cchooks
```

## Quick Start

Build a PreToolUse hook that blocks dangerous file writes:

```python
#!/usr/bin/env python3
from cchooks import create_context, PreToolUseContext

c = create_context()

# Determine hook type
assert isinstance(c, PreToolUseContext)

# Block writes to .env files
if c.tool_name == "Write" and ".env" in c.tool_input.get("file_path", ""):
    c.output.exit_deny("Nope! .env files are protected")
else:
    c.output.exit_success()
```

Save as `hooks/env-guard.py`, make executable:

```bash
chmod +x hooks/env-guard.py
```

That's it. No JSON parsing, no validation headaches.

## Brief Tutorial

Build each hook type with real examples:

### PreToolUse (Security Guard)

Block dangerous commands before they run:

```python
#!/usr/bin/env python3
from cchooks import create_context, PreToolUseContext

c = create_context()

assert isinstance(c, PreToolUseContext)
# Block rm -rf commands
if c.tool_name == "Bash" and "rm -rf" in c.tool_input.get("command", ""):
    c.output.exit_deny("You should not execute this command: System protection: rm -rf blocked")
else:
    c.output.exit_success()
```

### PostToolUse (Auto-formatter)

Format Python files after writing:

```python
#!/usr/bin/env python3
import subprocess
from cchooks import create_context, PostToolUseContext

c = create_context()

assert isinstance(c, PostToolUseContext)
if c.tool_name == "Write" and c.tool_input.get("file_path", "").endswith(".py"):
    file_path = c.tool_input["file_path"]
    subprocess.run(["black", file_path])
    print(f"Auto-formatted: {file_path}")
```

### Notification (Desktop Alerts)

Send desktop notifications:

```python
#!/usr/bin/env python3
import os
from cchooks import create_context, NotificationContext

c = create_context()

assert isinstance(c, NotificationContext)
if "permission" in c.message.lower():
    os.system(f'notify-send "Claude" "{c.message}"')
```

### Stop (Task Manager)

Keep Claude working on long tasks:

```python
#!/usr/bin/env python3
from cchooks import create_context, StopContext

c = create_context()

assert isinstance(c, StopContext)
if not c.stop_hook_active: # Claude has not been activated by other Stop Hook
    c.output.prevent("Hey Claude, you should try to do more works!") # Prevent from stopping, and prompt Claude
else:
    c.output.allow()  # Allow stop
```

> Since hooks are executed in parallel in Claude Code, it is necessary to check `stop_hook_active` to determine if Claude has already been activated by another parallel Stop Hook.

### SubagentStop (Workflow Control)

Same as Stop, but for subagents:

```python
from cchooks import create_context, SubagentStopContext
c = create_context()
assert isinstance(c, SubagentStopContext)
c.output.allow()  # Let subagents complete
```

### UserPromptSubmit (Prompt Filter)

Filter and enrich user prompts before processing:

```python
from cchooks import create_context, UserPromptSubmitContext

c = create_context()

assert isinstance(c, UserPromptSubmitContext)
# Block prompts with sensitive data
if "password" in c.prompt.lower():
    c.output.exit_block("Security: Prompt contains sensitive data")
else:
    c.output.exit_success()
```

### UserPromptSubmit (Prompt Filter)

Filter and enrich user prompts before processing:

```python
from cchooks import create_context, UserPromptSubmitContext

c = create_context()

assert isinstance(c, UserPromptSubmitContext)
# Block prompts with sensitive data
if "password" in c.prompt.lower():
    c.output.exit_block("Security: Prompt contains sensitive data")
else:
    c.output.exit_success()
```

### PreCompact (Custom Instructions)

Add custom compaction rules:

```python
from cchooks import create_context, PreCompactContext

c = create_context()

assert isinstance(c, PreCompactContext)
if c.custom_instructions:
    print(f"Using custom compaction: {c.custom_instructions}")
```

## Standalone Output Utilities

### Direct Control

When you need direct control over output and exit behavior outside of context objects, use these standalone utilities:

```python
#!/usr/bin/env python3
from cchooks import exit_success, exit_block, exit_non_block, output_json

# Direct exit control
exit_success("Operation completed successfully")
exit_block("Security violation detected")
exit_non_block("Warning: something unexpected happened")

# JSON output
output_json({"status": "error", "reason": "invalid input"})
```

### Available Standalone Functions

- `exit_success(message=None)` - Exit with code 0 (success)
- `exit_non_block(message, exit_code=1)` - Exit with error code (non-blocking)
- `exit_block(reason)` - Exit with code 2 (blocking error)
- `output_json(data)` - Output JSON data to stdout
- `safe_create_context()` - Safe wrapper with built-in error handling
- `handle_context_error(error)` - Unified error handler for context creation

### Error Handling

Handle context creation errors gracefully with built-in utilities:

```python
#!/usr/bin/env python3
from cchooks import safe_create_context, PreToolUseContext

# Automatic error handling - exits gracefully on any error
context = safe_create_context()

# If we reach here, context creation succeeded
assert isinstance(context, PreToolUseContext)

# Your normal hook logic here...
```

Or use explicit error handling:

```python
#!/usr/bin/env python3
from cchooks import create_context, handle_context_error, PreToolUseContext

try:
    context = create_context()
except Exception as e:
    handle_context_error(e)  # Graceful exit with appropriate message

# Normal processing...
```

## Quick API Guide

| Hook Type            | What You Get                         | Key Properties               |
| -------------------- | ------------------------------------ | ---------------------------- |
| **PreToolUse**       | `c.tool_name`, `c.tool_input`        | Block dangerous tools        |
| **PostToolUse**      | `c.tool_response`                    | React to tool results        |
| **Notification**     | `c.message`                          | Handle notifications         |
| **Stop**             | `c.stop_hook_active`                 | Control when Claude stops    |
| **SubagentStop**     | `c.stop_hook_active`                 | Control subagent behavior    |
| **UserPromptSubmit** | `c.prompt`                           | Filter and enrich prompts    |
| **PreCompact**       | `c.trigger`, `c.custom_instructions` | Modify transcript compaction |

### Simple Mode (Exit Codes)

```python
# Exit 0 = success, Exit 1 = non-block, Exit 2 = deny/block
c.output.exit_success()  # ✅
c.output.exit_non_block("reason")  # ❌
c.output.exit_deny("reason")  # ❌
```

### Advanced Mode (JSON)

```python
# Precise control over Claude's behavior
c.output.allow("reason")
c.output.deny("reason")
c.output.ask()
```

## Production Examples

### Multi-tool Security Guard

Block dangerous operations across multiple tools:

```python
#!/usr/bin/env python3
from cchooks import create_context, PreToolUseContext

DANGEROUS_COMMANDS = {"rm -rf", "sudo", "format", "fdisk"}
SENSITIVE_FILES = {".env", "secrets.json", "id_rsa"}

c = create_context()

assert isinstance(c, PreToolUseContext)
# Block dangerous Bash commands
if c.tool_name == "Bash":
    command = c.tool_input.get("command", "")
    if any(danger in command for danger in DANGEROUS_COMMANDS):
        c.output.exit_block("Security: Dangerous command blocked")
    else:
        c.output.exit_success()

# Block writes to sensitive files
elif c.tool_name == "Write":
    file_path = c.tool_input.get("file_path", "")
    if any(sensitive in file_path for sensitive in SENSITIVE_FILES):
        c.output.exit_deny(f"Protected file: {file_path}")
    else:
        c.output.exit_success()

else:
    c.output.ask() # Pattern not matched, let Claude decide
```

### Auto-linter Hook

Lint Python files after writing:

```python
#!/usr/bin/env python3
import subprocess
from cchooks import create_context, PostToolUseContext

c = create_context()

assert isinstance(c, PostToolUseContext)
if c.tool_name == "Write" and c.tool_input.get("file_path", "").endswith(".py"):
    file_path = c.tool_input["file_path"]

    # Run ruff linter
    result = subprocess.run(["ruff", "check", file_path], capture_output=True)

    if result.returncode == 0:
        print(f"✅ {file_path} passed linting")
    else:
        print(f"⚠️  {file_path} has issues:")
        print(result.stdout.decode())

    c.output.exit_success()
```

### Git-aware Auto-commit

Auto-commit file changes:

```python
#!/usr/bin/env python3
import subprocess
from cchooks import create_context, PostToolUseContext

c = create_context()

assert isinstance(c, PostToolUseContext)
if c.tool_name == "Write":
    file_path = c.tool_input.get("file_path", "")

    # Skip non-git files
    if not file_path.startswith("/my-project/"):
        c.output.exit_success()

    # Auto-commit Python changes
    if file_path.endswith(".py"):
        try:
            subprocess.run(["git", "add", file_path], check=True)
            subprocess.run([
                "git", "commit", "-m",
                f"auto: update {file_path.split('/')[-1]}"
            ], check=True)
            print(f"📁 Committed: {file_path}")
        except subprocess.CalledProcessError:
            print("Git commit failed - probably no changes")

    c.output.exit_success()
```

### Permission Logger

Log all permission requests:

```python
#!/usr/bin/env python3
import json
import datetime
from cchooks import create_context, PreToolUseContext

c = create_context()

assert isinstance(c, PreToolUseContext)
if c.tool_name == "Write":
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "file": c.tool_input.get("file_path"),
        "action": "write_requested"
    }

    with open("/tmp/permission-log.jsonl", "a") as f:
        f.write(json.dumps(log_entry) + "\n")

    c.output.exit_success()
```
