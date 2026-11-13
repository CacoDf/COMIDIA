/** Dimensiones que caben dentro de maxSide manteniendo la proporción; nunca agranda. */
export function fitWithin(w: number, h: number, maxSide: number): { w: number; h: number } {
  const s = Math.min(1, maxSide / Math.max(w, h));
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

/** Reduce una foto y la devuelve como JPEG en base64 (sin el prefijo data:). La foto no se guarda en ninguna parte. */
export async function downscaleToJpegBase64(file: Blob, maxSide = 1024, quality = 0.8): Promise<string> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { w, h } = fitWithin(bmp.width, bmp.height, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}
