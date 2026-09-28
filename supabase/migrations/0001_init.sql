-- Bảng documents: lưu tài liệu đã upload
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  extracted_text text,
  created_at timestamptz not null default now()
);

-- Bảng conversations: một phiên hội thoại
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

-- Bảng messages: từng câu hỏi + câu trả lời trong hội thoại
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  question text,
  structured_response jsonb,
  raw_response text,
  status text not null default 'done' check (status in ('loading', 'done', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Bật Row Level Security
alter table documents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Policy: user chỉ thao tác được trên dữ liệu của chính mình
create policy "users manage own documents"
  on documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own conversations"
  on conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own messages"
  on messages for all
  using (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  )
  with check (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );

-- Storage bucket cho file tài liệu upload
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "users manage own storage files"
  on storage.objects for all
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);