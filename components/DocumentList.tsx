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
            <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-600">Không tải được danh sách tài liệu: {error}</p>;
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
        <ul className="space-y-1">
            {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2">
                    <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(doc.id)}
                            onChange={() => toggleSelected(doc.id)}
                        />
                        <span className="truncate text-sm">{doc.name}</span>
                    </label>
                    <button
                        onClick={() => handleDelete(doc.id, doc.storage_path)}
                        className="text-xs text-red-500 hover:underline shrink-0 ml-2"
                    >
                        Xoá
                    </button>
                </li>
            ))}
        </ul>
    );
}