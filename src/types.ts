export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  folderId: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority | null;
  dueDate: string | null;
  dueTime: string | null;
  /** Only for tasks in the default folder: calendar day they belong to (rollover updates this). */
  todayDate: string | null;
}

export interface Folder {
  id: string;
  title: string;
  description: string;
  isDefault: boolean;
}

export const DEFAULT_FOLDER_TITLE = "Today's tasks";

export function getDefaultFolderId(folders: Folder[]): string | undefined {
  return folders.find((f) => f.isDefault)?.id;
}
