"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnswerSchema } from "@/lib/schema";
import { useChatStore, type ChatMessage } from "@/lib/store/useChatStore";
import { useDocumentsStore } from "@/lib/store/useDocumentsStore";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";

interface DbMessage {
    id: string;
    question: string | null;
    status: "loading" | "done" | "error";
    structured_response: unknown;
    raw_response: string | null;
    error_message: string | null;
}

const SAMPLE_QUESTIONS = [
    "Tóm tắt nội dung chính của tài liệu",
    "Có những rủi ro nào được đề cập?",
    "Cần làm gì tiếp theo dựa trên tài liệu này?",
];

export default function ChatWindow() {
    const messages = useChatStore((s) => s.messages);
    const conversationId = useChatStore((s) => s.conversationId);
    const setMessages = useChatStore((s) => s.setMessages);
    const addMessage = useChatStore((s) => s.addMessage);
    const updateMessage = useChatStore((s) => s.updateMessage);
    const setConversationId = useChatStore((s) => s.setConversationId);
    const selectedIds = useDocumentsStore((s) => s.selectedIds);

    const [input, setInput] = useState("");
    const [historyLoading, setHistoryLoading] = useState(true);
    const [notice, setNotice] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Tải lịch sử cuộc trò chuyện gần nhất
    useEffect(() => {
        async function loadHistory() {
            const supabase = createClient();
            const { data: conv } = await supabase
                .from("conversations")
                .select("id")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (conv) {
                const { data: rows } = await supabase
                    .from("messages")
                    .select("id, question, status, structured_response, raw_response, error_message")
                    .eq("conversation_id", conv.id)
                    .order("created_at", { ascending: true });

                const restored: ChatMessage[] = ((rows ?? []) as DbMessage[]).map((r) => {
                    const parsed = AnswerSchema.safeParse(r.structured_response);
                    const interrupted = r.status === "loading";
                    return {
                        id: crypto.randomUUID(),
                        dbId: r.id,
                        question: r.question ?? "",
                        status: interrupted ? "error" : r.status,
                        structured: parsed.success ? parsed.data : undefined,
                        rawResponse: r.raw_response ?? undefined,
                        errorMessage: interrupted ? "Yêu cầu bị gián đoạn, hãy thử lại." : r.error_message ?? undefined,
                    };
                });

                setConversationId(conv.id);
                setMessages(restored);
            }
            setHistoryLoading(false);
        }

        loadHistory();
    }, [setConversationId, setMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function ask(localId: string, question: string, dbId?: string) {
        updateMessage(localId, { status: "loading", errorMessage: undefined, rawResponse: undefined });

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question,
                    documentIds: selectedIds,
                    conversationId,
                    messageId: dbId,
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Lỗi máy chủ");

            if (data.conversationId) setConversationId(data.conversationId);

            if (data.status === "done") {
                updateMessage(localId, {
                    dbId: data.id,
                    status: "done",
                    structured: data.structured_response,
                });
            } else {
                updateMessage(localId, {
                    dbId: data.id,
                    status: "error",
                    rawResponse: data.raw_response,
                    errorMessage: data.error ?? "AI không trả lời được.",
                });
            }
        } catch (err) {
            updateMessage(localId, {
                status: "error",
                errorMessage: err instanceof Error ? err.message : "Không kết nối được máy chủ",
            });
        }
    }

    function guardDocuments(): boolean {
        if (selectedIds.length === 0) {
            setNotice("Hãy chọn ít nhất 1 tài liệu ở danh sách bên cạnh trước khi hỏi.");
            return false;
        }
        setNotice(null);
        return true;
    }

    function handleSend(text: string) {
        const question = text.trim();
        if (!question || !guardDocuments()) return;

        const localId = crypto.randomUUID();
        addMessage({ id: localId, question, status: "loading" });
        setInput("");
        ask(localId, question);
    }

    function handleRegenerate(message: ChatMessage) {
        if (!guardDocuments()) return;
        ask(message.id, message.question, message.dbId);
    }

    const hasLoading = messages.some((m) => m.status === "loading");

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {historyLoading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-8 w-1/2 ml-auto rounded bg-gray-100" />
                        <div className="h-24 w-4/5 rounded bg-gray-100" />
                    </div>
                ) : messages.length === 0 ? (
                    <div>
                        <EmptyState
                            title="Chưa có tin nhắn nào"
                            description="Chọn tài liệu bên cạnh rồi đặt câu hỏi, hoặc thử một gợi ý:"
                        />
                        <div className="flex flex-wrap justify-center gap-2">
                            {SAMPLE_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleSend(q)}
                                    className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m) => (
                        <MessageBubble key={m.id} message={m} onRegenerate={handleRegenerate} />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 p-3">
                {notice && <p className="mb-2 text-xs text-red-600">{notice}</p>}
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                        placeholder="Đặt câu hỏi về tài liệu đã chọn..."
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={hasLoading || !input.trim()}
                        className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
                    >
                        {hasLoading ? "..." : "Gửi"}
                    </button>
                </div>
            </div>
        </div>
    );
}