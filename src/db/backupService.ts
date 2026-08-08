import { db } from './dexieDB';
import type { Task } from '../types/task';

export const BACKUP_FILENAME = 'taskmanager-backup.json';

/** Descarga todas las tareas como archivo JSON. */
export async function exportToJson(): Promise<void> {
  const tasks = await db.tasks.toArray();
  const payload = {
    app: 'TaskManager',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BACKUP_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.title === 'string' &&
    typeof t.urgent === 'boolean' &&
    typeof t.important === 'boolean' &&
    (t.status === 'todo' || t.status === 'in_progress' || t.status === 'done') &&
    typeof t.targetDate === 'string' &&
    Array.isArray(t.subtasks)
  );
}

/** Lee un backup JSON y lo inserta (sin duplicar ids existentes). */
export async function importFromJson(file: File): Promise<{ added: number; updated: number }> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);
  const source = Array.isArray(raw) ? raw : (raw as { tasks?: unknown[] }).tasks;
  if (!Array.isArray(source)) {
    throw new Error('El archivo no contiene un array de tareas válido.');
  }

  const valid = source.filter(isTask);
  const now = new Date().toISOString();
  const rows = valid.map((t) => ({
    ...t,
    id: t.id && t.id.length > 0 ? t.id : crypto.randomUUID(),
    createdAt: t.createdAt || now,
    updatedAt: now,
  }));

  const result = await db.transaction('rw', db.tasks, async () => {
    let updated = 0;
    for (const row of rows) {
      const existing = await db.tasks.get(row.id);
      if (existing) {
        await db.tasks.put(row);
        updated += 1;
      } else {
        await db.tasks.add(row);
      }
    }
    return { added: rows.length - updated, updated };
  });

  return result;
}
