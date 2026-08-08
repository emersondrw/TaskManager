import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, X } from 'lucide-react';
import type { Task } from '../types/task';
import { formatShort, todayStr } from '../utils/dateUtils';
import styles from './MorningReviewModal.module.css';

interface Props {
  open: boolean;
  overdue: Task[];
  onClose: () => void;
  onReschedule: (ids: string[], dateStr: string) => void;
  onComplete: (ids: string[]) => void;
}

export function MorningReviewModal({ open, overdue, onClose, onReschedule, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    if (!open) return;
    setDate(todayStr());
    setSelected(new Set(overdue.map((t) => t.id ?? '')));
  }, [open, overdue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const overdueIds = useMemo(() => overdue.map((t) => t.id ?? ''), [overdue]);
  const selectedIds = useMemo(
    () => overdueIds.filter((id) => selected.has(id)),
    [overdueIds, selected],
  );

  if (!open || overdue.length === 0) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selectedIds.length === overdueIds.length ? new Set() : new Set(overdueIds));
  };

  const nothing = selectedIds.length === 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Revisión de la mañana">
        <header className={styles.head}>
          <div>
            <p className="eyebrow">Revisión de la mañana</p>
            <h2 className={styles.title}>
              {overdue.length} {overdue.length === 1 ? 'tarea quedó' : 'tareas quedaron'} atrás
            </h2>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={16} strokeWidth={2} />
          </button>
        </header>

        <p className={styles.hint}>
          Antes de empezar el día, decide qué hacer con lo que no terminaste. Puedes moverlo a hoy o
          a otra fecha, o darlo por hecho.
        </p>

        <ul className={styles.list}>
          {overdue.map((t) => (
            <li key={t.id} className={styles.item}>
              <label className={styles.itemLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selected.has(t.id ?? '')}
                  onChange={() => toggle(t.id ?? '')}
                />
                <div className={styles.itemBody}>
                  <span className={styles.itemTitle}>{t.title}</span>
                  <span className={styles.itemMeta}>Vencía el {formatShort(t.targetDate)}</span>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <label className={styles.selectAll}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={selectedIds.length === overdueIds.length && overdueIds.length > 0}
              onChange={toggleAll}
            />
            <span className="eyebrow">Seleccionar todo</span>
          </label>

          <div className={styles.actionRow}>
            <label className={styles.dateField}>
              <span className="eyebrow">Mover a</span>
              <input
                type="date"
                className={styles.dateInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={styles.moveBtn}
              disabled={nothing}
              onClick={() => onReschedule(selectedIds, date)}
            >
              <CalendarCheck size={14} strokeWidth={2} />
              Mover
            </button>
            <button
              type="button"
              className={styles.doneBtn}
              disabled={nothing}
              onClick={() => onComplete(selectedIds)}
            >
              <Check size={14} strokeWidth={2} />
              Marcar hechas
            </button>
          </div>
        </div>

        <footer className={styles.foot}>
          <button type="button" className={styles.later} onClick={onClose}>
            Más tarde
          </button>
        </footer>
      </div>
    </div>
  );
}
