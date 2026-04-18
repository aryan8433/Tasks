import { useCallback, useEffect, useState } from "react";
import type { Folder, Task } from "./types";
import { useAuth } from "./auth/AuthContext";
import { useApp, useAppActions } from "./store";
import { useTaskNotifications } from "./notifications";
import ConfirmDialog from "./components/ConfirmDialog";
import FolderContextMenu from "./components/FolderContextMenu";
import FolderModal from "./components/FolderModal";
import TaskForm from "./components/TaskForm";
import TaskContextMenu from "./components/TaskContextMenu";
import TaskRow from "./components/TaskRow";

export default function App() {
  const { signOut } = useAuth();
  const {
    state,
    selectedFolder,
    tasksInFolder,
    overdueFolderIds,
    isOverdue,
    isDefaultFolder,
    refresh,
  } = useApp();
  const {
    selectFolder,
    addFolder,
    updateFolder,
    deleteFolder,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useAppActions();

  // Plays a sound when a task crosses its due_at while the tab is open.
  useTaskNotifications(state.tasks, { isInDefaultFolder: isDefaultFolder });

  const [folderModalMode, setFolderModalMode] = useState<"create" | "edit" | null>(
    null
  );
  const [folderEditing, setFolderEditing] = useState<Folder | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folder: Folder;
    x: number;
    y: number;
  } | null>(null);
  const [taskContextMenu, setTaskContextMenu] = useState<{
    task: Task;
    x: number;
    y: number;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<
    | null
    | { type: "deleteFolder"; folder: Folder }
    | { type: "deleteTask"; task: Task }
  >(null);

  const closeFolderContextMenu = useCallback(() => {
    setFolderContextMenu(null);
  }, []);

  const closeTaskContextMenu = useCallback(() => {
    setTaskContextMenu(null);
  }, []);

  const [completedSectionOpen, setCompletedSectionOpen] = useState(false);

  useEffect(() => {
    setShowAddTaskForm(false);
    setEditingTask(null);
    setCompletedSectionOpen(false);
    setTaskContextMenu(null);
  }, [state.selectedFolderId]);

  const taskFormOpen = showAddTaskForm || editingTask !== null;

  if (state.loading && !state.ready) {
    return (
      <div className="app-shell app-loading-screen">
        <p className="loading-message">Loading your tasks…</p>
      </div>
    );
  }

  if (state.ready && state.folders.length === 0 && state.error) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">Could not load data</h1>
          <p className="auth-subtitle">{state.error}</p>
          <button
            type="button"
            className="btn btn-primary auth-submit"
            onClick={() => void refresh()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!selectedFolder) {
    return (
      <div className="app-shell">
        <p className="empty-hint" style={{ margin: "2rem" }}>
          No folder available. Try refreshing the page.
        </p>
      </div>
    );
  }

  const isDefault = selectedFolder.isDefault;

  const activeTasks = tasksInFolder.filter((t) => !t.completed);
  const completedTasks = tasksInFolder.filter((t) => t.completed);

  async function handleSaveFolder(title: string, description: string) {
    if (folderModalMode === "create") {
      await addFolder(title, description);
    } else if (folderEditing && !folderEditing.isDefault) {
      await updateFolder(folderEditing.id, title, description);
    }
  }

  function handleDeleteFolder() {
    if (!selectedFolder || selectedFolder.isDefault) return;
    setConfirmDialog({ type: "deleteFolder", folder: selectedFolder });
  }

  async function handleTaskSubmit(
    title: string,
    description: string,
    priority: Task["priority"],
    dueDate: string | null,
    dueTime: string | null
  ) {
    if (editingTask) {
      await updateTask(
        editingTask.id,
        title,
        description,
        priority,
        dueDate,
        dueTime
      );
    } else {
      if (!selectedFolder) return;
      await addTask(
        selectedFolder.id,
        title,
        description,
        priority,
        dueDate,
        dueTime
      );
      setShowAddTaskForm(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Tasks</div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={() => {
            setFolderEditing(null);
            setFolderModalMode("create");
          }}
        >
          + New folder
        </button>
        <ul className="folder-list">
          {state.folders.map((f) => {
            const hasOverdue = overdueFolderIds.has(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  className={`folder-item ${state.selectedFolderId === f.id ? "active" : ""} ${f.isDefault ? "default" : ""}`}
                  onClick={() => selectFolder(f.id)}
                  onContextMenu={(e) => {
                    if (f.isDefault) {
                      e.preventDefault();
                      return;
                    }
                    e.preventDefault();
                    setTaskContextMenu(null);
                    setFolderContextMenu({
                      folder: f,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                >
                  <span className="folder-item-title">{f.title}</span>
                  {hasOverdue ? (
                    <span
                      className="folder-dot"
                      aria-label="Contains overdue tasks"
                      title="Contains overdue tasks"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="btn btn-ghost sidebar-sign-out"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </aside>

      <main className="main">
        {state.error ? (
          <div className="sync-error-banner" role="alert">
            {state.error}
            <button
              type="button"
              className="btn btn-ghost sync-error-dismiss"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>
        ) : null}
        <header className="main-header">
          <h1>{selectedFolder.title}</h1>
          {selectedFolder.description ? (
            <p className="main-header-desc">{selectedFolder.description}</p>
          ) : !isDefault ? (
            <p className="main-header-desc" style={{ fontStyle: "italic" }}>
              No description
            </p>
          ) : (
            <p className="main-header-desc">
              Your daily list. Incomplete items move forward when the day
              changes.
            </p>
          )}
          <div className="main-actions">
            {!isDefault ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setFolderEditing(selectedFolder);
                    setFolderModalMode("edit");
                  }}
                >
                  Edit folder
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-danger"
                  onClick={() => void handleDeleteFolder()}
                >
                  Delete folder
                </button>
              </>
            ) : null}
          </div>
        </header>

        {tasksInFolder.length === 0 ? (
          <p className="empty-hint">No tasks yet. Add one with the button below.</p>
        ) : (
          <>
            {activeTasks.length > 0 ? (
              <div className="task-list task-list-main">
                {activeTasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    isInDefaultFolder={isDefault}
                    isOverdue={isOverdue(t)}
                    onToggle={() => void toggleTask(t.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setFolderContextMenu(null);
                      setTaskContextMenu({
                        task: t,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-hint empty-hint--soft">
                No open tasks. Completed items are below.
              </p>
            )}

            {completedTasks.length > 0 ? (
              <div className="completed-section">
                <button
                  type="button"
                  className="completed-section-toggle"
                  aria-expanded={completedSectionOpen}
                  onClick={() =>
                    setCompletedSectionOpen((open) => !open)
                  }
                >
                  <span
                    className={`completed-section-chevron ${completedSectionOpen ? "open" : ""}`}
                    aria-hidden
                  >
                    ›
                  </span>
                  <span className="completed-section-label">Completed</span>
                  <span className="completed-section-count">
                    {completedTasks.length}
                  </span>
                </button>
                {completedSectionOpen ? (
                  <div className="task-list task-list-completed-inner">
                    {completedTasks.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        isInDefaultFolder={isDefault}
                        onToggle={() => void toggleTask(t.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setFolderContextMenu(null);
                          setTaskContextMenu({
                            task: t,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        {!taskFormOpen ? (
          <button
            type="button"
            className="btn btn-primary add-task-trigger"
            onClick={() => {
              setEditingTask(null);
              setShowAddTaskForm(true);
            }}
          >
            + Add task
          </button>
        ) : (
          <TaskForm
            key={editingTask?.id ?? "new"}
            folderId={selectedFolder.id}
            isDefaultFolder={isDefault}
            editing={editingTask}
            onCancelEdit={() => setEditingTask(null)}
            onCancelAdd={
              editingTask ? undefined : () => setShowAddTaskForm(false)
            }
            onSubmit={handleTaskSubmit}
          />
        )}
      </main>

      {folderModalMode ? (
        <FolderModal
          mode={folderModalMode}
          folder={folderModalMode === "edit" ? folderEditing : null}
          onClose={() => {
            setFolderModalMode(null);
            setFolderEditing(null);
          }}
          onSave={handleSaveFolder}
        />
      ) : null}

      {confirmDialog ? (
        <ConfirmDialog
          title={
            confirmDialog.type === "deleteFolder"
              ? "Delete folder?"
              : "Delete task?"
          }
          message={
            confirmDialog.type === "deleteFolder"
              ? `Delete folder "${confirmDialog.folder.title}" and all tasks inside it?`
              : `Delete "${confirmDialog.task.title}"?`
          }
          onClose={() => setConfirmDialog(null)}
          onConfirm={async () => {
            if (confirmDialog.type === "deleteFolder") {
              await deleteFolder(confirmDialog.folder.id);
            } else {
              await deleteTask(confirmDialog.task.id);
              if (editingTask?.id === confirmDialog.task.id) {
                setEditingTask(null);
              }
            }
          }}
        />
      ) : null}

      {folderContextMenu ? (
        <FolderContextMenu
          folder={folderContextMenu.folder}
          x={folderContextMenu.x}
          y={folderContextMenu.y}
          onClose={closeFolderContextMenu}
          onRename={() => {
            const { folder: f } = folderContextMenu;
            selectFolder(f.id);
            setFolderEditing(f);
            setFolderModalMode("edit");
          }}
          onDelete={() => {
            setConfirmDialog({
              type: "deleteFolder",
              folder: folderContextMenu.folder,
            });
          }}
        />
      ) : null}

      {taskContextMenu ? (
        <TaskContextMenu
          task={taskContextMenu.task}
          x={taskContextMenu.x}
          y={taskContextMenu.y}
          onClose={closeTaskContextMenu}
          onEdit={() => {
            const { task: t } = taskContextMenu;
            setShowAddTaskForm(false);
            setEditingTask(t);
          }}
          onDelete={() => {
            setConfirmDialog({
              type: "deleteTask",
              task: taskContextMenu.task,
            });
          }}
        />
      ) : null}
    </div>
  );
}
