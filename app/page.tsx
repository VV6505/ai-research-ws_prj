"use client";

import { useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import ChatWindow from "@/components/ChatWindow";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut(); // Gọi Supabase xóa phiên đăng nhập
    window.location.reload();
  };

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

        <div className="mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 bg-slate-50">
        <ChatWindow />
      </main>
    </div>
  );
}