import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Folder } from "../types";

interface Props {
  folder: Folder;
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function IconRename() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FolderContextMenu({
  folder,
  x,
  y,
  onClose,
  onRename,
  onDelete,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = x;
    let top = y;
    const pad = 8;
    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = window.innerHeight - rect.height - pad;
    }
    el.style.left = `${Math.max(pad, left)}px`;
    el.style.top = `${Math.max(pad, top)}px`;
  }, [x, y, folder.id]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const t = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="folder-context-menu"
      style={{ left: x, top: y }}
      role="menu"
      aria-label={`Folder actions for ${folder.title}`}
    >
      <button
        type="button"
        className="folder-context-item"
        role="menuitem"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        <span className="folder-context-icon" aria-hidden>
          <IconRename />
        </span>
        Rename
      </button>
      <div className="folder-context-sep" role="separator" />
      <button
        type="button"
        className="folder-context-item folder-context-item--danger"
        role="menuitem"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <span className="folder-context-icon" aria-hidden>
          <IconTrash />
        </span>
        Delete
      </button>
    </div>,
    document.body
  );
}
