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
  showSubtasks?: boolean;
}

function notchClass(task: Task): string {
  if (task.urgent && task.important) return styles.notchBoth;
  if (task.urgent) return styles.notchUrgent;
  if (task.important) return styles.notchImportant;
  return styles.notchNone;
}

function toneClass(task: Task): string {
  if (task.urgent && task.important) return styles.toneC1;
  if (task.urgent) return styles.toneC3;
  if (task.important) return styles.toneC2;
  return styles.toneC4;
}

function SubtaskCard({
  task,
  subtask,
  onToggleSubtask,
  onEditSubtask,
}: {
  task: Task;
  subtask: Subtask;
  onToggleSubtask?: (task: Task, subtaskId: string) => void;
  onEditSubtask?: (task: Task, subtask: Subtask) => void;
}) {
  return (
    <li
      className={styles.subtaskCard}
      onClick={(e) => {
        e.stopPropagation();
        onEditSubtask?.(task, subtask);
      }}
    >
      <span className={`${styles.notch} ${notchClass(task)}`} aria-hidden="true" />
      <label className={styles.subtaskCheck} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className={styles.subtaskCheckbox}
          checked={subtask.completed}
          onChange={() => onToggleSubtask?.(task, subtask.id)}
        />
      </label>
      <div className={styles.subtaskBody}>
        <span
          className={`${styles.subtaskTitle} ${toneClass(task)} ${
            subtask.completed ? styles.subtaskTitleDone : ''
          }`}
        >
          {subtask.title}
        </span>
        {subtask.assignee || subtask.targetDate ? (
          <span className={styles.subtaskMeta}>
            {[subtask.assignee, subtask.targetDate ? formatShort(subtask.targetDate) : '']
              .filter(Boolean)
              .join(' · ')}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className={styles.subtaskEdit}
        onClick={(e) => {
          e.stopPropagation();
          onEditSubtask?.(task, subtask);
        }}
        aria-label={`Editar subtarea: ${subtask.title}`}
      >
        <Pencil size={11} strokeWidth={2} />
      </button>
    </li>
  );
}

export function TaskCard({ task, onEdit, onToggleSubtask, onEditSubtask, showSubtasks = true }: Props) {
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
        <h4
          className={`${styles.title} ${toneClass(task)} ${
            task.status === 'done' ? styles.titleDone : ''
          }`}
        >
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
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          ) : null}
        </div>
      </div>

      {showSubtasks && task.subtasks.length > 0 ? (
        <ul className={styles.subtaskGroup} onClick={(e) => e.stopPropagation()}>
          {task.subtasks.map((s) => (
            <SubtaskCard
              key={s.id}
              task={task}
              subtask={s}
              onToggleSubtask={onToggleSubtask}
              onEditSubtask={onEditSubtask}
            />
          ))}
        </ul>
      ) : null}
    </article>
  );
}
