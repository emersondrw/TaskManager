import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addTask, db, deleteTask, updateTask, type TaskInput } from './db/dexieDB';
import { exportToJson, importFromJson } from './db/backupService';
import { useNotifications } from './hooks/useNotifications';
import { usePersistentStorage } from './hooks/usePersistentStorage';
import type { KanbanStatus, Subtask, Task, TaskView } from './types/task';
import { formatTime, isPast } from './utils/dateUtils';
import { Header } from './components/Header';
import { MatrixView } from './components/MatrixView';
import { WeekView } from './components/WeekView';
import { KanbanView } from './components/KanbanView';
import { TaskModal, type TaskPreset } from './components/TaskModal';
import { MorningReviewModal } from './components/MorningReviewModal';
import styles from './App.module.css';

const ALL_ENTITIES = '__all__';

export default function App() {
  const [view, setView] = useState<TaskView>('matrix');
  const [entityFilter, setEntityFilter] = useState<string>(ALL_ENTITIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [preset, setPreset] = useState<TaskPreset | undefined>(undefined);
  const [editingSubtask, setEditingSubtask] = useState<{
    task: Task;
    subtask: Subtask;
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [dueBanner, setDueBanner] = useState<{ title: string; time?: string } | null>(null);
  const reviewedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dueBannerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  usePersistentStorage();
  const { permission: notifPermission, request: requestNotifications } = useNotifications(
    (task) => {
      setDueBanner({ title: task.title, time: task.dueDate });
      if (dueBannerTimer.current) clearTimeout(dueBannerTimer.current);
      dueBannerTimer.current = setTimeout(() => setDueBanner(null), 8000);
    },
  );

  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks ?? []) {
      if (t.relatedTo) set.add(t.relatedTo);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [tasks]);

  const filtered = useMemo(() => {
    if (entityFilter === ALL_ENTITIES) return tasks ?? [];
    return (tasks ?? []).filter((t) => t.relatedTo === entityFilter);
  }, [tasks, entityFilter]);

  const overdue = useMemo(
    () => (tasks ?? []).filter((t) => isPast(t.targetDate) && t.status !== 'done'),
    [tasks],
  );

  useEffect(() => {
    if (reviewedRef.current) return;
    if (overdue.length === 0) return;
    reviewedRef.current = true;
    setReviewOpen(true);
  }, [overdue]);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  };

  const openNew = () => {
    setEditing(null);
    setPreset(undefined);
    setEditingSubtask(null);
    setModalOpen(true);
  };

  const openPreset = (p: TaskPreset) => {
    setEditing(null);
    setPreset(p);
    setEditingSubtask(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setPreset(undefined);
    setEditingSubtask(null);
    setModalOpen(true);
  };

  const openSubtaskEdit = (task: Task, subtask: Subtask) => {
    setEditing(null);
    setPreset(undefined);
    setEditingSubtask({ task, subtask });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setPreset(undefined);
    setEditingSubtask(null);
  };

  const handleSave = async (input: TaskInput) => {
    if (editing?.id) {
      await updateTask(editing.id, {
        ...input,
        notified: input.dueDate ? false : undefined,
      });
      notify('Cambios guardados.');
    } else {
      await addTask(input);
      notify('Tarea creada.');
    }
    closeModal();
  };

  const handleSaveSubtask = async (task: Task, updated: Subtask) => {
    if (!task.id) return;
    const subtasks = task.subtasks.map((s) => (s.id === updated.id ? updated : s));
    await updateTask(task.id, { subtasks });
    closeModal();
    notify('Subtarea actualizada.');
  };

  const handleDelete = async (task: Task) => {
    if (!task.id) return;
    await deleteTask(task.id);
    closeModal();
    notify('Tarea eliminada.');
  };

  const moveToDay = async (taskId: string, dateStr: string) => {
    await updateTask(taskId, { targetDate: dateStr });
  };

  const moveToStatus = async (taskId: string, status: KanbanStatus) => {
    await updateTask(taskId, { status });
  };

  const toggleSubtask = async (task: Task, subtaskId: string) => {
    if (!task.id) return;
    const subtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s,
    );
    await updateTask(task.id, { subtasks });
  };

  const reviewComplete = async (ids: string[]) => {
    for (const id of ids) await updateTask(id, { status: 'done' });
    setReviewOpen(false);
    notify(`${ids.length} ${ids.length === 1 ? 'tarea marcada' : 'tareas marcadas'} como hechas.`);
  };

  const reviewReschedule = async (ids: string[], dateStr: string) => {
    for (const id of ids) await updateTask(id, { targetDate: dateStr });
    setReviewOpen(false);
    notify(`Reagendadas para ${dateStr}.`);
  };

  const handleExport = async () => {
    await exportToJson();
    notify('Copia de seguridad descargada.');
  };

  const handleImport = async (file: File) => {
    try {
      const { added, updated } = await importFromJson(file);
      notify(`Importadas ${added} nuevas, actualizadas ${updated}.`);
    } catch (err) {
      notify(`No se pudo importar: ${err instanceof Error ? err.message : 'archivo inválido'}`);
    }
  };

  return (
    <div className={styles.app}>
      <Header
        view={view}
        onViewChange={setView}
        entities={entities}
        entityFilter={entityFilter}
        onEntityFilter={setEntityFilter}
        onExport={handleExport}
        onImport={handleImport}
        onNewTask={openNew}
        notifPermission={notifPermission}
        onRequestNotifications={requestNotifications}
      />

      <main className={styles.main}>
        {view === 'matrix' && (
          <MatrixView
            tasks={filtered}
            onEdit={openEdit}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={openSubtaskEdit}
            onQuickAdd={(urgent, important) =>
              openPreset({ urgent, important, status: 'todo' })
            }
          />
        )}
        {view === 'week' && (
          <WeekView
            tasks={filtered}
            onEdit={openEdit}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={openSubtaskEdit}
            onMoveToDay={moveToDay}
            onQuickAdd={(dateStr) =>
              openPreset({ urgent: false, important: false, status: 'todo', targetDate: dateStr })
            }
          />
        )}
        {view === 'kanban' && (
          <KanbanView
            tasks={filtered}
            onEdit={openEdit}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={openSubtaskEdit}
            onMoveToStatus={moveToStatus}
            onQuickAdd={(status) => openPreset({ urgent: false, important: false, status })}
          />
        )}
      </main>

      <TaskModal
        open={modalOpen}
        initial={editing}
        preset={preset}
        subtaskContext={editingSubtask}
        entities={entities}
        onClose={closeModal}
        onSave={handleSave}
        onSaveSubtask={handleSaveSubtask}
        onDelete={handleDelete}
      />

      <MorningReviewModal
        open={reviewOpen}
        overdue={overdue}
        onClose={() => setReviewOpen(false)}
        onReschedule={reviewReschedule}
        onComplete={reviewComplete}
      />

      {toast ? (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      ) : null}

      {dueBanner ? (
        <div className={styles.dueBanner} role="alert">
          <span className={styles.dueBannerLabel}>Aviso · Hora programada</span>
          <span className={styles.dueBannerTitle}>{dueBanner.title}</span>
          {dueBanner.time ? (
            <span className={styles.dueBannerTime}>{formatTime(dueBanner.time)}</span>
          ) : null}
          <button
            type="button"
            className={styles.dueBannerClose}
            onClick={() => setDueBanner(null)}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
