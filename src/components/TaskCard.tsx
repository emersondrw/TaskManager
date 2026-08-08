import type { DragEvent } from 'react';
import { Pencil, Timer } from 'lucide-react';
import type { Subtask, Task } from '../types/task';
import { formatShort, formatTime } from '../utils/dateUtils';
import styles from './TaskCard.module.css';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onToggleSubtask?: (task: Task, subtaskId: string) => void;
  onEditSubtask?: (task: Task, subtask: Subtask) => void;
}

function notchClass(task: Task): string {
  if (task.urgent && task.important) return styles.notchBoth;
  if (task.urgent) return styles.notchUrgent;
  if (task.important) return styles.notchImportant;
  return styles.notchNone;
}

export function TaskCard({ task, onEdit, onToggleSubtask, onEditSubtask }: Props) {
  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    e.dataTransfer.setData('text/plain', task.id ?? '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const open = () => onEdit(task);

  return (
    <article
      className={styles.card}
      draggable
      onDragStart={handleDragStart}
      onClick={open}
      title={task.title}
    >
      <span className={`${styles.notch} ${notchClass(task)}`} aria-hidden="true" />
      <div className={styles.body}>
        <h4 className={task.status === 'done' ? `${styles.title} ${styles.titleDone}` : styles.title}>
          {task.title}
        </h4>
        {task.description ? (
          <p className={`${styles.meta} ${styles.desc}`}>{task.description}</p>
        ) : null}

        {task.subtasks.length > 0 ? (
          <ul className={styles.subtaskList}>
            {task.subtasks.map((s) => (
              <li key={s.id} className={styles.subtaskItem}>
                <label
                  className={styles.subtaskLabel}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className={styles.subtaskCheckbox}
                    checked={s.completed}
                    onChange={() => onToggleSubtask?.(task, s.id)}
                  />
                  <span className={s.completed ? styles.subtaskTitleDone : styles.subtaskTitle}>
                    {s.title}
                  </span>
                </label>
                {s.assignee || s.targetDate ? (
                  <span className={styles.subtaskMeta}>
                    {[s.assignee, s.targetDate ? formatShort(s.targetDate) : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                ) : null}
                <button
                  type="button"
                  className={styles.subtaskEdit}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubtask?.(task, s);
                  }}
                  aria-label={`Editar subtarea: ${s.title}`}
                >
                  <Pencil size={11} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.footer}>
          {task.relatedTo ? <span className={styles.entity}>{task.relatedTo}</span> : null}
          {task.dueDate ? (
            <span className={`${styles.meta} ${styles.time}`}>
              <Timer size={12} strokeWidth={2} aria-hidden="true" />
              {formatTime(task.dueDate)}
            </span>
          ) : null}
          {task.subtasks.length > 0 ? (
            <span className={`${styles.meta} ${styles.subtasks}`}>
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
