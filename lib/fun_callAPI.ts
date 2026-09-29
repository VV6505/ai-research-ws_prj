import { GoogleGenAI, Type } from "@google/genai";

// Danh sách model ưu tiên — thử lần lượt nếu model trước bị 503/429
const MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
];

const RETRYABLE_CODES = [429, 503, 502, 500];

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    maxRetries = 2
) {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["summary", "key_points", "risks", "actions"],
                    },
                },
            });
            return response.text ?? "";
        } catch (err: unknown) {
            lastError = err;
            const code =
                (err as { status?: number; code?: number })?.status ??
                (err as { status?: number; code?: number })?.code;

            const shouldRetry = code !== undefined && RETRYABLE_CODES.includes(code);
            if (!shouldRetry || attempt === maxRetries) break;

            const delay = 1000 * Math.pow(2, attempt);
            console.warn(`[Gemini:${model}] attempt ${attempt + 1} failed (${code}), retry in ${delay}ms`);
            await sleep(delay);
        }
    }

    throw lastError;
}

export async function askGemini(prompt: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Thiếu GEMINI_API_KEY. Kiểm tra file .env.local và restart dev server.");
    }

    const ai = new GoogleGenAI({ apiKey });
    let lastError: unknown;

    for (const model of MODELS) {
        try {
            console.log(`[Gemini] Đang dùng model: ${model}`);
            const result = await callWithRetry(ai, model, prompt);
            return result;
        } catch (err: unknown) {
            lastError = err;
            const code =
                (err as { status?: number; code?: number })?.status ??
                (err as { status?: number; code?: number })?.code;
            console.warn(`[Gemini] Model ${model} thất bại (${code}), chuyển model tiếp theo...`);
        }
    }

    throw lastError;
}

export async function* askGeminiStream(prompt: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Thiếu GEMINI_API_KEY. Kiểm tra file .env.local và restart dev server.");
    }

    const ai = new GoogleGenAI({ apiKey });
    let lastError: unknown;

    for (const model of MODELS) {
        try {
            console.log(`[Gemini stream] Đang dùng model: ${model}`);
            const stream = await ai.models.generateContentStream({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["summary", "key_points", "risks", "actions"],
                    },
                },
            });

            let receivedAny = false;
            for await (const chunk of stream) {
                if (chunk.text) {
                    receivedAny = true;
                    yield chunk.text;
                }
            }
            if (receivedAny) return;
        } catch (err: unknown) {
            lastError = err;
            const code =
                (err as { status?: number; code?: number })?.status ??
                (err as { status?: number; code?: number })?.code;
            console.warn(`[Gemini stream] Model ${model} thất bại (${code}), chuyển model tiếp theo...`);
        }
    }

    throw lastError ?? new Error("Không có model nào phản hồi được.");
}