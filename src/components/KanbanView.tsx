import { useState, type DragEvent } from 'react';
import { Plus } from 'lucide-react';
import type { KanbanStatus, Subtask, Task } from '../types/task';
import { TaskCard } from './TaskCard';
import styles from './KanbanView.module.css';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onEditSubtask: (task: Task, subtask: Subtask) => void;
  onMoveToStatus: (taskId: string, status: KanbanStatus) => void;
  onQuickAdd: (status: KanbanStatus) => void;
}

const COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: 'todo', label: 'Pendiente' },
  { status: 'in_progress', label: 'En curso' },
  { status: 'done', label: 'Hecho' },
];

export function KanbanView({
  tasks,
  onEdit,
  onToggleSubtask,
  onEditSubtask,
  onMoveToStatus,
  onQuickAdd,
}: Props) {
  const [over, setOver] = useState<KanbanStatus | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(true);

  const handleDrop = (e: DragEvent<HTMLDivElement>, status: KanbanStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setOver(null);
    if (id) onMoveToStatus(id, status);
  };

  return (
    <section className={styles.wrap} aria-label="Tablero de trabajo">
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Tablero de trabajo</p>
          <h2 className={styles.title}>Flujo por estado</h2>
        </div>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShowSubtasks((v) => !v)}
          aria-pressed={showSubtasks}
        >
          <span className={styles.toggleTrack}>
            <span className={showSubtasks ? styles.toggleKnobOn : styles.toggleKnob} />
          </span>
          <span className="eyebrow">{showSubtasks ? 'Con subtareas' : 'Solo tareas'}</span>
        </button>
      </header>
      <div className={styles.board}>
        {COLUMNS.map((col) => {
          const list = tasks.filter((t) => t.status === col.status);
          const isOver = over === col.status;
          return (
            <div
              key={col.status}
              className={`${styles.col} ${isOver ? styles.colOver : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setOver(col.status);
              }}
              onDragLeave={() => setOver((o) => (o === col.status ? null : o))}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className={styles.colHead}>
                <span className={`${styles.dot} ${styles[`dot${col.status}`]}`} aria-hidden="true" />
                <span className={styles.colLabel}>{col.label}</span>
                <span className={styles.count}>{list.length}</span>
                <button
                  type="button"
                  className={styles.addCol}
                  onClick={() => onQuickAdd(col.status)}
                  aria-label={`Añadir tarea en ${col.label}`}
                >
                  <Plus size={13} strokeWidth={2} />
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
                      showSubtasks={showSubtasks}
                    />
                  ))
                ) : (
                  <p className={styles.empty}>Suelta una tarea aquí.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
