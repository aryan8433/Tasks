import { useEffect, useState } from "react";
import type { Folder } from "../types";

interface Props {
  folder: Folder | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (title: string, description: string) => void | Promise<void>;
}

export default function FolderModal({
  folder,
  mode,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && folder) {
      setTitle(folder.title);
      setDescription(folder.description);
    } else {
      setTitle("");
      setDescription("");
    }
    setError("");
  }, [mode, folder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    try {
      await onSave(t, description.trim());
      onClose();
    } catch {
      /* Error shown in app banner */
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-labelledby="folder-modal-title">
        <h2 id="folder-modal-title">
          {mode === "create" ? "New folder" : "Edit folder"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="folder-title">Title</label>
            <input
              id="folder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Folder name"
            />
            {error ? (
              <p style={{ color: "var(--danger)", fontSize: "0.8rem", margin: "0.35rem 0 0" }}>
                {error}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="folder-desc">Description (optional)</label>
            <textarea
              id="folder-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this folder"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
