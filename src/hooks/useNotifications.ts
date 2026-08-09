import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexieDB';

const RELEASE_INTERVAL = 15000; // revisar cada 15 s para no retrasar el aviso
const NOTIFIED_KEY = 'taskmanager-notified-';

/**
 * Notificaciones locales vía la Notification API (no hay librería externa).
 *
 * El permiso se pide al montar y de nuevo ante el primer gesto del usuario
 * (clic / tecla): los navegadores modernos —Safari y Chrome— ignoran la
 * petición automática sin gesto, así que sin esto el aviso nunca llega.
 *
 * El aviso se emite con el Service Worker cuando está registrado (más fiable)
 * y con `new Notification()` como respaldo mientras la pestaña está abierta.
 * La clave de deduplicación incluye el `dueDate` para que reprogramar una
 * tarea dispare un nuevo aviso en la nueva hora.
 */
export function useNotifications(): void {
  const [tick, setTick] = useState(0);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);

  useEffect(() => {
    if (!('Notification' in window)) return;
    void requestPermission();
    const onGesture = () => {
      void requestPermission();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  // Reprograma la revisión periódica y al volver a la pestaña.
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
      if (!task.id || localStorage.getItem(NOTIFIED_KEY + task.id + '-' + task.dueDate)) continue;

      showNotification(task.title, task.description || 'La hora programada ha llegado.');
      localStorage.setItem(NOTIFIED_KEY + task.id + '-' + task.dueDate, '1');
      void db.tasks.update(task.id, { notified: true, updatedAt: new Date().toISOString() });
    }
  }, [tasks, tick]);
}

function requestPermission(): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

async function showNotification(title: string, body: string): Promise<void> {
  const options: NotificationOptions = {
    body,
    icon: import.meta.env.BASE_URL + 'pwa-192x192.png',
  };
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      /* sin service worker: caemos a la Notification API */
    }
  }
  try {
    new Notification(title, options);
  } catch {
    /* el navegador rechazó el aviso */
  }
}
