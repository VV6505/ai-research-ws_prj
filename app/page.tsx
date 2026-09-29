"use client";

import { useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:hidden">
        <h1 className="text-base font-semibold">AI Research Workspace</h1>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm"
        >
          {sidebarOpen ? "Đóng" : "Tài liệu"}
        </button>
      </header>

      <aside
        className={`${sidebarOpen ? "block" : "hidden"} md:block w-full md:w-80 shrink-0 space-y-4 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 p-4`}
      >
        <h1 className="hidden md:block text-lg font-semibold">AI Research Workspace</h1>
        <DocumentUploader />
        <DocumentList />
      </aside>

      <main className="min-h-0 min-w-0 flex-1">
        <ChatWindow />
      </main>
    </div>
  );
}