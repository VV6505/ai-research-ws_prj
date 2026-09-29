export interface Document {
    id: string;
    user_id: string;
    name: string;
    storage_path: string;
    extracted_text: string | null;
    created_at: string;
}