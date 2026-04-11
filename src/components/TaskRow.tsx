import type { MouseEvent } from "react";
import type { Task } from "../types";

interface Props {
  task: Task;
  /** Hide due-date line for tasks in the default "today" folder */
  isInDefaultFolder: boolean;
  onToggle: () => void;
  onContextMenu: (e: MouseEvent<HTMLDivElement>) => void;
}

/** `YYYY-MM-DD` from `<input type="date">` → `DD/MM/YYYY` for display */
function isoDateToDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const [, y, mo, day] = m;
  return `${day}/${mo}/${y}`;
}

function formatDue(d: string | null, t: string | null): string | null {
  if (!d && !t) return null;
  const datePart = d ? isoDateToDMY(d) : null;
  if (datePart && t) return `${datePart} · ${t}`;
  if (datePart) return datePart;
  return t;
}

export default function TaskRow({
  task,
  isInDefaultFolder,
  onToggle,
  onContextMenu,
}: Props) {
  const dueLabel = formatDue(task.dueDate, task.dueTime);
  const showDueMeta = !isInDefaultFolder && dueLabel;

  return (
    <div
      className={`task-row ${task.completed ? "done" : ""}`}
      onContextMenu={onContextMenu}
    >
      <input
        type="checkbox"
        className="task-check"
        checked={task.completed}
        onChange={onToggle}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      />
      <div className="task-body">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          {task.priority ? (
            <span className={`priority-pill ${task.priority}`}>
              {task.priority}
            </span>
          ) : null}
        </div>
        {showDueMeta ? (
          <div className="task-meta">
            <span>Due: {dueLabel}</span>
          </div>
        ) : null}
        {task.description ? (
          <div className="task-desc">{task.description}</div>
        ) : null}
      </div>
    </div>
  );
}
