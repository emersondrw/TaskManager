import type { DragEvent } from 'react';
import { CheckSquare, Timer } from 'lucide-react';
import type { Task } from '../types/task';
import { formatTime } from '../utils/dateUtils';
import styles from './TaskCard.module.css';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

function notchClass(task: Task): string {
  if (task.urgent && task.important) return styles.notchBoth;
  if (task.urgent) return styles.notchUrgent;
  if (task.important) return styles.notchImportant;
  return styles.notchNone;
}

export function TaskCard({ task, onEdit }: Props) {
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
              <CheckSquare size={12} strokeWidth={2} aria-hidden="true" />
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
