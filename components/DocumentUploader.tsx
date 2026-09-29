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
        <div className="border border-dashed border-gray-300 rounded-lg p-4">
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
                className="w-full py-2 px-4 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
            >
                + Tải tài liệu lên (.txt, .pdf, .docx)
            </button>

            {uploads.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                    {uploads.map((u, i) => (
                        <li key={i} className="flex items-center justify-between">
                            <span className="truncate">{u.fileName}</span>
                            {u.status === "uploading" && <span className="text-gray-400">Đang tải lên...</span>}
                            {u.status === "extracting" && <span className="text-gray-400">Đang xử lý...</span>}
                            {u.status === "done" && <span className="text-green-600">✓ Xong</span>}
                            {u.status === "error" && (
                                <span className="text-red-600" title={u.errorMessage}>✕ Lỗi</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}