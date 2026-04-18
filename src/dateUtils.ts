export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

/** Convert a task's due_date (YYYY-MM-DD) and optional due_time (HH:MM)
 *  into a local-time epoch ms timestamp. Time defaults to 00:00 of that
 *  day when only a date was provided (per spec).
 *  Returns null if the task has no due_date. */
export function taskDueAtMs(task: {
  dueDate: string | null;
  dueTime: string | null;
}): number | null {
  if (!task.dueDate) return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(task.dueDate);
  if (!dateMatch) return null;
  const y = Number(dateMatch[1]);
  const mo = Number(dateMatch[2]);
  const d = Number(dateMatch[3]);
  let h = 0;
  let min = 0;
  if (task.dueTime) {
    const timeMatch = /^(\d{1,2}):(\d{2})/.exec(task.dueTime);
    if (timeMatch) {
      h = Number(timeMatch[1]);
      min = Number(timeMatch[2]);
    }
  }
  return new Date(y, mo - 1, d, h, min, 0, 0).getTime();
}
