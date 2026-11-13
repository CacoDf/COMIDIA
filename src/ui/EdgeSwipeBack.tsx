import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

const EDGE_PX = 20;
const MIN_DX = 70;
const MAX_DY = 60;
/** Pantallas raíz: desde aquí no hay a dónde volver. */
const ROOTS = new Set(['/', '/comidas', '/progreso', '/ajustes', '/bienvenida']);

/**
 * Deslizar desde el borde izquierdo vuelve a la pantalla anterior, como en iOS.
 * Instalada en la pantalla de inicio, la app no tiene el gesto de Safari, así que lo reponemos.
 */
export function EdgeSwipeBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const path = useRef(pathname);
  path.current = pathname;
  useEffect(() => {
    let start: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || e.clientX > EDGE_PX) return;
      if (document.querySelector('.sheet')) return; // con una hoja abierta, el gesto es de la hoja
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = Math.abs(e.clientY - start.y);
      start = null;
      if (dx > MIN_DX && dy < MAX_DY && !ROOTS.has(path.current)) navigate(-1);
    };
    const cancel = () => { start = null; };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [navigate]);
  return ROOTS.has(pathname) ? null : <div className="edge-zone" aria-hidden="true" />;
}
