import { useState, type DragEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import {
  dayNumber,
  isWeekend,
  isSameDay,
  lastDays,
  startOfWeek,
  todayStr,
  weekdayLabel,
} from '../utils/dateUtils';
import styles from './WeekView.module.css';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onMoveToDay: (taskId: string, dateStr: string) => void;
  onQuickAdd: (dateStr: string) => void;
}

export function WeekView({ tasks, onEdit, onMoveToDay, onQuickAdd }: Props) {
  const today = todayStr();
  const days = lastDays(startOfWeek(today), 7);
  const [over, setOver] = useState<string | null>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setOver(null);
    if (id) onMoveToDay(id, dateStr);
  };

  return (
    <section className={styles.wrap} aria-label="Vista semanal">
      <div className={styles.board}>
        {days.map((day) => {
          const list = tasks.filter((t) => t.targetDate === day);
          const isToday = isSameDay(day, today);
          const isOver = over === day;
          return (
            <div
              key={day}
              className={`${styles.col} ${isToday ? styles.colToday : ''} ${
                isOver ? styles.colOver : ''
              } ${isWeekend(day) ? styles.colWeekend : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setOver(day);
              }}
              onDragLeave={() => setOver((o) => (o === day ? null : o))}
              onDrop={(e) => handleDrop(e, day)}
              onDoubleClick={() => onQuickAdd(day)}
            >
              <div className={styles.colHead}>
                <span className="eyebrow">{weekdayLabel(day)}</span>
                <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ''}`}>
                  {dayNumber(day)}
                </span>
                <span className={styles.count}>{list.length}</span>
                <button
                  type="button"
                  className={styles.addDay}
                  onClick={() => onQuickAdd(day)}
                  aria-label={`Añadir tarea el ${weekdayLabel(day)} ${dayNumber(day)}`}
                >
                  <Plus size={13} strokeWidth={2} />
                </button>
              </div>
              <div className={styles.cards}>
                {list.map((t) => (
                  <TaskCard key={t.id} task={t} onEdit={onEdit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
