import { useState, type DragEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Subtask, Task } from '../types/task';
import { TaskCard } from './TaskCard';
import {
  addDays,
  dayNumber,
  formatShort,
  isWeekend,
  isSameDay,
  startOfWeek,
  todayStr,
  weekdayLabel,
  weekDays,
} from '../utils/dateUtils';
import styles from './WeekView.module.css';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onToggleSubtask: (task: Task, subtaskId: string) => void;
  onEditSubtask: (task: Task, subtask: Subtask) => void;
  onMoveToDay: (taskId: string, dateStr: string) => void;
  onQuickAdd: (dateStr: string) => void;
}

export function WeekView({
  tasks,
  onEdit,
  onToggleSubtask,
  onEditSubtask,
  onMoveToDay,
  onQuickAdd,
}: Props) {
  const today = todayStr();
  const [weekOffset, setWeekOffset] = useState(0);
  const [over, setOver] = useState<string | null>(null);

  const anchor = addDays(today, weekOffset * 7);
  const weekStart = startOfWeek(anchor);
  const days = weekDays(weekStart);

  const handleDrop = (e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    setOver(null);
    if (id) onMoveToDay(id, dateStr);
  };

  return (
    <section className={styles.wrap} aria-label="Vista semanal">
      <header className={styles.head}>
        <div>
          <p className="eyebrow">Vista semanal</p>
          <h2 className={styles.title}>
            {formatShort(weekStart)} — {formatShort(addDays(weekStart, 6))}
          </h2>
        </div>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          {weekOffset !== 0 ? (
            <button
              type="button"
              className={styles.todayBtn}
              onClick={() => setWeekOffset(0)}
            >
              <CalendarDays size={14} strokeWidth={2} />
              Esta semana
            </button>
          ) : (
            <span className={styles.todayTag}>Esta semana</span>
          )}
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Semana siguiente"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </header>

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
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={onEdit}
                    onToggleSubtask={onToggleSubtask}
                    onEditSubtask={onEditSubtask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
