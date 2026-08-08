import Dexie, { type Table } from 'dexie';
import type { Task } from '../types/task';

/**
 * Base de datos local (IndexedDB) de la aplicación.
 * Toda la persistencia es offline-first; el servidor no interviene.
 */
export const db = new Dexie('TaskManager') as Dexie & {
  tasks: Table<Task, string>;
};

db.version(1).stores({
  tasks: 'id, targetDate, dueDate, status, relatedTo',
});

export function generateId(): string {
  return crypto.randomUUID();
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'notified'>;

export async function addTask(input: TaskInput): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  await db.tasks.add({
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
    notified: input.dueDate ? false : undefined,
  });
  return id;
}

export async function updateTask(
  id: string,
  changes: Partial<Omit<Task, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.tasks.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

/** Lista ordenada de entidades (personas / clientes / empresas) en uso. */
export async function getRelatedEntities(): Promise<string[]> {
  const all = await db.tasks.toArray();
  const set = new Set<string>();
  for (const t of all) {
    if (t.relatedTo && t.relatedTo.trim()) set.add(t.relatedTo.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}
