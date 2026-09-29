"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/store/useChatStore";
import StructuredAnswerCard, { answerToText } from "./StructuredAnswerCard";

interface Props {
    message: ChatMessage;
    onRegenerate: (message: ChatMessage) => void;
}

export default function MessageBubble({ message, onRegenerate }: Props) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        if (!message.structured) return;
        try {
            await navigator.clipboard.writeText(answerToText(message.structured));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    }

    return (
        <div className="space-y-2">
            {/* Câu hỏi của người dùng */}
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-black text-white px-4 py-2 text-sm">
                    {message.question}
                </div>
            </div>

            {/* Câu trả lời của AI */}
            <div className="max-w-[95%] rounded-2xl rounded-bl-sm border border-gray-200 bg-white p-3">
                {message.status === "loading" && (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 w-1/3 rounded bg-gray-200" />
                        <div className="h-4 w-full rounded bg-gray-100" />
                        <div className="h-4 w-5/6 rounded bg-gray-100" />
                    </div>
                )}

                {message.status === "error" && (
                    <div className="space-y-2">
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {message.errorMessage ?? "Đã có lỗi xảy ra."}
                        </div>
                        {message.rawResponse && (
                            <div>
                                <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 mb-1">
                                    Định dạng không chuẩn
                                </span>
                                <p className="whitespace-pre-wrap text-sm text-gray-700">{message.rawResponse}</p>
                            </div>
                        )}
                    </div>
                )}

                {message.status === "done" && message.structured && (
                    <StructuredAnswerCard data={message.structured} />
                )}

                {message.status !== "loading" && (
                    <div className="mt-3 flex gap-3 text-xs text-gray-500">
                        {message.status === "done" && (
                            <button onClick={handleCopy} className="hover:text-black">
                                {copied ? "✓ Đã sao chép" : "Sao chép"}
                            </button>
                        )}
                        <button onClick={() => onRegenerate(message)} className="hover:text-black">
                            {message.status === "error" ? "Thử lại" : "Tạo lại câu trả lời"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}