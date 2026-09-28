import { createClient } from "./supabase/client";

export async function ensureAnonymousSession() {
    const supabase = createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session) return session;

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
        console.error("Không thể tạo anonymous session:", error.message);
        throw error;
    }

    return data.session;
}