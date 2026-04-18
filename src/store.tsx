import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Folder, Task } from "./types";
import { getDefaultFolderId } from "./types";
import { taskDueAtMs, todayISODate } from "./dateUtils";
import { sortTasksOverdueFirst } from "./taskSort";
import {
  deleteFolderRemote,
  deleteTaskRemote,
  ensureDefaultFolder,
  fetchFoldersAndTasks,
  insertFolder,
  insertTaskRemote,
  updateFolderRemote,
  updateTaskCompletedRemote,
  updateTaskDatesRemote,
  updateTaskRemote,
} from "./supabase/taskApi";

type Action =
  | { type: "HYDRATE"; folders: Folder[]; tasks: Task[] }
  | { type: "SELECT_FOLDER"; folderId: string }
  | { type: "ADD_FOLDER_LOCAL"; folder: Folder }
  | {
      type: "PATCH_FOLDER_LOCAL";
      folderId: string;
      title: string;
      description: string;
    }
  | { type: "REMOVE_FOLDER_LOCAL"; folderId: string }
  | { type: "ADD_TASK_LOCAL"; task: Task }
  | { type: "PATCH_TASK_LOCAL"; task: Task }
  | { type: "REMOVE_TASK_LOCAL"; taskId: string }
  | { type: "TOGGLE_TASK_LOCAL"; taskId: string }
  | { type: "SET_TASKS_LOCAL"; tasks: Task[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "SET_READY"; ready: boolean };

interface State {
  folders: Folder[];
  tasks: Task[];
  selectedFolderId: string;
  loading: boolean;
  ready: boolean;
  error: string | null;
}

const initialState: State = {
  folders: [],
  tasks: [],
  selectedFolderId: "",
  loading: true,
  ready: false,
  error: null,
};

function computeRollover(
  tasks: Task[],
  defaultFolderId: string | undefined
): {
  nextTasks: Task[];
  dateUpdates: { id: string; dueDate: string; todayDate: string }[];
} {
  if (!defaultFolderId) {
    return { nextTasks: tasks, dateUpdates: [] };
  }
  const today = todayISODate();
  const dateUpdates: { id: string; dueDate: string; todayDate: string }[] =
    [];
  const nextTasks = tasks.map((t) => {
    if (t.folderId !== defaultFolderId || t.completed) return t;
    const anchor = t.todayDate ?? t.dueDate;
    if (!anchor || anchor >= today) return t;
    dateUpdates.push({ id: t.id, dueDate: today, todayDate: today });
    return { ...t, dueDate: today, todayDate: today };
  });
  return { nextTasks, dateUpdates };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE": {
      const { folders, tasks } = action;
      const defId = getDefaultFolderId(folders);
      let selected = state.selectedFolderId;
      if (!selected || !folders.some((f) => f.id === selected)) {
        selected = defId ?? folders[0]?.id ?? "";
      }
      return {
        ...state,
        folders,
        tasks,
        selectedFolderId: selected,
        ready: true,
        loading: false,
        error: null,
      };
    }

    case "SELECT_FOLDER":
      return { ...state, selectedFolderId: action.folderId };

    case "ADD_FOLDER_LOCAL":
      return {
        ...state,
        folders: [...state.folders, action.folder],
        selectedFolderId: action.folder.id,
      };

    case "PATCH_FOLDER_LOCAL": {
      const f = state.folders.find((x) => x.id === action.folderId);
      if (!f || f.isDefault) return state;
      return {
        ...state,
        folders: state.folders.map((x) =>
          x.id === action.folderId
            ? {
                ...x,
                title: action.title.trim(),
                description: action.description.trim(),
              }
            : x
        ),
      };
    }

    case "REMOVE_FOLDER_LOCAL": {
      const defId = getDefaultFolderId(state.folders);
      if (!defId || action.folderId === defId) return state;
      return {
        ...state,
        folders: state.folders.filter((x) => x.id !== action.folderId),
        tasks: state.tasks.filter((t) => t.folderId !== action.folderId),
        selectedFolderId:
          state.selectedFolderId === action.folderId
            ? defId
            : state.selectedFolderId,
      };
    }

    case "ADD_TASK_LOCAL":
      return { ...state, tasks: [...state.tasks, action.task] };

    case "PATCH_TASK_LOCAL":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.task.id ? action.task : t
        ),
      };

    case "REMOVE_TASK_LOCAL":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
      };

    case "TOGGLE_TASK_LOCAL":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, completed: !t.completed } : t
        ),
      };

    case "SET_TASKS_LOCAL":
      return { ...state, tasks: action.tasks };

    case "SET_LOADING":
      return { ...state, loading: action.loading };

    case "SET_ERROR":
      return { ...state, error: action.message };

    case "SET_READY":
      return { ...state, ready: action.ready };

    default:
      return state;
  }
}

