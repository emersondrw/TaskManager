import { useEffect } from 'react';

/**
 * Solicita que el navegador conserve el almacenamiento local
 * (IndexedDB) de forma persistente, para que las tareas no se
 * purguen bajo presión de espacio.
 */
export function usePersistentStorage(): void {
  useEffect(() => {
    const go = async () => {
      if (navigator.storage && navigator.storage.persist) {
        try {
          const persisted = await navigator.storage.persisted();
          if (!persisted) await navigator.storage.persist();
        } catch {
          // sin soporte: se ignora
        }
      }
    };
    void go();
  }, []);
}
