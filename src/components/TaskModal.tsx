import { useEffect, useMemo, useState } from 'react';
import { X, Zap, Anchor, Trash2 } from 'lucide-react';
import type { KanbanStatus, Subtask, Task } from '../types/task';
import { QUADRANT_LABEL, quadrantOf } from '../types/task';
import type { TaskInput } from '../db/dexieDB';
import { SubtaskManager } from './SubtaskManager';
import { isoToLocalDateTime, localDateTimeToISO, todayStr } from '../utils/dateUtils';
import styles from './TaskModal.module.css';

export interface TaskPreset {
  urgent: boolean;
  important: boolean;
  status: KanbanStatus;
  targetDate?: string;
}

export interface SubtaskContext {
  task: Task;
  subtask: Subtask;
}

interface Props {
  open: boolean;
  initial: Task | null;
  preset?: TaskPreset;
  subtaskContext?: SubtaskContext | null;
  entities: string[];
  onClose: () => void;
  onSave: (input: TaskInput) => void;
  onSaveSubtask?: (task: Task, subtask: Subtask) => void;
  onDelete?: (task: Task) => void;
}

const STATUS_OPTIONS: { value: KanbanStatus; label: string }[] = [
  { value: 'todo', label: 'Pendiente' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'done', label: 'Hecho' },
];

