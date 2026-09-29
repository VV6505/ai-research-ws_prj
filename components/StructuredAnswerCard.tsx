import type { Answer } from "@/lib/schema";

export function answerToText(a: Answer): string {
    const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
    return [
        `Tóm tắt:\n${a.summary}`,
        a.key_points.length ? `Điểm chính:\n${list(a.key_points)}` : "",
        a.risks.length ? `Rủi ro:\n${list(a.risks)}` : "",
        a.actions.length ? `Hành động đề xuất:\n${list(a.actions)}` : "",
    ]
        .filter(Boolean)
        .join("\n\n");
}

function Section({
    title,
    tone,
    children,
}: {
    title: string;
    tone: string;
    children: React.ReactNode;
}) {
    return (
        <section className={`rounded-lg border p-3 ${tone}`}>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2">{title}</h4>
            {children}
        </section>
    );
}

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="list-disc pl-5 space-y-1 text-sm">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    );
}

export default function StructuredAnswerCard({ data }: { data: Answer }) {
    return (
        <div className="space-y-3">
            <Section title="Tóm tắt" tone="border-gray-200 bg-gray-50 text-gray-800">
                <p className="text-sm">{data.summary}</p>
            </Section>

            {data.key_points.length > 0 && (
                <Section title="Điểm chính" tone="border-blue-200 bg-blue-50 text-blue-900">
                    <BulletList items={data.key_points} />
                </Section>
            )}

            {data.risks.length > 0 && (
                <Section title="Rủi ro" tone="border-red-200 bg-red-50 text-red-900">
                    <BulletList items={data.risks} />
                </Section>
            )}

            {data.actions.length > 0 && (
                <Section title="Hành động đề xuất" tone="border-green-200 bg-green-50 text-green-900">
                    <BulletList items={data.actions} />
                </Section>
            )}
        </div>
    );
}