interface AppContextValue {
  state: State;
  selectedFolder: Folder | undefined;
  tasksInFolder: Task[];
  /** Folder ids (real folders) that contain at least one overdue task. */
  overdueFolderIds: Set<string>;
  /** True if the given task is overdue right now (excludes default folder). */
  isOverdue: (task: Task) => boolean;
  /** True if the given folder is the default "Today's tasks" folder. */
  isDefaultFolder: (folderId: string) => boolean;
  refresh: () => Promise<void>;
  selectFolder: (folderId: string) => void;
  addFolder: (title: string, description: string) => Promise<void>;
  updateFolder: (
    folderId: string,
    title: string,
    description: string
  ) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addTask: (
    folderId: string,
    title: string,
    description: string,
    priority: Task["priority"],
    dueDate: string | null,
    dueTime: string | null
  ) => Promise<void>;
  updateTask: (
    taskId: string,
    title: string,
    description: string,
    priority: Task["priority"],
    dueDate: string | null,
    dueTime: string | null
  ) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadAndHydrate = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", message: null });
    try {
      await ensureDefaultFolder(userId);
      let { folders, tasks } = await fetchFoldersAndTasks();
      const defId = getDefaultFolderId(folders);
      const { nextTasks, dateUpdates } = computeRollover(tasks, defId);
      for (const u of dateUpdates) {
        await updateTaskDatesRemote(u.id, u.dueDate, u.todayDate);
      }
      if (dateUpdates.length > 0) {
        const again = await fetchFoldersAndTasks();
        folders = again.folders;
        tasks = again.tasks;
      } else {
        tasks = nextTasks;
      }
      dispatch({ type: "HYDRATE", folders, tasks });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not load data from Supabase.";
      dispatch({ type: "SET_ERROR", message: msg });
      dispatch({ type: "SET_LOADING", loading: false });
      dispatch({ type: "SET_READY", ready: true });
    }
  }, [userId]);

  useEffect(() => {
    void loadAndHydrate();
  }, [loadAndHydrate]);

  useEffect(() => {
    if (!state.ready) return;
    const run = async () => {
      const { folders, tasks } = stateRef.current;
      const defId = getDefaultFolderId(folders);
      const { nextTasks, dateUpdates } = computeRollover(tasks, defId);
      if (dateUpdates.length === 0) return;
      try {
        for (const u of dateUpdates) {
          await updateTaskDatesRemote(u.id, u.dueDate, u.todayDate);
        }
        dispatch({ type: "SET_TASKS_LOCAL", tasks: nextTasks });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not save date rollover.";
        dispatch({ type: "SET_ERROR", message: msg });
      }
    };
    void run();
    const id = window.setInterval(() => void run(), 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [state.ready]);

  const selectedFolder = state.folders.find(
    (f) => f.id === state.selectedFolderId
  );

  const defaultFolderId = useMemo(
    () => getDefaultFolderId(state.folders),
    [state.folders]
  );

  const isDefaultFolder = useCallback(
    (folderId: string) => Boolean(defaultFolderId && folderId === defaultFolderId),
    [defaultFolderId]
  );

  // "Wall-clock tick" that advances every 30 s so any selector that
  // depends on the current time (overdue, due-tasks, blue dots, ordering)
  // re-evaluates as time passes — even if no task data changed.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  /** A task is overdue when:
   *    - it is not completed
   *    - it is not in the default "Today's tasks" folder (those roll forward
   *      and have no real due time)
   *    - it has a due date and current time > its due_at */
  const isOverdue = useCallback(
    (task: Task): boolean => {
      if (task.completed) return false;
      if (isDefaultFolder(task.folderId)) return false;
      const dueAt = taskDueAtMs(task);
      if (dueAt === null) return false;
      return nowTick > dueAt;
    },
    [isDefaultFolder, nowTick]
  );

  const tasksInFolder = useMemo(() => {
    const list = state.tasks.filter(
      (t) => t.folderId === state.selectedFolderId
    );
    return sortTasksOverdueFirst(list, isOverdue);
  }, [state.tasks, state.selectedFolderId, isOverdue]);

  /** Folders that contain at least one overdue task. */
  const overdueFolderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of state.tasks) {
      if (isOverdue(t)) ids.add(t.folderId);
    }
    return ids;
  }, [state.tasks, isOverdue]);

  const selectFolder = useCallback((folderId: string) => {
    dispatch({ type: "SELECT_FOLDER", folderId });
  }, []);

  const addFolder = useCallback(
    async (title: string, description: string) => {
      dispatch({ type: "SET_ERROR", message: null });
      try {
        const folder = await insertFolder(
          userId,
          title.trim(),
          description.trim()
        );
        dispatch({ type: "ADD_FOLDER_LOCAL", folder });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not create the folder.";
        dispatch({ type: "SET_ERROR", message: msg });
        throw e instanceof Error ? e : new Error(msg);
      }
    },
    [userId]
  );

  const updateFolder = useCallback(
    async (folderId: string, title: string, description: string) => {
      const f = stateRef.current.folders.find((x) => x.id === folderId);
      if (!f || f.isDefault) return;
      dispatch({ type: "SET_ERROR", message: null });
      try {
        await updateFolderRemote(
          folderId,
          title.trim(),
          description.trim()
        );
        dispatch({
          type: "PATCH_FOLDER_LOCAL",
          folderId,
          title,
          description,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not update the folder.";
        dispatch({ type: "SET_ERROR", message: msg });
        throw e instanceof Error ? e : new Error(msg);
      }
    },
    []
  );

  const deleteFolder = useCallback(async (folderId: string) => {
    const defId = getDefaultFolderId(stateRef.current.folders);
    if (!defId || folderId === defId) return;
    dispatch({ type: "SET_ERROR", message: null });
    try {
      await deleteFolderRemote(folderId);
      dispatch({ type: "REMOVE_FOLDER_LOCAL", folderId });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not delete the folder.";
      dispatch({ type: "SET_ERROR", message: msg });
      throw e instanceof Error ? e : new Error(msg);
    }
  }, []);

  const addTask = useCallback(
    async (
      folderId: string,
      title: string,
      description: string,
      priority: Task["priority"],
      dueDate: string | null,
      dueTime: string | null
    ) => {
      const defId = getDefaultFolderId(stateRef.current.folders);
      const today = todayISODate();
      const inDefault = Boolean(defId && folderId === defId);
      // Spec: time cannot be set without a date.
      const finalDueDate = inDefault ? today : dueDate;
      const finalDueTime = inDefault ? null : finalDueDate ? dueTime : null;
      const draft: Omit<Task, "id"> = {
        folderId,
        title: title.trim(),
        description: description.trim(),
        completed: false,
        priority,
        dueDate: finalDueDate,
        dueTime: finalDueTime,
        todayDate: inDefault ? today : null,
      };
      dispatch({ type: "SET_ERROR", message: null });
      try {
        const task = await insertTaskRemote(userId, draft);
        dispatch({ type: "ADD_TASK_LOCAL", task });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not create the task.";
        dispatch({ type: "SET_ERROR", message: msg });
        throw e instanceof Error ? e : new Error(msg);
      }
    },
    [userId]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      title: string,
      description: string,
      priority: Task["priority"],
      dueDate: string | null,
      dueTime: string | null
    ) => {
      const task = stateRef.current.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const defId = getDefaultFolderId(stateRef.current.folders);
      const inDefault = Boolean(defId && task.folderId === defId);
      const finalDueDate = inDefault ? task.dueDate : dueDate;
      // Spec: time cannot be set without a date.
      const finalDueTime = inDefault ? null : finalDueDate ? dueTime : null;
      const next: Task = {
        ...task,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: finalDueDate,
        dueTime: finalDueTime,
        todayDate: inDefault ? task.todayDate : null,
      };
      dispatch({ type: "SET_ERROR", message: null });
      try {
        await updateTaskRemote(next);
        dispatch({ type: "PATCH_TASK_LOCAL", task: next });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not update the task.";
        dispatch({ type: "SET_ERROR", message: msg });
        throw e instanceof Error ? e : new Error(msg);
      }
    },
    []
  );

  const toggleTask = useCallback(async (taskId: string) => {
    const task = stateRef.current.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextCompleted = !task.completed;
    dispatch({ type: "TOGGLE_TASK_LOCAL", taskId });
    try {
      await updateTaskCompletedRemote(taskId, nextCompleted);
    } catch (e) {
      dispatch({ type: "TOGGLE_TASK_LOCAL", taskId });
      const msg =
        e instanceof Error ? e.message : "Could not update the task.";
      dispatch({ type: "SET_ERROR", message: msg });
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    dispatch({ type: "SET_ERROR", message: null });
    try {
      await deleteTaskRemote(taskId);
      dispatch({ type: "REMOVE_TASK_LOCAL", taskId });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not delete the task.";
      dispatch({ type: "SET_ERROR", message: msg });
      throw e instanceof Error ? e : new Error(msg);
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      selectedFolder,
      tasksInFolder,
      overdueFolderIds,
      isOverdue,
      isDefaultFolder,
      refresh: loadAndHydrate,
      selectFolder,
      addFolder,
      updateFolder,
      deleteFolder,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
    }),
    [
      state,
      selectedFolder,
      tasksInFolder,
      overdueFolderIds,
      isOverdue,
      isDefaultFolder,
      loadAndHydrate,
      selectFolder,
      addFolder,
      updateFolder,
      deleteFolder,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
    ]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  const {
    state,
    selectedFolder,
    tasksInFolder,
    overdueFolderIds,
    isOverdue,
    isDefaultFolder,
    refresh,
  } = ctx;
  return {
    state,
    selectedFolder,
    tasksInFolder,
    overdueFolderIds,
    isOverdue,
    isDefaultFolder,
    refresh,
  };
}

export function useAppActions() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  const {
    refresh,
    selectFolder,
    addFolder,
    updateFolder,
    deleteFolder,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = ctx;
  return {
    refresh,
    selectFolder,
    addFolder,
    updateFolder,
    deleteFolder,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
}
