import { useEffect, useState } from "react";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onClose,
  onConfirm,
}: Props) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  async function handleConfirm() {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      /* Error banner; keep dialog open */
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="modal-backdrop modal-backdrop--confirm"
      role="presentation"
      onMouseDown={(ev) => {
        if (pending) return;
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-desc" className="confirm-dialog-message">
          {message}
        </p>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={pending}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-danger"
            onClick={() => void handleConfirm()}
            disabled={pending}
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
