// Página de prueba para confirmar en el iPhone que el escáner, Open Food Facts y Gemini funcionan.
// Usa los servicios reales de la app. Se elimina en la Tarea 20.
import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';
import { fetchProduct, searchProducts } from '../../services/openFoodFacts';
import { AiError, estimateFromPhoto, estimateFromText, listModels, pickDefaultModel, type AiConfig } from '../../services/gemini';
import { sumMacros } from '../../domain/macros';
import type { Item } from '../../domain/types';

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 16, margin: '16px 0', boxShadow: '0 1px 3px rgba(0,0,0,.08)' };
const btn: React.CSSProperties = { fontSize: 17, padding: '12px 16px', borderRadius: 12, border: 'none', background: '#2e7d32', color: '#fff', width: '100%', marginTop: 8 };
const field: React.CSSProperties = { fontSize: 17, padding: 12, borderRadius: 12, border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', marginTop: 8 };
const ok: React.CSSProperties = { color: '#1b5e20', fontWeight: 600 };
const bad: React.CSSProperties = { color: '#b71c1c', fontWeight: 600 };

function aiMessage(e: unknown): string {
  if (e instanceof AiError) {
    return {
      'no-key': 'Falta la key.',
      'bad-key': 'Google rechazó la key. Revisa que esté bien copiada.',
      quota: 'Se acabó la cuota gratis de hoy para este modelo.',
      offline: 'No hay conexión o el teléfono bloqueó la llamada.',
      'invalid-response': 'La IA respondió algo que no se pudo leer.',
      'no-food': 'La IA no vio comida.',
      unknown: `Error de Google: ${e.message}`,
    }[e.kind];
  }
  return String(e);
}

function ItemsResult({ items, ms }: { items: Item[]; ms: number }) {
  const t = sumMacros(items.map((i) => i.macros));
  return (
    <div>
      <p style={ok}>✅ Funciona ({(ms / 1000).toFixed(1)} s)</p>
      <ul style={{ paddingLeft: 18 }}>
        {items.map((i, n) => (
          <li key={n}>{i.name} · {Math.round(i.grams)} g · {Math.round(i.macros.kcal)} kcal</li>
        ))}
      </ul>
      <p>Total: {Math.round(t.kcal)} kcal · P {Math.round(t.protein)} g · C {Math.round(t.carbs)} g · G {Math.round(t.fat)} g</p>
      <p style={{ fontSize: 14, color: '#555' }}>¿Te parecen razonables estos números?</p>
    </div>
  );
}

// Paso 1: escáner + Open Food Facts

type ScanResult = { code: string; found: string | null; error?: string };

function ScannerStep() {
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ScanResult[]>([]);
  const lastCode = useRef('');

  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | undefined;
    let stop = false;
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        while (!stop) {
          const found = await detector.detect(v).catch(() => []);
          const code = found[0]?.rawValue;
          if (code && code !== lastCode.current) {
            lastCode.current = code;
            navigator.vibrate?.(50);
            try {
              const food = await fetchProduct(code);
              const found = food ? `${food.name}${food.brand ? ` (${food.brand})` : ''} · ${Math.round(food.per100.kcal)} kcal por 100 g` : null;
              setResults((r) => [{ code, found }, ...r]);
            } catch (e) {
              setResults((r) => [{ code, found: null, error: String(e) }, ...r]);
            }
          }
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (e) {
        setError(`No se pudo abrir la cámara: ${String(e)}`);
        setOn(false);
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [on]);

  const foundCount = results.filter((r) => r.found).length;

  return (
    <section style={card}>
      <h2>1. Escanear productos</h2>
      <p>Abre la cámara y apunta a los códigos de barras de 5 a 10 productos que tengas en la casa, uno por uno.</p>
      <button style={btn} onClick={() => { setError(''); setOn((o) => !o); }}>{on ? 'Cerrar cámara' : 'Abrir cámara'}</button>
      <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 12, marginTop: 8, display: on ? 'block' : 'none' }} />
      {error && <p style={bad}>❌ {error}</p>}
      {results.length > 0 && (
        <>
          <p><b>Encontrados: {foundCount} de {results.length}</b></p>
          <ul style={{ paddingLeft: 18 }}>
            {results.map((r) => (
              <li key={r.code} style={{ marginBottom: 6 }}>
                {r.found ? <span style={ok}>✅ {r.found}</span>
                  : r.error ? <span style={bad}>❌ {r.code}: error al buscar ({r.error})</span>
                  : <span style={bad}>❌ {r.code}: leído, pero no está en la base de datos</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// Paso 2: key de Gemini

function KeyStep({ onReady }: { onReady: (cfg: AiConfig, models: string[]) => void }) {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section style={card}>
      <h2>2. Tu key de Gemini</h2>
      <p>Pégala aquí. Solo se usa en esta página y se borra al cerrarla.</p>
      <input style={field} type="password" autoComplete="off" placeholder="AIza…" value={key} onChange={(e) => setKey(e.target.value)} />
      <button style={btn} disabled={busy || !key} onClick={async () => {
        setBusy(true);
        try {
          const models = await listModels(key);
          const model = pickDefaultModel(models);
          if (!model) throw new Error('Tu cuenta no tiene modelos disponibles.');
          onReady({ key, model }, models);
          setStatus({ ok: true, text: `Tu key funciona. Voy a usar el modelo ${model}.` });
        } catch (e) {
          setStatus({ ok: false, text: aiMessage(e) });
        }
        setBusy(false);
      }}>{busy ? 'Probando…' : 'Probar key'}</button>
      {status && <p style={status.ok ? ok : bad}>{status.ok ? '✅' : '❌'} {status.text}</p>}
    </section>
  );
}

// Paso 3: IA con foto y texto

function AiStep({ cfg, models, setModel }: { cfg: AiConfig | null; models: string[]; setModel: (m: string) => void }) {
  const [text, setText] = useState('2 huevos revueltos y una marraqueta con palta');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ items: Item[]; ms: number } | { error: string } | null>(null);

  async function run(fn: () => Promise<Item[]>) {
    setBusy(true);
    setResult(null);
    const t0 = performance.now();
    try {
      setResult({ items: await fn(), ms: performance.now() - t0 });
    } catch (e) {
      setResult({ error: aiMessage(e) });
    }
    setBusy(false);
  }

  async function photo(file: File) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const b64 = c.toDataURL('image/jpeg', 0.8).split(',')[1];
    await run(() => estimateFromPhoto(cfg!, b64));
  }

  return (
    <section style={{ ...card, opacity: cfg ? 1 : 0.5 }}>
      <h2>3. Calcular macros con IA</h2>
      {!cfg ? <p>Primero completa el paso 2.</p> : (
        <>
          <p>Saca una foto a un plato de comida, o escribe lo que comiste.</p>
          <label style={{ ...btn, display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>
            📷 Sacar foto a la comida
            <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && photo(e.target.files[0])} />
          </label>
          <textarea style={field} rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          <button style={btn} disabled={busy} onClick={() => run(() => estimateFromText(cfg, text))}>Calcular desde el texto</button>
          {busy && <p>Pensando…</p>}
          {result && ('error' in result ? <p style={bad}>❌ {result.error}</p> : <ItemsResult {...result} />)}
          <details style={{ marginTop: 12 }}>
            <summary>Probar otro modelo</summary>
            <select style={field} value={cfg.model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => <option key={m}>{m}</option>)}
            </select>
          </details>
        </>
      )}
    </section>
  );
}

// Paso 4: búsqueda por texto

function SearchStep() {
  const [q, setQ] = useState('leche colun');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <section style={card}>
      <h2>4. Buscar productos por nombre</h2>
      <input style={field} value={q} onChange={(e) => setQ(e.target.value)} />
      <button style={btn} onClick={async () => {
        setStatus(null);
        try {
          const r = await searchProducts(q);
          setStatus({ ok: r.length > 0, text: r.length ? `Encontré ${r.length}: ${r.slice(0, 3).map((f) => f.name).join(', ')}…` : 'Funciona pero no encontró nada.' });
        } catch (e) {
          setStatus({ ok: false, text: `No funciona desde el teléfono (${String(e)}).` });
        }
      }}>Buscar</button>
      {status && <p style={status.ok ? ok : bad}>{status.ok ? '✅' : '❌'} {status.text}</p>}
    </section>
  );
}

export default function LabScreen() {
  const [cfg, setCfg] = useState<AiConfig | null>(null);
  const [models, setModels] = useState<string[]>([]);
  return (
    <main style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto', background: '#f2f2f2', minHeight: '100vh', fontSize: 17 }}>
      <h1>Prueba rápida</h1>
      <p>Cuatro pasos para confirmar que todo funciona en tu iPhone antes de construir la app. Cuando termines, mándame una captura de cada paso.</p>
      <ScannerStep />
      <KeyStep onReady={(c, m) => { setCfg(c); setModels(m); }} />
      <AiStep cfg={cfg} models={models} setModel={(m) => cfg && setCfg({ ...cfg, model: m })} />
      <SearchStep />
    </main>
  );
}
