"use client";

import { useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-slate-50 md:flex-row">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            AI
          </div>
          <h1 className="text-base font-semibold text-slate-900">Research Workspace</h1>
        </div>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {sidebarOpen ? "Đóng" : "Tài liệu"}
        </button>
      </header>

      <aside
        className={`${sidebarOpen ? "flex" : "hidden"} w-full flex-col gap-5 overflow-y-auto border-b border-slate-200 bg-white p-5 md:flex md:w-80 md:shrink-0 md:border-b-0 md:border-r`}
      >
        <div className="hidden items-center gap-2.5 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">
            AI
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Research Workspace</h1>
            <p className="text-xs text-slate-500">Tài liệu &amp; trợ lý AI</p>
          </div>
        </div>

        <DocumentUploader />
        <DocumentList />
      </aside>

      <main className="min-h-0 min-w-0 flex-1 bg-slate-50">
        <ChatWindow />
      </main>
    </div>
  );
}