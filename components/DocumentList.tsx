"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDocumentsStore } from "@/lib/store/useDocumentsStore";
import EmptyState from "./EmptyState";

export default function DocumentList() {
    const documents = useDocumentsStore((s) => s.documents);
    const setDocuments = useDocumentsStore((s) => s.setDocuments);
    const removeDocument = useDocumentsStore((s) => s.removeDocument);
    const selectedIds = useDocumentsStore((s) => s.selectedIds);
    const toggleSelected = useDocumentsStore((s) => s.toggleSelected);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDocuments() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setDocuments(data ?? []);
            }
            setLoading(false);
        }

        loadDocuments();
    }, [setDocuments]);

    async function handleDelete(id: string, storagePath: string) {
        const supabase = createClient();
        await supabase.storage.from("documents").remove([storagePath]);
        const { error } = await supabase.from("documents").delete().eq("id", id);
        if (!error) removeDocument(id);
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            </div>
        );
    }

    if (error) {
        return (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Không tải được danh sách tài liệu: {error}
            </p>
        );
    }

    if (documents.length === 0) {
        return (
            <EmptyState
                title="Chưa có tài liệu nào"
                description="Tải lên tài liệu để bắt đầu đặt câu hỏi cho AI."
            />
        );
    }

    return (
        <div className="space-y-1.5">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Tài liệu ({documents.length})
            </p>
            <ul className="space-y-1.5">
                {documents.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    return (
                        <li
                            key={doc.id}
                            className={`group flex items-center justify-between rounded-lg border px-3 py-2 transition ${isSelected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                        >
                            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelected(doc.id)}
                                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="truncate text-sm text-slate-700">{doc.name}</span>
                            </label>
                            <button
                                onClick={() => handleDelete(doc.id, doc.storage_path)}
                                className="shrink-0 text-xs text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                            >
                                Xoá
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}