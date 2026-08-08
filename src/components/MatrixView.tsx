import { Plus } from 'lucide-react';
import type { Quadrant, Subtask, Task } from '../types/task';
import { QUADRANT_LABEL, quadrantOf } from '../types/task';
import { TaskCard } from './TaskCard';
import { formatShort, todayStr } from '../utils/dateUtils';
import styles from './MatrixView.module.css';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onEditSubtask: (task: Task, subtask: Subtask) => void;
  onQuickAdd: (urgent: boolean, important: boolean) => void;
}

const QUADRANTS: { key: Quadrant; urgent: boolean; important: boolean }[] = [
  { key: 'C1', urgent: true, important: true },
  { key: 'C2', urgent: false, important: true },
  { key: 'C3', urgent: true, important: false },
  { key: 'C4', urgent: false, important: false },
];

export function MatrixView({ tasks, onEdit, onToggleSubtask, onEditSubtask, onQuickAdd }: Props) {
  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.targetDate === today);

  const group = (q: Quadrant) =>
    todayTasks.filter((t) => quadrantOf(t) === q);

  return (
    <section className={styles.wrap} aria-label="Matriz de hoy">
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Matriz de hoy</p>
          <h2 className={styles.title}>{formatShort(today)}</h2>
        </div>
        <div className={styles.legend} aria-hidden="true">
          {QUADRANTS.map((q) => (
            <span key={q.key} className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles[`dot${q.key}`]}`} />
              <span className="eyebrow">{q.key}</span>
              <span className={styles.legendCount}>{group(q.key).length}</span>
            </span>
          ))}
        </div>
      </header>

      <div className={styles.field}>
        <span className={styles.axisX} aria-hidden="true" />
        <span className={styles.axisY} aria-hidden="true" />
        <span className={styles.center} aria-hidden="true" />
        <span className={`eyebrow ${styles.axisLabelX}`}>Importante →</span>
        <span className={`eyebrow ${styles.axisLabelY}`}>Urgente</span>

        {QUADRANTS.map((q) => {
          const list = group(q.key);
          return (
            <section
              key={q.key}
              className={`${styles.quad} ${styles[`quad${q.key}`]}`}
              data-quadrant={q.key}
            >
              <div className={styles.quadHead}>
                <span className={styles.quadCode}>{q.key}</span>
                <span className={styles.quadName}>{QUADRANT_LABEL[q.key]}</span>
                <button
                  type="button"
                  className={styles.quickAdd}
                  onClick={() => onQuickAdd(q.urgent, q.important)}
                  aria-label={`Añadir tarea en ${q.key}: ${QUADRANT_LABEL[q.key]}`}
                >
                  <Plus size={14} strokeWidth={2} />
                </button>
              </div>
              <div className={styles.cards}>
                {list.length > 0 ? (
                  list.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onEdit={onEdit}
                      onToggleSubtask={onToggleSubtask}
                      onEditSubtask={onEditSubtask}
                      showSubtasks={false}
                    />
                  ))
                ) : (
                  <p className={styles.empty}>Sin tareas.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
