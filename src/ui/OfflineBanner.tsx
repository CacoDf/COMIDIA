import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Aviso discreto sobre la barra de pestañas cuando no hay internet. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="offline" role="status">
      <WifiOff size={14} strokeWidth={2.2} aria-hidden="true" />
      Sin conexión: la IA y los productos nuevos no están disponibles
    </div>
  );
}
