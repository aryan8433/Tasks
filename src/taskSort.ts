import type { Priority, Task } from "./types";

const priorityOrder: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function priorityRank(p: Priority | null): number {
  if (p === null) return 3;
  return priorityOrder[p] ?? 3;
}

/** Sorts tasks with overdue items first, then by priority (high → low →
 *  none), then alphabetically by title. */
export function sortTasksOverdueFirst(
  tasks: Task[],
  isOverdue: (t: Task) => boolean
): Task[] {
  return [...tasks].sort((a, b) => {
    const ao = isOverdue(a);
    const bo = isOverdue(b);
    if (ao !== bo) return ao ? -1 : 1;
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}
