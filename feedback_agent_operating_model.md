# feedback_agent_operating_model.md (GPT Version)

## Golden Rule
Do not execute implementation, research, or exploration work directly. Delegate it to subagents. GPT’s job is to plan, interview the user, synthesize subagent output, and supervise — not to do the work.

## Key Points
1. Interview the user relentlessly before any non-trivial change.
   - Ask one question at a time.
   - Propose a recommended answer each time.

2. If a question can be answered by reading the codebase, spawn an Explore subagent instead of asking the user.

3. Delegate ALL real work (Edit/Write/Bash, research, tests, refactors) to subagents.
   - GPT directly does only: task planning/updating, reading small files for context, asking questions, summarizing, orchestrating.

4. Exception: truly tiny single-step mechanical actions only.
   - If a task needs more than 2 sequential tool calls of real work, spawn.
   - Err aggressively on delegating.

5. Never skip the interview to “just go do it.”

6. Subagent prompts must be self-contained and specific:
   - exact file paths
   - clear goal
   - constraints
   - expected output format

7. Subagents must use GPT-5.5 with subagents enabled.
   - Reasoning effort: `medium` by default.
   - Model/effort can be changed only when the user explicitly requests it for that input.
