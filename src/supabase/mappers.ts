import type { Folder, Priority, Task } from "../types";
import type { DbFolderRow, DbTaskRow } from "./db.types";

export function folderFromRow(row: DbFolderRow): Folder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    isDefault: row.is_default,
  };
}

function parsePriority(value: string | null): Priority | null {
  if (value === "high" || value === "medium" || value === "low") return value;
  return null;
}

export function taskFromRow(row: DbTaskRow): Task {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description ?? "",
    completed: row.completed,
    priority: parsePriority(row.priority),
    dueDate: row.due_date,
    dueTime: row.due_time,
    todayDate: row.today_date,
  };
}
