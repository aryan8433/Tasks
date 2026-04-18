import { useEffect, useRef } from "react";
import type { Task } from "./types";
import { taskDueAtMs } from "./dateUtils";
// Imported through Vite so the asset is bundled, hashed, and resolved
// against the deploy base path (matters for GitHub Pages subpaths).
import notificationSoundUrl from "../assets/notification_sound.mp3";

export const NOTIFICATION_SOUND_URL = notificationSoundUrl;

const POLL_MS = 30_000;

function playNotificationSound() {
  try {
    const a = new Audio(NOTIFICATION_SOUND_URL);
    a.volume = 0.85;
    void a.play().catch(() => {
      /* Autoplay may be blocked until the user interacts with the page;
         that's fine — login/click already counts as a gesture in practice. */
    });
  } catch {
    /* ignore */
  }
}

interface Options {
  isInDefaultFolder: (folderId: string) => boolean;
}

/** Polls the task list every 30s. Plays a sound the moment a task crosses
 *  its due_at boundary during the current session — i.e. it was in the
 *  future at the previous poll and is now past due. Dedup is in-memory so
 *  the same task never sounds twice within a session. Tasks that were
 *  already past due when the tab opened do not sound. */
export function useTaskNotifications(tasks: Task[], opts: Options) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    let lastCheckMs = Date.now();
    const firedThisSession = new Set<string>();
    const tick = () => {
      const now = Date.now();
      const { isInDefaultFolder } = optsRef.current;
      for (const t of tasksRef.current) {
        if (t.completed) continue;
        if (firedThisSession.has(t.id)) continue;
        if (isInDefaultFolder(t.folderId)) continue;
        const dueAt = taskDueAtMs(t);
        if (dueAt === null) continue;
        if (dueAt > lastCheckMs && dueAt <= now) {
          firedThisSession.add(t.id);
          playNotificationSound();
        }
      }
      lastCheckMs = now;
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, []);
}
