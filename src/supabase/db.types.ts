/** Row shape returned from Supabase `folders` table */
export interface DbFolderRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/** Row shape returned from Supabase `tasks` table */
export interface DbTaskRow {
  id: string;
  user_id: string;
  folder_id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: string | null;
  due_date: string | null;
  due_time: string | null;
  today_date: string | null;
  created_at: string;
  updated_at: string;
}
