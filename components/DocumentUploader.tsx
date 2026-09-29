"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDocumentsStore } from "@/lib/store/useDocumentsStore";

type UploadStatus = "uploading" | "extracting" | "done" | "error";

interface UploadItem {
    fileName: string;
    status: UploadStatus;
    errorMessage?: string;
}

export default function DocumentUploader() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const addDocument = useDocumentsStore((s) => s.addDocument);

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setUploads((prev) => [
                ...prev,
                { fileName: "?", status: "error", errorMessage: "Chưa có phiên làm việc" },
            ]);
            return;
        }

        for (const file of Array.from(files)) {
            const allowed = [".txt", ".pdf", ".docx"];
            const isAllowed = allowed.some((ext) =>
                file.name.toLowerCase().endsWith(ext)
            );

            if (!isAllowed) {
                setUploads((prev) => [
                    ...prev,
                    { fileName: file.name, status: "error", errorMessage: "Chỉ hỗ trợ .txt, .pdf, .docx" },
                ]);
                continue;
            }

            setUploads((prev) => [...prev, { fileName: file.name, status: "uploading" }]);

            const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(storagePath, file);

            if (uploadError) {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.fileName === file.name
                            ? { ...u, status: "error", errorMessage: uploadError.message }
                            : u
                    )
                );
                continue;
            }

            setUploads((prev) =>
                prev.map((u) => (u.fileName === file.name ? { ...u, status: "extracting" } : u))
            );

            try {
                const res = await fetch("/api/documents/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storagePath, name: file.name }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error ?? "Xử lý tài liệu thất bại");
                }

                addDocument(data);
                setUploads((prev) =>
                    prev.map((u) => (u.fileName === file.name ? { ...u, status: "done" } : u))
                );
            } catch (err) {
                const message = err instanceof Error ? err.message : "Lỗi không xác định";
                setUploads((prev) =>
                    prev.map((u) =>
                        u.fileName === file.name ? { ...u, status: "error", errorMessage: message } : u
                    )
                );
            }
        }
    }

    return (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40">
            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.docx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tải tài liệu lên
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">.txt · .pdf · .docx</p>

            {uploads.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                    {uploads.map((u, i) => (
                        <li key={i} className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 shadow-sm">
                            <span className="truncate text-slate-700">{u.fileName}</span>
                            {u.status === "uploading" && <span className="shrink-0 text-xs text-slate-400">Đang tải...</span>}
                            {u.status === "extracting" && <span className="shrink-0 text-xs text-slate-400">Đang xử lý...</span>}
                            {u.status === "done" && <span className="shrink-0 text-xs font-medium text-emerald-600">✓ Xong</span>}
                            {u.status === "error" && (
                                <span className="shrink-0 text-xs font-medium text-red-500" title={u.errorMessage}>✕ Lỗi</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
