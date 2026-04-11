import { DEFAULT_FOLDER_TITLE, type Folder, type Task } from "../types";
import { requireSupabase } from "./client";
import type { DbFolderRow, DbTaskRow } from "./db.types";
import { folderFromRow, taskFromRow } from "./mappers";

const nowIso = () => new Date().toISOString();

export async function fetchFoldersAndTasks(): Promise<{
  folders: Folder[];
  tasks: Task[];
}> {
  const sb = requireSupabase();
  const { data: folderRows, error: fe } = await sb
    .from("folders")
    .select("*")
    .order("created_at", { ascending: true });
  if (fe) throw fe;
  const { data: taskRows, error: te } = await sb
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (te) throw te;
  return {
    folders: (folderRows as DbFolderRow[] | null)?.map(folderFromRow) ?? [],
    tasks: (taskRows as DbTaskRow[] | null)?.map(taskFromRow) ?? [],
  };
}

/** Ensures the user has exactly one default folder (creates if missing). */
export async function ensureDefaultFolder(userId: string): Promise<void> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("folders")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  if (error) throw error;
  if (data) return;
  const { error: ins } = await sb.from("folders").insert({
    user_id: userId,
    title: DEFAULT_FOLDER_TITLE,
    description: "",
    is_default: true,
    updated_at: nowIso(),
  });
  // React StrictMode double-mount or parallel calls: ignore unique violation on default folder
  if (ins && ins.code !== "23505") throw ins;
}

export async function insertFolder(
  userId: string,
  title: string,
  description: string
): Promise<Folder> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("folders")
    .insert({
      user_id: userId,
      title,
      description,
      is_default: false,
      updated_at: nowIso(),
    })
    .select()
    .single();
  if (error) throw error;
  return folderFromRow(data as DbFolderRow);
}

export async function updateFolderRemote(
  folderId: string,
  title: string,
  description: string
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("folders")
    .update({ title, description, updated_at: nowIso() })
    .eq("id", folderId);
  if (error) throw error;
}

export async function deleteFolderRemote(folderId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("folders").delete().eq("id", folderId);
  if (error) throw error;
}

export async function insertTaskRemote(
  userId: string,
  task: Omit<Task, "id">
): Promise<Task> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("tasks")
    .insert({
      user_id: userId,
      folder_id: task.folderId,
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      due_date: task.dueDate,
      due_time: task.dueTime,
      today_date: task.todayDate,
      updated_at: nowIso(),
    })
    .select()
    .single();
  if (error) throw error;
  return taskFromRow(data as DbTaskRow);
}

export async function updateTaskRemote(task: Task): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("tasks")
    .update({
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      due_date: task.dueDate,
      due_time: task.dueTime,
      today_date: task.todayDate,
      updated_at: nowIso(),
    })
    .eq("id", task.id);
  if (error) throw error;
}

export async function updateTaskCompletedRemote(
  taskId: string,
  completed: boolean
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("tasks")
    .update({ completed, updated_at: nowIso() })
    .eq("id", taskId);
  if (error) throw error;
}

export async function deleteTaskRemote(taskId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function updateTaskDatesRemote(
  taskId: string,
  dueDate: string,
  todayDate: string
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("tasks")
    .update({
      due_date: dueDate,
      today_date: todayDate,
      updated_at: nowIso(),
    })
    .eq("id", taskId);
  if (error) throw error;
}
