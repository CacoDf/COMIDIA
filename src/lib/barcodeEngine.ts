import { isValidGtin } from './barcode';

type Detector = { detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]> };
let detectorPromise: Promise<Detector> | null = null;

/** Lector de códigos (ZXing en WebAssembly), cargado una sola vez y desde la propia app, no desde un CDN. */
export function getDetector(): Promise<Detector> {
  detectorPromise ??= (async () => {
    const [{ BarcodeDetector, setZXingModuleOverrides }, { default: wasmUrl }] = await Promise.all([
      import('barcode-detector/ponyfill'),
      import('zxing-wasm/reader/zxing_reader.wasm?url'),
    ]);
    setZXingModuleOverrides({ locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) });
    return new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }) as Detector;
  })();
  detectorPromise.catch(() => { detectorPromise = null; });
  return detectorPromise;
}

/** Lee el código de barras de una foto. Devuelve null si no hay ninguno válido. No necesita permiso de cámara. */
export async function detectCodeInImage(file: Blob): Promise<string | null> {
  const [detector, bitmap] = await Promise.all([getDetector(), createImageBitmap(file)]);
  try {
    const found = await detector.detect(bitmap);
    return found.map((f) => f.rawValue).find((c) => isValidGtin(c)) ?? null;
  } finally {
    bitmap.close?.();
  }
}
