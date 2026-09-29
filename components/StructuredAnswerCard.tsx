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

const SECTION_STYLES = {
    summary: "border-slate-200 bg-slate-50",
    key_points: "border-blue-100 bg-blue-50",
    risks: "border-red-100 bg-red-50",
    actions: "border-emerald-100 bg-emerald-50",
} as const;

const TEXT_STYLES = {
    summary: "text-slate-700",
    key_points: "text-blue-900",
    risks: "text-red-900",
    actions: "text-emerald-900",
} as const;

function Section({
    title,
    tone,
    children,
}: {
    title: string;
    tone: keyof typeof SECTION_STYLES;
    children: React.ReactNode;
}) {
    return (
        <section className={`rounded-lg border p-3.5 ${SECTION_STYLES[tone]}`}>
            <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${TEXT_STYLES[tone]} opacity-80`}>
                {title}
            </h4>
            {children}
        </section>
    );
}

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-1.5 text-sm leading-relaxed">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function StructuredAnswerCard({ data }: { data: Answer }) {
    return (
        <div className="space-y-3">
            <Section title="Tóm tắt" tone="summary">
                <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
            </Section>

            {data.key_points.length > 0 && (
                <Section title="Điểm chính" tone="key_points">
                    <div className="text-blue-900">
                        <BulletList items={data.key_points} />
                    </div>
                </Section>
            )}

            {data.risks.length > 0 && (
                <Section title="Rủi ro" tone="risks">
                    <div className="text-red-900">
                        <BulletList items={data.risks} />
                    </div>
                </Section>
            )}

            {data.actions.length > 0 && (
                <Section title="Hành động đề xuất" tone="actions">
                    <div className="text-emerald-900">
                        <BulletList items={data.actions} />
                    </div>
                </Section>
            )}
        </div>
    );
}