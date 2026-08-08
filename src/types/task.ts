export type KanbanStatus = 'todo' | 'in_progress' | 'done';

export type TaskView = 'matrix' | 'week' | 'kanban';

export type Quadrant = 'C1' | 'C2' | 'C3' | 'C4';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  details?: string; // Descripción / detalles
  notes?: string; // Notas libres de seguimiento
  assignee?: string; // Responsable
  targetDate?: string; // YYYY-MM-DD
  dueDate?: string; // ISO String para aviso local
  createdAt?: string;
  updatedAt?: string;
}

export function createSubtask(title: string): Subtask {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title, completed: false, createdAt: now, updatedAt: now };
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  relatedTo?: string; // Persona, cliente o empresa vinculada
  urgent: boolean;
  important: boolean; // Define el Cuadrante Eisenhower (C1-C4)
  status: KanbanStatus; // Estado en la vista Kanban
  targetDate: string; // YYYY-MM-DD (para vistas Día / Semana)
  dueDate?: string; // ISO String con hora para la notificación local
  notified?: boolean; // Estado del aviso emitido por el Service Worker
  subtasks: Subtask[]; // Subtareas anidadas
  createdAt: string;
  updatedAt: string;
}

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  C1: 'Urgente + Importante',
  C2: 'Importante, no urgente',
  C3: 'Urgente, no importante',
  C4: 'Ni urgente ni importante',
};

export function quadrantOf(task: Pick<Task, 'urgent' | 'important'>): Quadrant {
  if (task.urgent && task.important) return 'C1';
  if (!task.urgent && task.important) return 'C2';
  if (task.urgent && !task.important) return 'C3';
  return 'C4';
}
