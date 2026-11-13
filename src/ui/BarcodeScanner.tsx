import { useEffect, useRef } from 'react';
import { StableReader } from '../lib/barcode';

type Props = {
  onDetected: (code: string) => void;
  onUnavailable: (reason: 'denied' | 'unsupported') => void;
  /** Mientras está en pausa la cámara sigue abierta pero no se reportan códigos. */
  paused?: boolean;
};

/** Escáner en vivo con la cámara trasera. Libera la cámara al desmontarse. */
export function BarcodeScanner({ onDetected, onUnavailable, paused = false }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(paused);
  const handlers = useRef({ onDetected, onUnavailable });
  pausedRef.current = paused;
  handlers.current = { onDetected, onUnavailable };

  useEffect(() => {
    let stream: MediaStream | undefined;
    let stopped = false;
    const reader = new StableReader(3);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        handlers.current.onUnavailable('unsupported');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        handlers.current.onUnavailable((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'unsupported');
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const { BarcodeDetector } = await import('barcode-detector/ponyfill');
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const v = video.current!;
      v.srcObject = stream;
      await v.play().catch(() => {});
      while (!stopped) {
        if (!pausedRef.current && v.readyState >= 2) {
          const found = await detector.detect(v).catch(() => []);
          const raw = found[0]?.rawValue;
          if (raw) {
            const code = reader.push(raw);
            if (code) {
              navigator.vibrate?.(40);
              handlers.current.onDetected(code);
            }
          }
        } else if (pausedRef.current) {
          reader.reset();
        }
        await new Promise((r) => setTimeout(r, 120));
      }
    })();

    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="scanner">
      <video ref={video} playsInline muted aria-label="Cámara" />
      <div className="scanner__frame" aria-hidden="true" />
    </div>
  );
}
