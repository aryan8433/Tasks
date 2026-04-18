import { useEffect, useState } from "react";
import type { Priority, Task } from "../types";

const PRIORITY_SEGMENTS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface Props {
  folderId: string;
  /** True when the selected folder is the built-in "Today's tasks" folder */
  isDefaultFolder: boolean;
  editing: Task | null;
  onCancelEdit: () => void;
  /** Shown for the add flow when user closes without saving */
  onCancelAdd?: () => void;
  onSubmit: (
    title: string,
    description: string,
    priority: Priority | null,
    dueDate: string | null,
    dueTime: string | null
  ) => void | Promise<void>;
}

export default function TaskForm({
  folderId: _folderId,
  isDefaultFolder,
  editing,
  onCancelEdit,
  onCancelAdd,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [priority, setPriority] = useState<"" | Priority>(
    editing?.priority ?? ""
  );
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(editing?.dueTime ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setPriority(editing.priority ?? "");
      setDueDate(editing.dueDate ?? "");
      setDueTime(editing.dueTime ?? "");
    } else {
      setTitle("");
      setDescription("");
      setPriority("");
      setDueDate("");
      setDueTime("");
    }
    setError("");
  }, [editing]);

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("");
    setDueDate("");
    setDueTime("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    const p: Priority | null =
      priority === "" || priority === null ? null : priority;
    try {
      await onSubmit(
        t,
        description.trim(),
        p,
        isDefaultFolder ? null : dueDate || null,
        isDefaultFolder ? null : dueTime || null
      );
      if (!editing) reset();
      else onCancelEdit();
    } catch {
      /* Error surfaced via app banner; keep form values */
    }
  }

  const heading = editing ? "Edit task" : "Add task";

  return (
    <div className="task-form-card">
      <h3>{heading}</h3>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
          {error ? (
            <p style={{ color: "var(--danger)", fontSize: "0.8rem", margin: "0.35rem 0 0" }}>
              {error}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="task-desc">Description (optional)</label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details"
          />
        </div>
        <div className="field-row">
          <div className="field">
            <span className="field-label-text" id="task-priority-label">
              Priority (optional)
            </span>
            <div
              className="priority-segmented"
              role="radiogroup"
              aria-labelledby="task-priority-label"
            >
              {PRIORITY_SEGMENTS.map(({ value: pv, label }) => {
                const active = priority === pv;
                return (
                  <button
                    key={pv}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`priority-segment${active ? ` active priority-segment--${pv}` : ""}`}
                    onClick={() =>
                      setPriority((cur) => (cur === pv ? "" : pv))
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="field-hint">
              Click the selected option again to leave priority unset.
            </p>
          </div>
          {!isDefaultFolder ? (
            <>
              <div className="field">
                <label htmlFor="task-due">Due date (optional)</label>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDueDate(v);
                    // Time can't exist without a date — clear it if date is removed.
                    if (!v) setDueTime("");
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="task-time">Time (optional)</label>
                <input
                  id="task-time"
                  type="time"
                  value={dueTime ?? ""}
                  onChange={(e) => setDueTime(e.target.value)}
                  disabled={!dueDate}
                  title={!dueDate ? "Set a date first" : undefined}
                />
                {!dueDate ? (
                  <p className="field-hint">Set a date to enable time.</p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="field" style={{ flex: 2 }}>
              <label>Date</label>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
                Tasks here are always dated today. Incomplete items roll forward
                at midnight.
              </p>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ marginTop: "0.75rem" }}>
          {editing ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onCancelEdit();
                reset();
              }}
            >
              Cancel edit
            </button>
          ) : onCancelAdd ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                reset();
                onCancelAdd();
              }}
            >
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            {editing ? "Save task" : "Add task"}
          </button>
        </div>
      </form>
    </div>
  );
}