export function TaskModal({
  open,
  initial,
  preset,
  subtaskContext,
  entities,
  onClose,
  onSave,
  onSaveSubtask,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relatedTo, setRelatedTo] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [status, setStatus] = useState<KanbanStatus>('todo');
  const [targetDate, setTargetDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [error, setError] = useState('');

  const [sTitle, setSTitle] = useState('');
  const [sAssignee, setSAssignee] = useState('');
  const [sDetails, setSDetails] = useState('');
  const [sNotes, setSNotes] = useState('');
  const [sTargetDate, setSTargetDate] = useState(todayStr());
  const [sDueDate, setSDueDate] = useState('');
  const [sError, setSError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setRelatedTo(initial?.relatedTo ?? '');
    setUrgent(initial?.urgent ?? preset?.urgent ?? false);
    setImportant(initial?.important ?? preset?.important ?? false);
    setStatus(initial?.status ?? preset?.status ?? 'todo');
    setTargetDate(initial?.targetDate ?? preset?.targetDate ?? todayStr());
    setDueDate(initial?.dueDate ? isoToLocalDateTime(initial.dueDate) : '');
    setSubtasks(initial?.subtasks ?? []);
    setError('');
  }, [open, initial, preset]);

  useEffect(() => {
    if (!open || !subtaskContext) return;
    const s = subtaskContext.subtask;
    setSTitle(s.title);
    setSAssignee(s.assignee ?? '');
    setSDetails(s.details ?? '');
    setSNotes(s.notes ?? '');
    setSTargetDate(s.targetDate ?? todayStr());
    setSDueDate(s.dueDate ? isoToLocalDateTime(s.dueDate) : '');
    setSError('');
  }, [open, subtaskContext]);

  const quadrant = useMemo(() => quadrantOf({ urgent, important }), [urgent, important]);

  if (!open) return null;

  const isSubtask = Boolean(subtaskContext);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Ponle un título a la tarea.');
      return;
    }
    const payload: TaskInput = {
      title: trimmed,
      description: description.trim() || undefined,
      relatedTo: relatedTo.trim() || undefined,
      urgent,
      important,
      status,
      targetDate,
      dueDate: dueDate ? localDateTimeToISO(dueDate) : undefined,
      subtasks,
    };
    onSave(payload);
  };

  const submitSubtask = () => {
    const trimmed = sTitle.trim();
    if (!trimmed) {
      setSError('Ponle un título a la subtarea.');
      return;
    }
    if (!subtaskContext) return;
    const updated: Subtask = {
      ...subtaskContext.subtask,
      title: trimmed,
      assignee: sAssignee.trim() || undefined,
      details: sDetails.trim() || undefined,
      notes: sNotes.trim() || undefined,
      targetDate: sTargetDate,
      dueDate: sDueDate ? localDateTimeToISO(sDueDate) : undefined,
      updatedAt: new Date().toISOString(),
    };
    onSaveSubtask?.(subtaskContext.task, updated);
  };

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Tarea">
        <header className={styles.panelHead}>
          <span className="eyebrow">
            {isSubtask ? 'Editar subtarea' : initial ? 'Editar tarea' : 'Nueva tarea'}
          </span>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={16} strokeWidth={2} />
          </button>
        </header>

        {isSubtask ? (
          <div className={styles.body}>
            <label className={styles.field}>
              <span className="eyebrow">Título</span>
              <input
                className={styles.input}
                value={sTitle}
                onChange={(e) => setSTitle(e.target.value)}
                placeholder="¿Qué hay que hacer?"
                autoFocus
              />
            </label>

            <label className={styles.field}>
              <span className="eyebrow">Responsable</span>
              <input
                className={styles.input}
                value={sAssignee}
                onChange={(e) => setSAssignee(e.target.value)}
                list="subtask-assignees"
                placeholder="¿Quién la hace?"
              />
              <datalist id="subtask-assignees">
                {entities.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className="eyebrow">Fecha objetivo</span>
                <input
                  type="date"
                  className={styles.input}
                  value={sTargetDate}
                  onChange={(e) => setSTargetDate(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className="eyebrow">Aviso local (opcional)</span>
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={sDueDate}
                  onChange={(e) => setSDueDate(e.target.value)}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className="eyebrow">Detalles</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={sDetails}
                onChange={(e) => setSDetails(e.target.value)}
                rows={3}
                placeholder="Qué incluye, criterio de terminado…"
              />
            </label>

            <label className={styles.field}>
              <span className="eyebrow">Notas</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={sNotes}
                onChange={(e) => setSNotes(e.target.value)}
                rows={3}
                placeholder="Observaciones de seguimiento…"
              />
            </label>

            {sError ? <p className={styles.error}>{sError}</p> : null}
          </div>
        ) : (
          <div className={styles.body}>
          <label className={styles.field}>
            <span className="eyebrow">Título</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className="eyebrow">Descripción</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalles, contexto, criterio de terminado…"
            />
          </label>

          <label className={styles.field}>
            <span className="eyebrow">Persona / cliente / empresa</span>
            <input
              className={styles.input}
              value={relatedTo}
              onChange={(e) => setRelatedTo(e.target.value)}
              list="task-entities"
              placeholder="¿Vinculada a alguien?"
            />
            <datalist id="task-entities">
              {entities.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </label>

          <div className={styles.field}>
            <span className="eyebrow">Cuadrante</span>
            <div className={styles.toggles}>
              <button
                type="button"
                className={`${styles.toggle} ${urgent ? styles.toggleUrgentActive : ''}`}
                onClick={() => setUrgent((v) => !v)}
                aria-pressed={urgent}
              >
                <Zap size={14} strokeWidth={2} />
                Urgente
              </button>
              <button
                type="button"
                className={`${styles.toggle} ${important ? styles.toggleImportantActive : ''}`}
                onClick={() => setImportant((v) => !v)}
                aria-pressed={important}
              >
                <Anchor size={14} strokeWidth={2} />
                Importante
              </button>
            </div>
            <p className={styles.quadrantHint}>
              {quadrant} · {QUADRANT_LABEL[quadrant]}
            </p>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className="eyebrow">Estado</span>
              <select
                className={styles.input}
                value={status}
                onChange={(e) => setStatus(e.target.value as KanbanStatus)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className="eyebrow">Fecha objetivo</span>
              <input
                type="date"
                className={styles.input}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className="eyebrow">Aviso local (opcional)</span>
            <input
              type="datetime-local"
              className={styles.input}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <SubtaskManager subtasks={subtasks} onChange={setSubtasks} entities={entities} />

          {error ? <p className={styles.error}>{error}</p> : null}
          </div>
        )}

        <footer className={styles.panelFoot}>
          {!isSubtask && onDelete && initial ? (
            <button
              type="button"
              className={styles.delete}
              onClick={() => onDelete(initial)}
              aria-label="Eliminar tarea"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          ) : (
            <span />
          )}
          <div className={styles.footActions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className={styles.save} onClick={isSubtask ? submitSubtask : submit}>
              {isSubtask ? 'Guardar cambios' : initial ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
