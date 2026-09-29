# AI Worklog

## 1. AI Tools Used
- **Claude / Gemini**: Used for brainstorming the architecture, understanding Supabase configuration, and generating React components.
- **Antigravity (AI coding assistant)**: Used for automated code reviews, refactoring, and debugging complex edge cases (e.g., Gemini 503 fallback logic, partial JSON streaming parsing, Row Level Security issues, and UX optimizations).

## 2. How AI Helped
- **Speeding up boilerplate**: AI quickly generated the foundational UI components using Tailwind CSS and structured the Zustand store for state management.
- **Data parsing**: AI provided the exact regex to partially parse streaming JSON chunks, allowing the UI to render structured data progressively without breaking.
- **Error handling & UX**: AI suggested the Exponential Backoff retry strategy for APIs, replacing hover-dependent tooltips with Toast notifications for mobile compatibility, and identifying low-contrast accessibility (WCAG) text issues.

## 3. Incorrect AI Outputs & How I Improved Them
- **Issue (Auth & Redundant Data)**: Initially, AI suggested using Supabase `signInAnonymously()`. This caused a major issue where Vercel deployments generated new user IDs upon refresh, blocking access to previously uploaded documents due to Row Level Security (RLS) policies. This also caused massive resource duplication as users re-uploaded the same PDFs.
  - **Fix**: I discarded the anonymous auth approach, guided the AI to implement a permanent Email/Password auth flow, and adjusted `SessionProvider` to force login. This fixed the data loss and optimized storage.
- **Issue (Lost Diacritics in JSON)**: When forcing the AI to return `application/json` with a structured schema, Gemini frequently stripped Vietnamese accents (diacritics) from arrays like `key_points`.
  - **Fix**: I updated the system prompt with a highly strict instruction (`TUYỆT ĐỐI PHẢI VIẾT BẰNG TIẾNG VIỆT CÓ DẤU ĐẦY ĐỦ`) to forcefully overwrite the model's tendency to drop UTF-8 characters during JSON serialization.
- **Issue (Hydration Errors)**: When implementing the Auth context, the AI generated code that placed `<SessionProvider>` alongside a duplicated `{children}` prop in `layout.tsx`, causing Next.js hydration crashes and stripping all Tailwind CSS styles.
  - **Fix**: I carefully analyzed the React DOM tree, removed the duplicated `{children}`, and properly nested the app within the Auth Provider to restore the CSS and layout stability.

## 4. What I Would Improve with 7 More Days
- **Vector Database & RAG**: Move from dumping full extracted text into the prompt to chunking documents, creating embeddings (e.g., using pgvector in Supabase), and retrieving only relevant chunks to save token limits.
- **Citations**: Highlight the exact sentence in the original document that the AI used to generate a specific "Key Point".
- **Better PDF Parsing**: Use a more robust OCR library to handle PDFs with complex tables and images, as `pdf-parse` is limited to plain text.
