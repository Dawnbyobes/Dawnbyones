import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cwkqlwdeteitisdrlwmg.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3a3Fsd2RldGVpdGlzZHJsd21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODkwMzMsImV4cCI6MjA5Njg2NTAzM30.hSbK_Z1rH9pXUwpfh2o5ZxbpkRUyy_7xDYcrmvLXgq8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Novel = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover: string | null;
  status: "ongoing" | "completed" | "paused";
  category: string | null;
  tags: string | null;
  author_note: string | null;
  word_count: number;
  chapter_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  novel_id: number;
  title: string;
  order_num: number;
  content: string;
  status: "draft" | "published";
  word_count: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  chapter_id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  reader_id: string | null;
  created_at: string;
};

export type InviteCode = {
  id: number;
  code: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  note: string | null;
  created_at: string;
};

export type Admin = {
  id: string;
  email: string;
  created_at: string;
};

export type ReadingProgress = {
  id: string;
  user_id: string;
  chapter_id: string;
  scroll_position: number;
  updated_at: string;
};

export type Announcement = {
  id: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};
