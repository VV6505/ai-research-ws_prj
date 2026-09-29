"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDocumentsStore } from "@/lib/store/useDocumentsStore";
import EmptyState from "./EmptyState";
import toast from "react-hot-toast";

export default function DocumentList() {
    const documents = useDocumentsStore((s) => s.documents);
    const setDocuments = useDocumentsStore((s) => s.setDocuments);
    const removeDocument = useDocumentsStore((s) => s.removeDocument);
    const selectedIds = useDocumentsStore((s) => s.selectedIds);
    const toggleSelected = useDocumentsStore((s) => s.toggleSelected);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

    async function handleDeleteSelected() {
        if (selectedIds.length === 0) return;

        // Hỏi lại trước khi xóa
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} tài liệu đã chọn?`)) return;

        setIsDeleting(true);
        const supabase = createClient();

        // Lọc ra danh sách storage_path của các file được tick
        const docsToDelete = documents.filter(doc => selectedIds.includes(doc.id));
        const storagePaths = docsToDelete.map(doc => doc.storage_path);

        // Xóa hàng loạt từ Storage
        if (storagePaths.length > 0) {
            await supabase.storage.from("documents").remove(storagePaths);
        }

        // Xóa hàng loạt từ Database (dùng lệnh .in)
        const { error: dbError } = await supabase.from("documents").delete().in("id", selectedIds);

        if (!dbError) {
            // Gọi removeDocument cho từng ID đã xóa để xóa khỏi giao diện
            selectedIds.forEach(id => removeDocument(id));
            toast.success('Đã xóa thành công');
        }
        setIsDeleting(false);
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

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();

        if (ext === 'pdf') {
            return (
                <span className="flex items-center justify-center rounded p-1 text-red-600 bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </span>
            );
        }

        if (ext === 'docx' || ext === 'doc') {
            return (
                <span className="flex items-center justify-center rounded p-1 text-blue-600 bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
            );
        }

        return (
            <span className="flex items-center justify-center rounded p-1 text-slate-500 bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </span>
        );
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Tài liệu ({documents.length})
                </p>

                {selectedIds.length > 1 && (
                    <button
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                        {isDeleting ? "Đang xóa..." : "Xóa đã chọn"}
                    </button>
                )}
            </div>

            <ul className="space-y-1.5">
                {documents.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    return (
                        <li
                            key={doc.id}
                            className={`group relative flex items-center justify-between rounded-lg border px-3 py-2 transition ${isSelected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                        >
                            {/* Phần Tên file bên trái */}
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">

                                {getFileIcon(doc.name)}

                                <span className="truncate text-sm font-medium text-slate-700">{doc.name}</span>
                            </div>

                            {/* Phần 3 chấm & Checkbox bên phải */}
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                {/* Cụm 3 chấm */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                        }}
                                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                        </svg>
                                    </button>

                                    {/* Hộp Dropdown hiện ra khi bấm */}
                                    {openMenuId === doc.id && (
                                        <div
                                            className="absolute right-0 top-full mt-1 w-36 z-10 rounded-lg border border-slate-200 bg-white shadow-lg py-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => {
                                                    handleDelete(doc.id, doc.storage_path);
                                                    setOpenMenuId(null);
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                                            >
                                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Xóa nguồn
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelected(doc.id)}
                                    className="h-4 w-4 ml-1 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}