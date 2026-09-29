export default function EmptyState({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="text-center py-8 px-4 text-gray-500">
            <p className="font-medium">{title}</p>
            {description && <p className="text-sm mt-1">{description}</p>}
        </div>
    );
}