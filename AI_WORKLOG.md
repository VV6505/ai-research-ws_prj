# AI Worklog

## 1. AI Tools Used
- **Claude** (Anthropic) — main working partner for the whole build. Used in a conversational, iterative loop: propose an approach, generate code, I review and apply it file by file, run it, report back the exact runtime error or screenshot, then repeat. Every change went through my own review before being applied, rather than an agent editing files autonomously.
- **Antigravity** (Gemini-based coding agent) — tried at the start for autonomous project scaffolding. It hit its free-tier quota (`HTTP 429 RESOURCE_EXHAUSTED`) during the very first task. Rather than wait on a rate limit, I chose to continue with the Claude conversational workflow above for the rest of the project — this turned out to be a good trade: it forced me to read and understand every file as it was written, which made debugging the real issues below (pdf-parse, hallucinated model names, hydration, mobile keyboard) much faster than if an agent had made those changes for me.
- **Google AI Studio** — provided the free-tier Gemini API key that powers the app's core AI feature.

## 2. How AI Helped
- **Architecture trade-offs**: helped compare Supabase vs. Firebase vs. Azure for this scope, and helped decide between Anonymous Auth vs. real Email/Password auth as requirements evolved.
- **Structured output design**: suggested using Gemini's `responseSchema` (JSON mode) instead of prompting the model to "return JSON" in free text — meaningfully more reliable for a fixed 4-field schema.
- **Streaming structured responses (bonus)**: helped design a client-side regex-based partial-JSON parser (`parsePartial` in `MessageBubble.tsx`) that progressively extracts complete fields from an in-flight JSON stream, so the UI renders the actual structured cards while text is still arriving, instead of showing raw JSON until the stream finishes.
- **Resilience**: suggested exponential-backoff retry plus multi-model fallback for Gemini 429/503 errors, which turned out to be necessary — this exact error was hit live during development.

## 3. Incorrect AI Outputs & How I Improved Them

- **Hallucinated Gemini model names**: When building the multi-model fallback list for resilience, AI included model names that do not exist (`gemini-3.8-flash`) alongside deprecated ones (`gemini-1.5-flash`, `gemini-1.5-pro`). If used as-is, every fallback attempt after the first would have failed with a 404 before ever reaching a working model.
  - **Fix**: Cross-checked each model name against Google's current, actually-available model list and replaced the array with only verified models (`gemini-2.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`).

- **`pdf-parse` breaking change**: AI suggested `pdf-parse` using the classic API (`pdf(buffer).then(data => data.text)`). The version that actually installed (2.4.5) turned out to be a complete rewrite with an incompatible class-based API, causing `pdfParse is not a function` at runtime. A second attempt using `require()` on the package root still failed with `ENOENT: no such file or directory, .../test/data/05-versions-space.pdf` — the library's own `index.js` has an internal debug branch that self-tests against its bundled sample PDF when it detects no `module.parent`, which breaks under Next.js's module bundling.
  - **Fix**: Pinned the dependency to the last stable `1.1.1` (`npm install pdf-parse@1.1.1 --save-exact`) and imported directly from `pdf-parse/lib/pdf-parse.js`, bypassing the buggy `index.js` entry point entirely.

- **Anonymous Auth was the wrong call for this evolving scope**: Early in the project, Supabase Anonymous Auth was chosen (correctly, at the time) to avoid building a login screen for a single-tester prototype. As real multi-session testing began, this caused new anonymous sessions on each fresh browser/incognito test, making documents from a previous session invisible under Row Level Security — which looked like a data-loss bug but was actually the intended isolation behavior of anonymous sessions working as designed.
  - **Fix**: Migrated to real Email/Password authentication (`AuthForm.tsx` + `SessionProvider.tsx`) once persistent, testable accounts became more valuable than a zero-friction login. Also had to disable Supabase's "Confirm email" setting after realizing it would otherwise block a grader from ever logging in without access to the registration email inbox.

- **Low-contrast form inputs on mobile dark mode**: The AI-generated `globals.css` included a `@media (prefers-color-scheme: dark)` block that swapped the global text color to a light shade whenever the OS was in dark mode — but none of the actual input fields had an explicit text color, so they silently inherited near-invisible light-on-light text on real phones with dark mode enabled. This only showed up during on-device mobile testing, not in desktop browser testing.
  - **Fix**: Removed the automatic dark-mode color switch (the app has no dark theme to switch to) and set `color-scheme: light` plus explicit `text-slate-900` / `placeholder:text-slate-400` on every input as a second line of defense.

- **Mobile virtual keyboard covering the chat input**: The initial layout used `h-dvh`, which does not shrink when the on-screen keyboard opens, so the input field stayed hidden behind the keyboard while typing.
  - **Fix**: Added a `useViewportHeight` hook backed by the `window.visualViewport` API to measure the actual visible height and resize the app's root container accordingly, so the input is pushed above the keyboard automatically.

## 4. What I Would Improve with 7 More Days
- **RAG instead of full-text stuffing**: Chunk documents and store embeddings (e.g., `pgvector` in Supabase) so only relevant chunks are retrieved per question, instead of sending the entire extracted text — this would remove the current context-window limitation on large documents.
- **Citations**: Highlight or link back to the exact source sentence a given "Key Point" was derived from.
- **Multiple named conversations**: Currently only the most recent conversation is loaded; a conversation list/switcher would make history genuinely useful for repeat users.
- **Better PDF parsing**: Add OCR support for scanned PDFs and proper table extraction, since `pdf-parse` v1.1.1 is limited to plain text from text-layer PDFs.
- **Automated tests**: Unit tests for the Zod schema validation and the `parsePartial` regex parser, especially around edge cases with escaped quotes and nested brackets in AI-generated content.

