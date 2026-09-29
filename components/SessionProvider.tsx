"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthForm from "./AuthForm"; // Import Form vừa tạo

export default function SessionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Lưu trữ thông tin người dùng đang đăng nhập
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        // Kiểm tra session, nếu lỗi thì vẫn ép tắt loading
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setSession(session);
            })
            .catch((err) => {
                console.error("Lỗi lấy session:", err);
            })
            .finally(() => {
                setLoading(false);
            });

        // Lắng nghe trạng thái
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse text-gray-400">Đang kiểm tra phiên làm việc...</div>
            </div>
        );
    }

    // Nếu không có session, bắt buộc hiện form Đăng nhập
    if (!session) {
        return <AuthForm />;
    }

    // Nếu đã đăng nhập, hiển thị ứng dụng bình thường
    return <>{children}</>;
}