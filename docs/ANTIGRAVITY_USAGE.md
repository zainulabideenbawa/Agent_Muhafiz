# Antigravity Usage

## Purpose
Antigravity is the **orchestrator** that coordinates the execution of the Muhafiz‑X workflow. It manages:
- **Task planning** – creates a step‑by‑step plan (implementation_plan.md, task.md).
- **Tool invocation** – calls LLMs, file edits, image generation, background timers.
- **Logging** – all actions are written to the `.system_generated` logs and can be reproduced via the trace sample.
- **Error handling** – falls back to heuristic defaults when an LLM is unavailable.

## Core Workflow
1. **User request** → Antigravity creates an **implementation plan** and **task list**.
2. **Plan approval** – user reviews the plan (auto‑approved in this session).
3. **Execution** – Antigravity runs the plan, invoking tools in the order defined.
4. **Background tasks** – timers (e.g., image‑generation retry) and async commands are scheduled.
5. **Trace generation** – a snapshot of all tool calls, responses, and generated artifacts is saved as `ANTIGRAVITY_TRACE_SAMPLE.md`.

## Logging Conventions
- Each tool call is logged with a short **toolAction** and **toolSummary**.
- Files created as **artifacts** have a metadata header (`ArtifactMetadata`) that includes the type and whether feedback is required.
- All generated assets are stored under the **`assets/`** folder within the project repository.

## Extending Antigravity
- Add new **sub‑agents** by defining a `define_subagent` call.
- Create additional **background tasks** with the `schedule` tool for long‑running operations.
- Use `manage_task` to monitor or cancel tasks.

## Best Practices
- Keep the implementation plan **declarative** – only specify *what* should be done, not *how*.
- Use **idempotent** file operations (`write_to_file` with `Overwrite:true` only when safe).
- Leverage **fallback heuristics** in the backend agents to ensure resilience when LLM calls fail.
