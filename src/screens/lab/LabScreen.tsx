// Página desechable para probar en el iPhone las tres dependencias del enfoque.
// Se elimina en la Tarea 20.
import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';

const OFF = 'https://world.openfoodfacts.org';
const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_quantity';
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';

const box: React.CSSProperties = { border: '1px solid #ccc', padding: 12, margin: '12px 0', borderRadius: 8 };
const pre: React.CSSProperties = { whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11, maxHeight: 300, overflow: 'auto', background: '#f4f4f4', padding: 8 };
const input: React.CSSProperties = { fontSize: 16, padding: 6, width: '100%', boxSizing: 'border-box', margin: '4px 0' };

async function timed(fn: () => Promise<Response>): Promise<string> {
  const t0 = performance.now();
  try {
    const r = await fn();
    const text = await r.text();
    return `HTTP ${r.status} · ${Math.round(performance.now() - t0)} ms\n${text.slice(0, 4000)}`;
  } catch (e) {
    return `ERROR · ${Math.round(performance.now() - t0)} ms\n${String(e)}`;
  }
}

function OffLab() {
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [out, setOut] = useState('');
  return (
    <section style={box}>
      <h2>1. Open Food Facts</h2>
      <input style={input} inputMode="numeric" placeholder="Código de barras" value={code} onChange={(e) => setCode(e.target.value)} />
      <button onClick={async () => setOut(await timed(() => fetch(`${OFF}/api/v2/product/${code}?fields=${OFF_FIELDS}`)))}>Buscar código</button>
      <input style={input} placeholder="Buscar por texto" value={q} onChange={(e) => setQ(e.target.value)} />
      <button onClick={async () => setOut(await timed(() => fetch(`${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&cc=cl&fields=${OFF_FIELDS}`)))}>Buscar texto (cgi)</button>{' '}
      <button onClick={async () => setOut(await timed(() => fetch(`${OFF}/api/v2/search?search_terms=${encodeURIComponent(q)}&countries_tags_en=chile&page_size=20&fields=${OFF_FIELDS}`)))}>Buscar texto (v2)</button>{' '}
      <button onClick={async () => setOut(await timed(() => fetch(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=20&fields=${OFF_FIELDS}`)))}>Buscar texto (search)</button>
      <pre style={pre}>{out}</pre>
    </section>
  );
}

const ITEMS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' }, grams: { type: 'number' }, kcal: { type: 'number' },
          protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' },
        },
        required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
      },
    },
  },
  required: ['items'],
};
const PROMPT = 'Eres nutricionista en Chile. Estima los ingredientes de esta comida con gramos y calorías, proteína, carbohidratos y grasa de cada uno. Si no hay cantidad usa porciones chilenas habituales.';

function GeminiLab() {
  const [key, setKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [schemaField, setSchemaField] = useState<'responseJsonSchema' | 'responseSchema'>('responseJsonSchema');
  const [text, setText] = useState('2 huevos revueltos y una marraqueta con palta');
  const [out, setOut] = useState('');

  async function listModels() {
    const r = await fetch(`${GEMINI}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
    const j = await r.json();
    const names: string[] = (j.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: { name: string }) => m.name.replace('models/', ''));
    setModels(names);
    setModel(names.find((n) => n.includes('flash-lite')) ?? names[0] ?? '');
    setOut(`HTTP ${r.status}\n${names.join('\n') || JSON.stringify(j).slice(0, 2000)}`);
  }

  function call(parts: unknown[]) {
    return timed(() => fetch(`${GEMINI}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', [schemaField]: ITEMS_SCHEMA },
      }),
    }));
  }

  async function photo(file: File) {
    setOut('Enviando foto…');
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const b64 = c.toDataURL('image/jpeg', 0.8).split(',')[1];
    setOut(await call([{ text: PROMPT }, { inlineData: { mimeType: 'image/jpeg', data: b64 } }]));
  }

  return (
    <section style={box}>
      <h2>2. Gemini</h2>
      <input style={input} type="password" placeholder="API key (solo en memoria)" value={key} onChange={(e) => setKey(e.target.value)} />
      <button onClick={listModels}>Listar modelos</button>
      <select style={input} value={model} onChange={(e) => setModel(e.target.value)}>
        {models.map((m) => <option key={m}>{m}</option>)}
      </select>
      <select style={input} value={schemaField} onChange={(e) => setSchemaField(e.target.value as typeof schemaField)}>
        <option>responseJsonSchema</option><option>responseSchema</option>
      </select>
      <textarea style={input} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={async () => { setOut('Enviando…'); setOut(await call([{ text: `${PROMPT}\n\nComida: ${text}` }])); }}>Probar texto</button>
      <p>Foto: <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && photo(e.target.files[0])} /></p>
      <pre style={pre}>{out}</pre>
    </section>
  );
}

function ScannerLab() {
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [log, setLog] = useState<string[]>([]);

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
          if (found[0]) setLog((l) => [`${new Date().toLocaleTimeString()} ${found[0].format} ${found[0].rawValue}`, ...l].slice(0, 10));
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch (e) {
        setLog((l) => [`ERROR ${String(e)}`, ...l]);
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [on]);

  return (
    <section style={box}>
      <h2>3. Escáner</h2>
      <button onClick={() => setOn((o) => !o)}>{on ? 'Detener cámara' : 'Iniciar cámara'}</button>
      <video ref={video} playsInline muted style={{ width: '100%', display: on ? 'block' : 'none', marginTop: 8 }} />
      <pre style={pre}>{log.join('\n')}</pre>
    </section>
  );
}

export default function LabScreen() {
  return (
    <main style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto' }}>
      <h1>Laboratorio</h1>
      <p>Modo: {window.matchMedia('(display-mode: standalone)').matches ? 'instalada' : 'navegador'}</p>
      <OffLab />
      <GeminiLab />
      <ScannerLab />
    </main>
  );
}
