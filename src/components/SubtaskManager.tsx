import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Subtask } from '../types/task';
import styles from './SubtaskManager.module.css';

interface Props {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

export function SubtaskManager({ subtasks, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    onChange([...subtasks, { id: crypto.randomUUID(), title, completed: false }]);
    setDraft('');
  };

  const toggle = (id: string) => {
    onChange(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    );
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
          {subtasks.map((s) => (
            <li key={s.id} className={styles.item}>
              <label className={styles.itemLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={s.completed}
                  onChange={() => toggle(s.id)}
                />
                <span className={s.completed ? styles.itemTitleDone : styles.itemTitle}>
                  {s.title}
                </span>
              </label>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(s.id)}
                aria-label={`Eliminar subtarea: ${s.title}`}
              >
                <X size={13} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Descompón la tarea en pasos más pequeños.</p>
      )}

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
