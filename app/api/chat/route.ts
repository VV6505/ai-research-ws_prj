import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askGemini } from "@/lib/fun_callAPI";
import { parseAnswer } from "@/lib/schema";

export async function POST(request: Request) {
    try {
        const { question, documentIds, conversationId, messageId } = await request.json();

        if (!question || !documentIds || documentIds.length === 0) {
            return NextResponse.json(
                { error: "Thiếu câu hỏi hoặc chưa chọn tài liệu" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Chưa xác thực phiên làm việc" }, { status: 401 });
        }

        let convId = conversationId;
        if (!convId) {
            const { data: conv, error: convError } = await supabase
                .from("conversations")
                .insert({ user_id: user.id, title: question.slice(0, 60) })
                .select()
                .single();

            if (convError || !conv) {
                return NextResponse.json(
                    { error: `Không tạo được cuộc hội thoại: ${convError?.message}` },
                    { status: 500 }
                );
            }
            convId = conv.id;
        }

        const { data: docs, error: docsError } = await supabase
            .from("documents")
            .select("name, extracted_text")
            .in("id", documentIds);

        if (docsError || !docs || docs.length === 0) {
            return NextResponse.json(
                { error: "Không tìm thấy tài liệu đã chọn" },
                { status: 400 }
            );
        }

        const context = docs
            .map((d) => `## ${d.name}\n${d.extracted_text ?? ""}`)
            .join("\n\n");

        const prompt = `Bạn là trợ lý phân tích tài liệu. Dựa trên các tài liệu sau, hãy trả lời câu hỏi của người dùng bằng tiếng Việt.

${context}

Câu hỏi: ${question}

Hãy trả lời theo đúng cấu trúc: tóm tắt (summary), các điểm chính (key_points), rủi ro nếu có (risks), hành động đề xuất (actions). Nếu không có rủi ro hoặc hành động cụ thể, để mảng rỗng.`;

        let msgPlaceholder: { id: string } | null = null;
        let placeholderError: string | undefined;

        if (messageId) {
            const { data, error } = await supabase
                .from("messages")
                .update({ status: "loading", error_message: null, raw_response: null })
                .eq("id", messageId)
                .select("id")
                .single();
            msgPlaceholder = data;
            placeholderError = error?.message;
        } else {
            const { data, error } = await supabase
                .from("messages")
                .insert({
                    conversation_id: convId,
                    role: "assistant",
                    question,
                    status: "loading",
                })
                .select("id")
                .single();
            msgPlaceholder = data;
            placeholderError = error?.message;
        }

        if (!msgPlaceholder) {
            return NextResponse.json(
                { error: `Không lưu được tin nhắn: ${placeholderError}` },
                { status: 500 }
            );
        }

        try {
            const rawText = await askGemini(prompt);
            const structured = parseAnswer(rawText);

            if (!structured) {
                await supabase
                    .from("messages")
                    .update({ status: "error", raw_response: rawText, error_message: "Định dạng phản hồi không hợp lệ" })
                    .eq("id", msgPlaceholder.id);

                return NextResponse.json(
                    {
                        id: msgPlaceholder.id,
                        conversationId: convId,
                        status: "error",
                        raw_response: rawText,
                        error: "AI trả về định dạng không đúng chuẩn",
                    },
                    { status: 200 }
                );
            }

            await supabase
                .from("messages")
                .update({ status: "done", structured_response: structured })
                .eq("id", msgPlaceholder.id);

            return NextResponse.json({
                id: msgPlaceholder.id,
                conversationId: convId,
                status: "done",
                structured_response: structured,
            });
        } catch (aiError) {
            const message = aiError instanceof Error ? aiError.message : "Lỗi gọi AI";

            await supabase
                .from("messages")
                .update({ status: "error", error_message: message })
                .eq("id", msgPlaceholder.id);

            return NextResponse.json(
                { id: msgPlaceholder.id, conversationId: convId, status: "error", error: message },
                { status: 200 }
            );
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}