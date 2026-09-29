import { z } from "zod";

export const AnswerSchema = z.object({
    summary: z.string(),
    key_points: z.array(z.string()),
    risks: z.array(z.string()),
    actions: z.array(z.string()),
});

export type Answer = z.infer<typeof AnswerSchema>;

export function parseAnswer(raw: string): Answer | null {
    try {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return AnswerSchema.parse(parsed);
    } catch {
        return null;
    }
}