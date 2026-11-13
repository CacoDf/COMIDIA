import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BarButton } from './Button';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Texto del botón izquierdo: "Cancelar" cuando hay algo que descartar, "Cerrar" cuando solo se mira. */
  closeLabel?: string;
  /** Acción principal arriba a la derecha (ej. "Listo", "Agregar"). */
  doneLabel?: string;
  onDone?: () => void;
  doneDisabled?: boolean;
  children: ReactNode;
};

const DISMISS_PX = 120;

/** Hoja que sube desde abajo. Se cierra con el botón, tocando fuera, con Escape o arrastrándola hacia abajo. */
export function Sheet({ open, title, onClose, closeLabel = 'Cancelar', doneLabel, onDone, doneDisabled, children }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const drag = useRef<{ startY: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Solo al abrir: si dependiera de onClose, cada redibujo le robaría el foco al campo que se está escribiendo.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { startY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) setOffset(Math.max(0, e.clientY - drag.current.startY));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const moved = e.clientY - drag.current.startY;
    drag.current = null;
    if (moved > DISMISS_PX) {
      setLeaving(true);
      setTimeout(() => { setLeaving(false); setOffset(0); closeRef.current(); }, 220);
    } else {
      setOffset(0);
    }
  };

  return createPortal(
    <div className={leaving ? 'sheet-backdrop sheet-backdrop--leaving' : 'sheet-backdrop'} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={leaving ? { transform: 'translateY(100%)' } : drag.current && offset ? { transform: `translateY(${offset}px)`, transition: 'none' } : undefined}
      >
        <div
          className="sheet__handle"
          data-testid="sheet-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { drag.current = null; setOffset(0); }}
        >
          <div className="sheet__grabber" aria-hidden="true" />
          <div className="sheet__header">
            <div><BarButton onClick={onClose}>{closeLabel}</BarButton></div>
            <h2 id={titleId} className="t-headline" style={{ textAlign: 'center' }}>{title}</h2>
            <div>{doneLabel && onDone && <BarButton bold onClick={onDone} disabled={doneDisabled}>{doneLabel}</BarButton>}</div>
          </div>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
