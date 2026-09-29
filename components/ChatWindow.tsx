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
        updateMessage(localId, {
            status: "loading",
            errorMessage: undefined,
            rawResponse: undefined,
            streamingText: "",
        });

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

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Lỗi máy chủ");
            }

            const newConvId = res.headers.get("X-Conversation-Id");
            const newMsgId = res.headers.get("X-Message-Id");
            if (newConvId) setConversationId(newConvId);

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let full = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    full += decoder.decode(value, { stream: true });
                    updateMessage(localId, { streamingText: full });
                }
            }

            const structured = AnswerSchema.safeParse(
                JSON.parse(full.replace(/```json|```/g, "").trim())
            );

            if (structured.success) {
                updateMessage(localId, {
                    dbId: newMsgId ?? dbId,
                    status: "done",
                    structured: structured.data,
                    streamingText: undefined,
                });
            } else {
                updateMessage(localId, {
                    dbId: newMsgId ?? dbId,
                    status: "error",
                    rawResponse: full,
                    errorMessage: "AI trả về định dạng không đúng chuẩn",
                    streamingText: undefined,
                });
            }
        } catch (err) {
            updateMessage(localId, {
                status: "error",
                errorMessage: err instanceof Error ? err.message : "Không kết nối được máy chủ",
                streamingText: undefined,
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
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {historyLoading ? (
                    <div className="space-y-3">
                        <div className="ml-auto h-9 w-1/2 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="h-28 w-4/5 animate-pulse rounded-2xl bg-white shadow-sm" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                        <EmptyState
                            title="Chưa có tin nhắn nào"
                            description="Chọn tài liệu bên cạnh rồi đặt câu hỏi, hoặc thử một gợi ý:"
                        />
                        <div className="flex flex-wrap justify-center gap-2">
                            {SAMPLE_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleSend(q)}
                                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-6">
                        {messages.map((m) => (
                            <MessageBubble key={m.id} message={m} onRegenerate={handleRegenerate} />
                        ))}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t border-slate-200 bg-white p-3 md:p-4">
                <div className="mx-auto max-w-3xl">
                    {notice && <p className="mb-2 text-xs font-medium text-red-500">{notice}</p>}
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                            onFocus={(e) => {
                                setTimeout(() => {
                                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                                }, 300);
                            }}
                            placeholder="Đặt câu hỏi về tài liệu đã chọn..."
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base md:text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                            onClick={() => handleSend(input)}
                            disabled={hasLoading || !input.trim()}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {hasLoading ? "..." : "Gửi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}