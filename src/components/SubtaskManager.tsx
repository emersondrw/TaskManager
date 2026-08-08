import { useState } from 'react';
import { ChevronRight, Plus, X } from 'lucide-react';
import { createSubtask, type Subtask } from '../types/task';
import { isoToLocalDateTime, localDateTimeToISO, todayStr } from '../utils/dateUtils';
import styles from './SubtaskManager.module.css';

interface Props {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  entities: string[];
}

export function SubtaskManager({ subtasks, onChange, entities }: Props) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    onChange([...subtasks, createSubtask(title)]);
    setDraft('');
  };

  const updateSubtask = (id: string, patch: Partial<Subtask>) => {
    onChange(
      subtasks.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s,
      ),
    );
  };

  const toggle = (id: string) => {
    updateSubtask(id, { completed: !subtasks.find((s) => s.id === id)?.completed });
  };

  const remove = (id: string) => {
    onChange(subtasks.filter((s) => s.id !== id));
  };

  const done = subtasks.filter((s) => s.completed).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className="eyebrow">Subtareas</span>
        {subtasks.length > 0 ? (
          <span className={styles.count}>
            {done}/{subtasks.length}
          </span>
        ) : null}
      </div>

      {subtasks.length > 0 ? (
        <ul className={styles.list}>
          {subtasks.map((s) => {
            const isOpen = expanded === s.id;
            return (
              <li key={s.id} className={styles.row}>
                <div className={styles.item}>
                  <label className={styles.itemLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={s.completed}
                      onChange={() => toggle(s.id)}
                    />
                    <div className={styles.itemBody}>
                      <span className={s.completed ? styles.itemTitleDone : styles.itemTitle}>
                        {s.title}
                      </span>
                      {s.assignee || s.targetDate ? (
                        <span className={styles.itemMeta}>
                          {[s.assignee, s.targetDate].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                    </div>
                  </label>
                  <button
                    type="button"
                    className={styles.expand}
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    aria-label={isOpen ? 'Ocultar detalles' : 'Ver detalles'}
                    aria-expanded={isOpen}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={2}
                      className={isOpen ? styles.expandOpen : undefined}
                    />
                  </button>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => remove(s.id)}
                    aria-label={`Eliminar subtarea: ${s.title}`}
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>

                {isOpen ? (
                  <div className={styles.detailPanel}>
                    <label className={styles.field}>
                      <span className="eyebrow">Título</span>
                      <input
                        className={styles.input}
                        value={s.title}
                        onChange={(e) => updateSubtask(s.id, { title: e.target.value })}
                      />
                    </label>

                    <div className={styles.fieldRow}>
                      <label className={styles.field}>
                        <span className="eyebrow">Responsable</span>
                        <input
                          className={styles.input}
                          value={s.assignee ?? ''}
                          onChange={(e) => updateSubtask(s.id, { assignee: e.target.value })}
                          list="subtask-assignees"
                          placeholder="¿Quién la hace?"
                        />
                      </label>
                      <label className={styles.field}>
                        <span className="eyebrow">Fecha objetivo</span>
                        <input
                          type="date"
                          className={styles.input}
                          value={s.targetDate ?? todayStr()}
                          onChange={(e) => updateSubtask(s.id, { targetDate: e.target.value })}
                        />
                      </label>
                    </div>

                    <label className={styles.field}>
                      <span className="eyebrow">Detalles</span>
                      <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        value={s.details ?? ''}
                        onChange={(e) => updateSubtask(s.id, { details: e.target.value })}
                        rows={2}
                        placeholder="Qué incluye, criterio de terminado…"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className="eyebrow">Aviso local (opcional)</span>
                      <input
                        type="datetime-local"
                        className={styles.input}
                        value={s.dueDate ? isoToLocalDateTime(s.dueDate) : ''}
                        onChange={(e) =>
                          updateSubtask(s.id, {
                            dueDate: e.target.value ? localDateTimeToISO(e.target.value) : undefined,
                          })
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span className="eyebrow">Notas</span>
                      <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        value={s.notes ?? ''}
                        onChange={(e) => updateSubtask(s.id, { notes: e.target.value })}
                        rows={2}
                        placeholder="Observaciones de seguimiento…"
                      />
                    </label>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>Descompón la tarea en pasos más pequeños.</p>
      )}

      <datalist id="subtask-assignees">
        {entities.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>

      <div className={styles.addRow}>
        <input
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Nueva subtarea…"
          aria-label="Nueva subtarea"
        />
        <button type="button" className={styles.addBtn} onClick={add} aria-label="Añadir subtarea">
          <Plus size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
