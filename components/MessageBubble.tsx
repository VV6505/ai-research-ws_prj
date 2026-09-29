"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/store/useChatStore";
import StructuredAnswerCard, { answerToText } from "./StructuredAnswerCard";

interface Props {
    message: ChatMessage;
    onRegenerate: (message: ChatMessage) => void;
}

function parsePartial(text: string) {
    const result = { summary: "", key_points: [] as string[], risks: [] as string[], actions: [] as string[] };

    const summaryMatch = text.match(/"summary"\s*:\s*"([^]*?)(?:",|"$)/);
    if (summaryMatch) result.summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');

    const extractArray = (key: string) => {
        const arrMatch = text.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)(?:\\]|$)`));
        if (arrMatch) {
            const items = arrMatch[1].match(/"([^]*?)(?:",|"$)/g);
            if (items) {
                return items.map(i => i.replace(/^"/, '').replace(/",?$/, '').replace(/\\"/g, '"'));
            }
        }
        return [];
    };

    result.key_points = extractArray("key_points");
    result.risks = extractArray("risks");
    result.actions = extractArray("actions");
    return result;
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

    const partialData = message.status === "loading" && message.streamingText ? parsePartial(message.streamingText) : null;

    return (
        <div className="space-y-2">
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">
                    {message.question}
                </div>
            </div>

            <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-slate-200 bg-white p-4 shadow-sm">
                {message.status === "loading" && (
                    <div>
                        {partialData && (partialData.summary || partialData.key_points.length > 0) ? (
                            <div className="relative">
                                <StructuredAnswerCard data={partialData} />
                                <span className="absolute bottom-2 right-2 flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500"></span>
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-4 w-1/3 rounded bg-slate-200" />
                                <div className="h-4 w-full rounded bg-slate-100" />
                                <div className="h-4 w-5/6 rounded bg-slate-100" />
                            </div>
                        )}
                    </div>
                )}

                {message.status === "error" && (
                    <div className="space-y-2">
                        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                            {message.errorMessage ?? "Đã có lỗi xảy ra."}
                        </div>
                        {message.rawResponse && (
                            <div>
                                <span className="mb-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                    Định dạng không chuẩn
                                </span>
                                <p className="whitespace-pre-wrap text-sm text-slate-600">{message.rawResponse}</p>
                            </div>
                        )}
                    </div>
                )}

                {message.status === "done" && message.structured && (
                    <StructuredAnswerCard data={message.structured} />
                )}

                {message.status !== "loading" && (
                    <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                        {message.status === "done" && (
                            <button onClick={handleCopy} className="transition hover:text-indigo-600">
                                {copied ? "✓ Đã sao chép" : "Sao chép"}
                            </button>
                        )}
                        <button onClick={() => onRegenerate(message)} className="transition hover:text-indigo-600">
                            {message.status === "error" ? "Thử lại" : "Tạo lại câu trả lời"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}