# AI Research Workspace

**Live Demo URL**: https://ai-research-ws-prj.vercel.app/
**GitHub Repository**: https://github.com/VV6505/ai-research-ws_prj

**Tài khoản Demo** (hoặc tự đăng ký mới — không cần xác nhận email):
- Email: demo@example.com
- Password: Demo1234

A web application built for the **7-Day AI Builder Challenge** that helps users analyze, summarize, and extract structured insights from multiple documents using AI.

## Submission Checklist

| Deliverable | Where to find it |
|---|---|
| Live URL | https://ai-research-ws-prj.vercel.app/ (demo account above, or register a new one) |
| Source code | https://github.com/VV6505/ai-research-ws_prj |
| Architecture description | [Section 3 — Architecture & Workflow](#3-architecture--workflow) below |
| README | [README.md](./README.md) |
| Demo video (≤ 5 min) | *[https://drive.google.com/file/d/1BAYOwc6fVWF3S4aYi0SOIAZPNV-_LP5v/view?usp=sharing]* |
| `AI_WORKLOG.md` | [AI_WORKLOG.md](./AI_WORKLOG.md) — tools used, how AI helped, incorrect outputs and how they were fixed, 7-day improvement plan |

## 1. The Problem
Professionals, researchers, and students often spend hours reading lengthy documents (PDFs, DOCX) to find key information, risks, and next steps. Organizing this information manually is tedious and time-consuming.

## 2. The Solution
**AI Research Workspace** automates document analysis. Users upload documents, select them as context, and chat with an AI. Instead of a wall of plain text, the AI returns **structured data** rendered as UI cards:
- **Summary** — quick overview
- **Key Points** — main ideas as bullets
- **Risks** — potential issues found
- **Actions** — recommended next steps

## 3. Architecture & Workflow

```
Browser (Next.js Client Components)
   │
   ├─ Auth ──────► Supabase Auth (Email/Password)
   │
   ├─ Upload file ──► Supabase Storage ──► /api/documents/extract ──► Postgres (documents)
   │
   └─ Ask question ──► /api/chat ──► Gemini API (streaming, structured output)
                                        │
                                        └─► Postgres (conversations, messages)
```

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **State Management**: Zustand (separate stores for chat and documents)
- **Backend**: Next.js Route Handlers (`/api/documents/extract`, `/api/chat`)
- **Database & Auth**: Supabase Postgres (Row Level Security) + Supabase Email/Password Auth
- **Storage**: Supabase Storage for uploaded files

> **Note on Auth**: Authentication is not a requirement of this challenge, but
> Email/Password auth was added on top of Supabase (rather than staying fully
> anonymous) to properly demonstrate Row Level Security isolating each user's own
> documents and conversation history — a deliberate architecture choice, not a
> hard requirement. Email confirmation is disabled so a grader can register and
> log in immediately without needing access to an inbox.
- **AI**: Google Gemini API (`gemini-2.5-flash` with automatic fallback to `gemini-3.5-flash-lite` / `gemini-3.6-flash`), using `responseSchema` to enforce structured JSON output, called via streaming
- **Validation**: Zod — every AI response is validated before being rendered
- **Document Processing**: `pdf-parse` (v1.1.1, pinned) for PDF, `mammoth` for DOCX

### Request flow for one question:
1. User logs in (Email/Password via Supabase Auth).
2. User selects one or more uploaded documents (checkboxes).
3. User types a question and hits send — the message appears instantly (optimistic UI).
4. `/api/chat` builds a prompt combining the selected documents' extracted text with the question, then calls Gemini with a `responseSchema` enforcing `{ summary, key_points, risks, actions }`.
5. The response is **streamed** token-by-token back to the client.
6. While streaming, a client-side partial-JSON parser extracts whatever fields are already complete and renders them progressively inside the same structured card UI (not raw JSON) — this satisfies the bonus "streaming structured responses".
7. Once the stream ends, the full response is validated with Zod:
   - Valid → saved as the final structured card
   - Invalid → falls back to raw text display with a "Định dạng không chuẩn" badge, no crash
8. The question and answer are persisted to `messages` so they survive a page refresh.

### Example prompt fragment (see `app/api/chat/route.ts` for the full version):
```
Hãy trả lời theo đúng cấu trúc JSON được yêu cầu.
Nếu câu hỏi yêu cầu trích dẫn nguyên văn hoặc giải thích 1 chi tiết cụ thể, hãy đặt
nội dung chính vào "summary", để key_points/risks/actions trống nếu không có nội
dung phù hợp — không cố bịa thêm nội dung không liên quan chỉ để lấp đầy khuôn.
```

## 4. AI Usage
- **Google Gemini** (`gemini-2.5-flash` + fallback models) — core engine for document analysis and structured JSON generation.
- **AI coding assistants** (Claude, Antigravity) — used throughout for architecture decisions, code generation, and debugging real runtime errors (see `AI_WORKLOG.md` for the full, honest account, including mistakes and how they were caught and fixed).

## 5. Completed Work & Features
- ✅ Document upload (.txt, .pdf, .docx) with per-file progress and error states
- ✅ Chat with AI grounded in selected document(s)
- ✅ **Streaming AI responses**, including progressive rendering of the structured UI while streaming (bonus)
- ✅ Structured JSON enforced via Gemini `responseSchema` + Zod validation, rendered as color-coded cards — never raw JSON
- ✅ Conversation history persisted in Supabase, restored on page refresh
- ✅ Regenerate an answer — overwrites the same DB row in place, does not duplicate or move position in the thread
- ✅ Copy an answer to clipboard (plain-text formatted)
- ✅ Loading / empty / error states across every async interaction
- ✅ Responsive: two-column layout on desktop, collapsible sidebar drawer on mobile; fixed mobile keyboard covering the chat input using `visualViewport`
- ✅ Multi-model fallback + exponential backoff retry for Gemini 429/503 errors
- ✅ Email/Password authentication with Row Level Security isolating each user's documents and conversations
- ✅ **Optimistic UI (bonus)** — user messages and loading placeholders render instantly on send
- ✅ **Accessibility fix (bonus)** — forced light `color-scheme` and explicit text colors on all inputs to prevent OS dark-mode from producing low-contrast, hard-to-read form fields on mobile

## 6. Edge Cases Handled
- No document selected → blocked client-side with an inline warning, no API call made
- Empty `.txt` file upload → graceful error, no crash
- Network dropped mid-request → "Không kết nối được máy chủ" shown with a retry option
- Gemini 503/429 (model overloaded) → automatic fallback across 3 models with exponential backoff before surfacing an error to the user
- AI returns malformed/incomplete JSON → falls back to raw text with a "Định dạng không chuẩn" badge instead of crashing
- Regenerate reuses the same DB row (verified in Supabase — no duplicate rows after repeated regenerations)
- Mobile virtual keyboard no longer covers the input field (fixed via `visualViewport` height tracking)

## 7. Limitations
- **Fixed schema**: Answers are always structured into 4 fields (summary/key_points/risks/actions), matching the challenge's example schema. For questions that don't naturally fit this shape (e.g. "quote this exact sentence"), the prompt instructs the model to leave unused fields empty rather than padding them with irrelevant content — a deliberate trade-off to keep the schema (and the partial-JSON streaming parser, which matches on these exact field names) simple and predictable, rather than moving to a dynamic section-based schema.
- **No chunking / RAG**: Full extracted text is sent directly in the prompt. Very large documents may exceed the model's context window.
- **PDF text only**: `pdf-parse` extracts plain text; scanned/image-based PDFs and complex tables are not supported.
- **Single active conversation**: The app currently loads and continues the most recent conversation rather than supporting multiple named conversation threads.
- Browser security-extension conflicts (e.g. antivirus toolbars) may cause a harmless "hydration mismatch" warning in the dev console (`bis_skin_checked` attribute injection) — does not occur in production.

## 8. How to Run Locally
```bash
npm install
```
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```
Run the SQL migration in `supabase/migrations/0001_init.sql` via the Supabase SQL Editor, then:
```bash
npm run dev
```
On first run, register a new account (email confirmation is disabled in this project's Supabase settings for convenience), or use the demo credentials above.

