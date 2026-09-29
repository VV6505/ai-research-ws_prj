# AI Research Workspace

A modern web application built for the **7-Day AI Builder Challenge** that helps users efficiently analyze, summarize, and extract actionable insights from multiple documents using AI.

## 1. The Problem
Professionals, researchers, and students often spend hours reading lengthy documents (PDFs, DOCX) to find key information, risks, and next steps. Organizing this information manually is tedious and time-consuming. 

## 2. The Solution
**AI Research Workspace** automates document analysis. Users can upload multiple documents, select them as context, and chat with an AI. Instead of reading through walls of text, the AI returns **highly structured data** rendered as beautiful UI components:
- **Summary**: A quick overview.
- **Key Points**: Bullet points of main ideas.
- **Risks**: Potential issues found in the documents.
- **Actions**: Recommended next steps.

## 3. Architecture & Workflow
- **Frontend**: Next.js (App Router), React 19, TailwindCSS v4.
- **State Management**: Zustand (modular stores for Chat and Documents).
- **Backend / Database**: Supabase (PostgreSQL for history, Storage for files, Row Level Security for privacy).
- **Authentication**: Supabase Auth (Email & Password) integrated to securely isolate user data.
- **AI Integration**: Google Gemini API.
- **Document Processing**: `pdf-parse` and `mammoth` for server-side text extraction.

### Workflow:
1. User logs in via Supabase Email Auth.
2. User uploads files (`.pdf`, `.docx`, `.txt`). Files are stored in Supabase Storage.
3. Next.js API route extracts text and saves it to the PostgreSQL database under the user's ID.
4. User selects documents and asks a question.
5. The server streams the response from Gemini in structured JSON format.
6. The frontend *partially parses* the streaming JSON on-the-fly and renders the structured UI progressively.

## 4. Completed Work & Features
-  **Authentication**: Secure Email/Password login. Built to support robust Row Level Security (RLS) preventing users from seeing each other's files.
-  **Document Management**: Upload parser (PDF, DOCX, TXT) and a Bulk Delete function with modern 3-dot dropdown UI (NotebookLM style).
-  **Structured AI Responses**: Enforced JSON schema via Zod. Strict prompt engineering ensures the retention of Vietnamese diacritics (UTF-8).
-  **Streaming UI**: Custom partial JSON parser allows structured UI rendering during the stream.
-  **Robust Error Handling**: Toast notifications (`react-hot-toast`) for network, upload, and processing errors. Multi-model fallback and exponential backoff retry for Google API 503/429 errors.
-  **UX & Accessibility (Bonus)**: High-contrast text colors to meet WCAG standards, touch-friendly elements (removed hover-only dependencies for mobile), and auto-hiding upload statuses.
-  **Chat History**: Persisted and secured via Supabase.

## 5. Limitations
- **Token Limits**: Currently, the entire extracted text is sent to the LLM. Extremely large documents might exceed the context window. (Future fix: Implement RAG with pgvector).
- **Image/Table parsing**: The current parser (`pdf-parse`) only extracts plain text, ignoring images and complex table structures in PDFs.

## 6. How to Run Locally
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env.local` file with your Supabase and Gemini credentials.
4. Run `npm run dev`.
