import { create } from "zustand";
import type { Answer } from "@/lib/schema";

export interface ChatMessage {
    id: string; // id cục bộ, ổn định trong UI
    dbId?: string; // id thật trong bảng messages (có sau khi server phản hồi)
    question: string;
    status: "loading" | "done" | "error";
    structured?: Answer;
    rawResponse?: string;
    errorMessage?: string;
}

interface ChatState {
    messages: ChatMessage[];
    conversationId: string | null;
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (message: ChatMessage) => void;
    updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
    setConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    conversationId: null,
    setMessages: (messages) => set({ messages }),
    addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
    updateMessage: (id, patch) =>
        set((state) => ({
            messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
    setConversationId: (id) => set({ conversationId: id }),
}));