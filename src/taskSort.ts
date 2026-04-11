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

export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}
