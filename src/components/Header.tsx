import { useRef } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import type { TaskView } from '../types/task';
import styles from './Header.module.css';

interface Props {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  entities: string[];
  entityFilter: string;
  onEntityFilter: (value: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onNewTask: () => void;
}

const VIEWS: { key: TaskView; label: string }[] = [
  { key: 'matrix', label: 'Matriz' },
  { key: 'week', label: 'Semana' },
  { key: 'kanban', label: 'Tablero' },
];

export function Header({
  view,
  onViewChange,
  entities,
  entityFilter,
  onEntityFilter,
  onExport,
  onImport,
  onNewTask,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <rect x="1.5" y="1.5" width="21" height="21" stroke="currentColor" strokeWidth="1.6" />
            <path d="M1.5 12H22.5" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
            <path d="M12 1.5V22.5" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
            <path d="M1.5 1.5H12V12H1.5Z" fill="var(--urgent)" />
          </svg>
        </span>
        <span className={styles.wordmark}>TaskManager</span>
      </div>

      <nav className={styles.tabs} aria-label="Vistas">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={view === v.key ? styles.tabActive : styles.tab}
            onClick={() => onViewChange(v.key)}
            aria-pressed={view === v.key}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <div className={styles.actions}>
        {entities.length > 0 ? (
          <select
            className={styles.filter}
            value={entityFilter}
            onChange={(e) => onEntityFilter(e.target.value)}
            aria-label="Filtrar por entidad"
          >
            <option value="__all__">Todas las entidades</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="button"
          className={styles.backup}
          onClick={onExport}
          title="Descargar copia de seguridad"
          aria-label="Descargar copia de seguridad"
        >
          <Download size={16} strokeWidth={2} />
        </button>

        <button
          type="button"
          className={styles.backup}
          onClick={() => fileRef.current?.click()}
          title="Importar copia de seguridad"
          aria-label="Importar copia de seguridad"
        >
          <Upload size={16} strokeWidth={2} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className={styles.hiddenInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />

        <button type="button" className={styles.primary} onClick={onNewTask}>
          <Plus size={15} strokeWidth={2.2} />
          Nueva tarea
        </button>
      </div>
    </header>
  );
}
