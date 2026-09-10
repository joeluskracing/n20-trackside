# Trackside v2

A private, session-based racecar notebook rebuilt from [n20-trackside](https://github.com/joeluskracing/n20-trackside). The original Electron application informed the configurable parts, corner grouping, garage checkpoints, and pre/post-run notes. This version is a mobile-friendly web application.

## Use it

1. Create a **Garage — Baseline** session. Enter known values directly in the corner cards; unknowns stay blank.
2. Create a track session such as **Clinton County — Hot laps**. Its settings copy the selected baseline; results and notes start empty.
3. Type or dictate changes into the bottom composer. Basic commands work immediately: `RR spring 225; right front tire pressure 12 psi; started 8 finished 4`.
4. Select **Record this run** before going on track. This locks the setup for that run. Results and driver feedback remain editable.
5. Select **Next session** for changes made after the run. Name and color it in the inline form.
6. The visible **CSV** and **PDF** actions export the session or open the printable report. Whole-race and revision-history CSV exports are in the change log.

Results, conditions, and before/after/driver notes are on the main screen. Setup and note fields save on blur (or Enter for single-line fields), with serialized writes using the latest session revision. Failed edits remain visible with a save button and are retained as drafts on this device. The paper-colored chassis locator uses the same orthographic projection for its frame, axles, and tires. Additional settings expand within each card; field definitions and units remain in an optional customization panel.

Voice capture stops after 90 seconds. With AI connected, the recording is transcribed and clear adjustments are saved after you stop. Where browser speech recognition exists, basic voice commands also work before AI is connected. Ambiguous entries, photos, new sessions, and cross-session routing are staged for review. Original messages and revision changes are retained. Failed requests leave the draft intact; text drafts are temporarily retained on the current device. This is not a fully offline PWA, and AI requires a network connection.

## AI connection

Use **Connect AI** inside the private app, or configure `OPENAI_API_KEY` as a server secret. The in-app connection encrypts each user's key with AES-GCM, binds it to that user as additional authenticated data, and stores only ciphertext. Set `TRACKSIDE_VAULT_KEY` to 32 random bytes encoded in base64 through server secret management. Never commit either secret. API keys are never returned to clients or included in exports.

- Text/photo interpretation: OpenAI Responses API, `gpt-4.1-mini`, strict JSON schema, `store: false`, 4,000 output-token maximum.
- Recording transcription: `gpt-4o-mini-transcribe`, English racing vocabulary prompt.
- Maximum 100 combined AI/transcription requests per user per UTC day; no background AI jobs.
- ChatGPT subscription billing and OpenAI API billing are separate. No paid API call was made during the initial build because no API key was connected.
- Relative changes only resolve when the starting number, units, and direction are explicit. Softer/stiffer and hole direction require a recorded reference convention. Photos read written values, not inferred chassis dimensions.

OpenAI references: [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Image inputs](https://developers.openai.com/api/docs/guides/images-vision), [Transcription](https://developers.openai.com/api/docs/guides/speech-to-text).

## Data and portability

Every complete session state is serialized into CSV and stored verbatim in the `sessions.csv` column and append-only `revisions.csv` column. SQLite/D1 provides indexing, atomic writes, ownership checks, and optimistic revision locking. The CSV text is the authoritative setup representation; no JSON-only setup database is hidden behind the export. Photos live in private R2 object storage, with ownership metadata in D1.

The session CSV contains eight columns:

`record_type,key,corner,label,value,unit,kind,reference`

Record types are schema, session, setting, note, and attachment. Fields include full session identity, exact setting values and units, text/table values, reference conventions, results, and notes. Formula-like cells are escaped with a leading apostrophe; literal leading apostrophes are doubled. The Trackside reader reverses this encoding exactly. See `lib/trackside/csv.ts`.

Importing creates a separate session. It never overwrites another session, and it does not claim to recreate attachment bytes from CSV metadata. The whole-race CSV is a flat comparison report, not a session-import format. History CSV includes the original messages, change details, and complete CSV for every revision. CSV exports don't include image bytes or API credentials.

The repository's legacy SQLite data contains old/demo car records. It was inspected to recover the field model, not treated as the current car or imported as live racing history. New baseline values are deliberately blank. Legacy Electron CSV formats require a dedicated mapper; only the documented v2 session CSV is currently importable.

## Develop

Node 24+, pnpm (version pinned in `package.json`), Cloudflare-compatible Workers runtime.

```sh
pnpm install
pnpm dev
pnpm build
pnpm db:generate
node tests/run.mjs
```

Follow the included starter scripts for standalone development and the Sites workflow for private hosting. The logical bindings are D1 `DB` and R2 `BUCKET`. Run generated `drizzle/*.sql` migrations in order before using the app. Production uses dispatch-owned ChatGPT sign-in; every API query and mutation checks user identity and object ownership. Never make the private notebook public to work around sign-in.

The shared Sites source checkout preserves its own `.openai/hosting.json` identity. A portable GitHub copy omits that specific project ID; register a separate Site when deploying another instance.

## Validation and boundaries

- Production build and TypeScript check.
- Thirteen domain/route tests using the actual handlers and real SQLite transactions with test-only dispatch and object storage bindings: CSV round trips, fractions, malicious spreadsheet prefixes, invalid input, setup inheritance, unknown deltas, unit mismatches, session locking, identity isolation, retries, undo, import/export, and note preservation.
- No browser, microphone-hardware, real AI-response, or supported WebMCP runtime test was performed in the initial build. Those are the next acceptance checks after connecting an API key and using the app on a phone.
- The WebMCP helpers expose read-session and stage-entry actions. Staging only fills the composer; it does not claim to save a setup.
- The chassis is an isometric locator schematic, not a simulation or measured Lazer drawing.

This is the first personal version. Before a public release, validate trackside recording quality, offline behavior, API costs, and model extraction against real setup notes and photos. Don't represent model extraction as guaranteed correct.
