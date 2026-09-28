"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousSession } from "@/lib/auth";

export default function SessionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ensureAnonymousSession()
            .then(() => setReady(true))
            .catch((err) => setError(err.message ?? "Lỗi khởi tạo phiên làm việc"));
    }, []);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center p-6 text-center">
                <div>
                    <p className="text-red-600 font-medium">Không thể kết nối máy chủ.</p>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-gray-400">Đang khởi tạo...</div>
            </div>
        );
    }

    return <>{children}</>;
}