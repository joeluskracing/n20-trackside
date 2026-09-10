# Implementation map

- `app/page.tsx`: authenticated entry point.
- `components/trackside/workspace.tsx`: session history, setup editor, microphone/photo composer, notes and revision history.
- `components/trackside/chassis.tsx`: projected chassis locator with accessible corner controls.
- `lib/trackside/model.ts`: setup fields, immutable carry-forward, exact-value delta application and change calculation.
- `lib/trackside/csv.ts`: canonical CSV serialization, spreadsheet-safe escaping and import validation.
- `lib/trackside/parser.ts`: deterministic basic commands that do not consume AI calls.
- `lib/trackside/ai.ts`: encrypted API key storage, structured extraction, photo input and transcription.
- `lib/trackside/store.ts`: D1 persistence, atomic updates, request receipts, revision history and usage caps.
- `app/api/trackside/route.ts`: authenticated ownership-scoped actions, exports and R2 attachments.
- `app/report`: print-friendly setup sheet for browser PDF output.
- `db/schema.ts`, `drizzle`: durable schema and immutable migrations.
- `tests/run.mjs`: domain and handler tests using real SQLite with isolated test platform bindings.

## Correctness rules

A session is a complete setup, not a delta chain. New sessions deep-copy settings, preserve the parent ID, and reset outcome notes. An on-track session's setup is locked; metadata and results can be amended with a new revision. Existing snapshots never get rewritten. A request ID identifies a mutation receipt, making a retry safe. The expected revision prevents two devices overwriting each other. D1 batches roll back if another writer consumes that session revision first.

AI does not write the database. It produces validated proposed changes. Code applies only explicit, unit-matched changes, and performs relative arithmetic from known values. New or different session targets and photo extractions require visible review. Unknown information and questions are preserved as notes if the user saves them. The original text is retained in revision history.

No API key, uploaded evidence, or live session CSV belongs in source control. Connection state exposes only whether a key is configured. Authenticated API responses and reports do not use public caches.
