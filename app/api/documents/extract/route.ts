import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const { storagePath, name } = await request.json();

        if (!storagePath || !name) {
            return NextResponse.json(
                { error: "Thiếu storagePath hoặc name" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Chưa xác thực phiên làm việc" },
                { status: 401 }
            );
        }

        const { data: fileBlob, error: downloadError } = await supabase.storage
            .from("documents")
            .download(storagePath);

        if (downloadError || !fileBlob) {
            return NextResponse.json(
                { error: `Không tải được file: ${downloadError?.message}` },
                { status: 500 }
            );
        }

        const buffer = Buffer.from(await fileBlob.arrayBuffer());
        let extractedText = "";

        if (name.toLowerCase().endsWith(".pdf")) {
            // Thêm 'as any' để ép kiểu
            const pdfParseModule = await import("pdf-parse");
            const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
            const result = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
            extractedText = result.text;
        } else if (name.toLowerCase().endsWith(".docx")) {
            const mammoth = await import("mammoth");
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else {
            extractedText = buffer.toString("utf-8");
        }

        if (!extractedText.trim()) {
            return NextResponse.json(
                { error: "Không trích xuất được nội dung (file rỗng hoặc không đọc được)" },
                { status: 422 }
            );
        }

        const { data: doc, error: insertError } = await supabase
            .from("documents")
            .insert({
                user_id: user.id,
                name,
                storage_path: storagePath,
                extracted_text: extractedText,
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json(
                { error: `Không lưu được vào database: ${insertError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(doc);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}