import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexieDB';

const RELEASE_INTERVAL = 60000; // revisar cada minuto
const NOTIFIED_KEY = 'taskmanager-notified-';

/**
 * Pide permiso para notificaciones locales y lanza avisos cuando llega
 * la hora programada de una tarea. La notificación se emite desde la
 * página (Notification API) mientras la app está abierta; el estado
 * `notified` evita duplicados entre recargas.
 */
export function useNotifications(): void {
  const [tick, setTick] = useState(0);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  // Reprograma la revisión cada minuto y al volver a la pestaña.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), RELEASE_INTERVAL);
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (!tasks || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const now = Date.now();
    for (const task of tasks) {
      if (!task.dueDate || task.notified) continue;
      if (new Date(task.dueDate).getTime() > now) continue;
      if (!task.id || localStorage.getItem(NOTIFIED_KEY + task.id)) continue;

      try {
        new Notification(task.title, {
          body: task.description || 'La hora programada ha llegado.',
        });
      } catch {
        continue;
      }
      localStorage.setItem(NOTIFIED_KEY + task.id, '1');
      void db.tasks.update(task.id, { notified: true, updatedAt: new Date().toISOString() });
    }
  }, [tasks, tick]);
}
