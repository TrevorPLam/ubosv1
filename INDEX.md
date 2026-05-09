Here is the precise specification for file headers and inline commentary, designed for an agentic coding workflow.

---

## 1. File Header Specification

Every non‑generated source file **must** begin with a comment block in the language’s documentation syntax.  
(Typescript/JavaScript → `/** … */`; YAML → `#` lines; CSS → `/* … */`)

### Required Tags

| Tag | Value | Example |
|-----|-------|---------|
| `@file` | Relative path from repository root | `lib/db/src/schema/auth.ts` |
| `@module` | The bounded context or domain area (taken from your DDD map) | `Identity and Access` |
| `@purpose` | One sentence describing what the file *does* | `Drizzle schema for user, session, role, and permission tables` |
| `@ai_instructions` | Permanent rules the AI agent must obey when editing this file | `All tables must export insert schema via drizzle-zod` |
| `@copyright` | `SPDX-FileCopyrightText: YYYY Name <email>` | `SPDX-FileCopyrightText: 2025 Jane Doe <jane@example.org>` |
| `@license` | `SPDX-License-Identifier: LICENSE` | `SPDX-License-Identifier: MIT` |

### Optional Tags (add when useful)

| Tag | Value | Example |
|-----|-------|---------|
| `@owner` | Maintainer username or team | `@owner database-team` |
| `@exports` | Key symbols exported by this file (helps agent search) | `authRouter, requireAuth` |
| `@imports` | Critical external dependencies | `drizzle-orm/pg-core, zod` |
| `@see` | Link to spec, design doc, or task ticket | `@see TASK-004 in TODO.md` |
| `@generated` | If present with value `true`, the agent must **not** edit the file | `@generated true` |

### Writing `@ai_instructions`

Use bullet points, each on a new line, indented under the tag. Give direct, negative, and positive rules.  
Examples:
- `All exported functions must have explicit return types.`  
- `DO NOT add Node.js‑only APIs; this file must be isomorphic.`  
- `Status fields must use enums, not free‑text strings.`  
- `This file is generated; do not edit.`

### Full Header Template (TypeScript)

```typescript
/**
 * @file        __RELATIVE_PATH__
 * @module      __MODULE__
 * @purpose     __ONE_LINE_PURPOSE__
 *
 * @ai_instructions
 *   - __RULE_1__
 *   - __RULE_2__
 *   - DO NOT __FORBIDDEN_ACTION__
 *
 * @exports     __KEY_SYMBOLS__
 * @see         __LINK__
 *
 * @copyright   SPDX-FileCopyrightText: __YEAR__ __NAME__ <__EMAIL__>
 * @license     SPDX-License-Identifier: __LICENSE__
 */
```

### Example 1 – Database schema file

```typescript
/**
 * @file        lib/db/src/schema/auth.ts
 * @module      Identity and Access
 * @purpose     Drizzle schema for users, sessions, roles, permissions, and workspace memberships
 *
 * @ai_instructions
 *   - All tables must use `pgTable` from drizzle‑orm/pg‑core.
 *   - Each table must export an insert schema via `createInsertSchema` from drizzle‑zod.
 *   - Status fields must be enums (not strings).
 *   - DO NOT add tables from other domains to this file.
 *
 * @exports     usersTable, sessionsTable, rolesTable, permissionsTable, workspaceMembershipsTable
 *              insertUserSchema, insertSessionSchema, … (all insert schemas)
 * @see         TASK-004 in TODO.md
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Jane Doe <jane@example.org>
 * @license     SPDX-License-Identifier: MIT
 */
```

### Example 2 – Middleware

```typescript
/**
 * @file        artifacts/api-server/src/middlewares/require-auth.ts
 * @module      Identity and Access / Middleware
 * @purpose     Express middleware that rejects requests without a valid session
 *
 * @ai_instructions
 *   - Must call next() on success; never swallow errors silently.
 *   - Error responses must use the shared error‑handler format.
 *   - DO NOT log credentials.
 *
 * @exports     requireAuth
 */
```

---

## 2. Inline AI Commentary Specification

Use specially prefixed comments to give the agent localised instructions. The prefixes are:

| Prefix | Purpose |
|--------|---------|
| `// AI‑NOTE:` | Explain non‑obvious logic the agent must preserve. |
| `// AI‑WARN:` | Mark fragile or dangerous code that requires careful approval before change. |
| `// AI‑TODO:` | A task that the agent may autonomously complete later (structured TODO). |
| `// AI‑IGNORE‑START` | Begin a block the agent must leave completely untouched. |
| `// AI‑IGNORE‑END` | End of the ignored block. |

### Usage Rules

- Each directive must be on its own line, immediately before the relevant code.
- `AI‑WARN` must always state **why** the code is dangerous.
- The agent must **not** modify code inside an `AI‑IGNORE‑START` / `AI‑IGNORE‑END` block unless explicitly instructed otherwise.
- Inline directives override file‑level `@ai_instructions` for that specific section (local overrides global).

### Example 1 – Warning about fragile logic

```typescript
function calculateRetryDelay(attempt: number): number {
  // AI‑WARN: Exponential backoff must remain in sync with the API gateway timeout.
  // Changing this without updating the gateway config will break long‑running agent calls.
  return Math.min(1000 * 2 ** attempt, 30000);
}
```

### Example 2 – Ignored block (workaround)

```typescript
// AI‑IGNORE‑START
// Workaround for library bug #4321; do not refactor until the library is updated.
const unsafeCast = (data as unknown) as LegacyFormat;
// AI‑IGNORE‑END
processValidatedData(unsafeCast);
```

### Example 3 – Agent TODO

```typescript
// AI‑TODO: Replace this mock with a real API call once the `getClientDetails` endpoint is live.
const client = mockClientData;
```

---

## 3. Enforcement & Verification

To keep agents from breaking the standard, enforce these checks:

1. **Header lint script** – run in pre‑commit (e.g., with `husky`). Script must verify that every non‑generated source file contains the required `@file`, `@module`, `@purpose`, `@ai_instructions`, `@copyright`, and `@license` tags.

2. **Agent system prompt** – include:
   > “Before editing any file, read its header and any `AI‑WARN` / `AI‑NOTE` comments inside the function you are about to change. If you cannot comply with the local instructions, stop and ask for clarification.”

3. **Generated files** – must carry `@generated true`. The header lint must allow missing `@ai_instructions` for such files but still require a minimal `@file` and SPDX tags.

---

This standard gives your agents a deterministic map of every file, preventing path drift, design violations, and dangerous edits. Adopt it once, then let automation keep it clean.