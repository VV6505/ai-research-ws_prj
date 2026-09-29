"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();

        try {
            if (isLogin) {
                // Xử lý Đăng nhập
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                // Xử lý Đăng ký
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-slate-200">
                <h2 className="mb-6 text-2xl font-semibold text-center text-slate-800">
                    {isLogin ? "Đăng nhập" : "Đăng ký tài khoản mới"}
                </h2>
                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-600">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? "Đang xử lý..." : (isLogin ? "Đăng nhập" : "Đăng ký")}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-600">
                    {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-medium text-indigo-600 hover:underline"
                    >
                        {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                    </button>
                </p>
            </div>
        </div>
    );
}