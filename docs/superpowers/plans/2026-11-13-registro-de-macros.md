# Comidia (registro de macros) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una app web instalable en iPhone para calcular metas de calorías y macros y anotar comida por texto, foto, código de barras y búsqueda, con datos locales y respaldo por exportación.

**Architecture:** Sitio estático (Vite + React + TypeScript) publicado en GitHub Pages bajo una sub-ruta. Los datos viven en IndexedDB (Dexie) en cada teléfono. El navegador llama directo a la API de Gemini y a Open Food Facts; no hay backend. La lógica (metas, macros, respaldo, clientes de API) vive en módulos puros con pruebas; las pantallas se construyen encima con el skill Impeccable.

**Tech Stack:** Vite, React, TypeScript, react-router (`HashRouter`), Dexie + dexie-react-hooks, Zod, vite-plugin-pwa, `barcode-detector` (polyfill sobre ZXing WASM), Vitest + @testing-library/react + fake-indexeddb, GitHub Actions + GitHub Pages. Instalar la última versión estable de cada uno.

**Spec:** `docs/superpowers/specs/2026-11-13-registro-de-macros-design.md`

## Global Constraints

- Interfaz e instrucciones a la IA en español de Chile. Unidades métricas. Identificadores de código en inglés.
- iPhone, Safari reciente, instalada en la pantalla de inicio. Diseñar para 375–430 px de ancho.
- Sin backend, sin cuentas, costo cero.
- La API key de Gemini nunca va en el código, en el repositorio, ni en el archivo de respaldo. Solo en IndexedDB del teléfono.
- La app se sirve bajo `/<repositorio>/`: `base` de Vite, manifiesto, service worker y rutas deben funcionar ahí. Se usa `HashRouter`.
- El nombre del repositorio fija la dirección y no se cambia después de publicar.
- Todo resultado de IA pasa por la pantalla de revisión antes de guardarse; guardar sin cambios toma un toque.
- Cada entrada del diario guarda una copia de sus valores.
- Las fotos no se guardan después de analizarlas.
- Valores nutricionales de genéricos: solo desde USDA FoodData Central, nunca escritos a mano ni generados por IA.
- Todo el trabajo de interfaz (Tareas 10–20) se hace invocando el skill `impeccable:impeccable` y siguiendo `DESIGN.md` creado en la Tarea 10.
- No copiar nombre, marca, textos ni apariencia de ninguna app existente.
- Fechas del diario: fecha local del teléfono en formato `YYYY-MM-DD`, nunca UTC.

## Review Focus

1. **Coma decimal.** El usuario escribe "72,5" en peso, gramos o macros → se acepta como 72.5. (Tarea 4)
2. **Fecha local.** Una comida anotada a las 22:30 en Chile queda en el día local, no en el día UTC siguiente. (Tarea 4)
3. **Producto incompleto en Open Food Facts.** Existe pero le falta algún valor por 100 g → se trata como no encontrado y se ofrece leer la etiqueta; nunca se guardan ceros. (Tarea 7)
4. **Respuesta inútil de Gemini.** JSON inválido, lista vacía (foto sin comida) o números negativos → mensaje claro, y el texto o foto del usuario no se pierde. (Tareas 8 y 14)
5. **Archivo de respaldo malo.** No es JSON, es de otra app o de una versión futura → se rechaza sin tocar los datos existentes. (Tarea 6)

## Estructura de archivos

```
index.html, vite.config.ts, tsconfig.json, package.json, .gitignore
.github/workflows/deploy.yml        publicar en GitHub Pages
DESIGN.md                           sistema de diseño (lo crea Impeccable, Tarea 10)
scripts/build-generic-foods.mjs     genera genericFoods.json desde USDA
data/generic-foods.source.csv       lista curada: nombre_es, fdc_id, porciones
src/
  main.tsx, App.tsx                 arranque y rutas
  domain/types.ts                   tipos compartidos
  domain/targets.ts                 cálculo de metas
  domain/macros.ts                  sumar, escalar, desde por-100 g
  domain/dates.ts                   fecha local, edad, rangos
  domain/numbers.ts                 parseDecimal
  db/db.ts                          esquema Dexie
  db/repo.ts                        lectura y escritura
  db/backup.ts                      exportar e importar
  services/openFoodFacts.ts         cliente OFF
  services/gemini.ts                cliente Gemini y errores
  services/geminiPrompts.ts         instrucciones y esquemas
  services/foodSearch.ts            búsqueda sobre las tres fuentes
  data/genericFoods.json            generado
  lib/image.ts                      reducir foto a JPEG base64
  state/DraftContext.tsx            comida en revisión
  ui/                               componentes base (Tarea 10)
  screens/                          una carpeta por pantalla
  test/setup.ts                     fake-indexeddb, jest-dom
```

---

## Fase 0 — Base y riesgos

### Task 1: Proyecto, repositorio y publicación

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `.github/workflows/deploy.yml`, `public/icons/*`

**Interfaces:**
- Produces: scripts `npm run dev`, `npm run build`, `npm test` (Vitest, entorno jsdom, `src/test/setup.ts` carga `fake-indexeddb/auto` y `@testing-library/jest-dom`); constante `REPO_NAME = 'COMIDIA'` usada en `base: '/COMIDIA/'`.

- [ ] **Step 1:** Confirmar con el dueño antes de crear nada: (a) nombre del repositorio público `COMIDIA`; (b) si el proyecto se mueve fuera de OneDrive (ver "Notas para el dueño" al final).
- [ ] **Step 2:** `git init`, crear proyecto Vite React-TS en la raíz, instalar dependencias del Tech Stack. `.gitignore` con `node_modules`, `dist`, `.env*`.
- [ ] **Step 3:** Configurar `vite.config.ts`: `base: '/COMIDIA/'`, `vite-plugin-pwa` con `registerType: 'autoUpdate'`, manifiesto (`name: 'Comidia'`, `short_name: 'Comidia'`, `lang: 'es-CL'`, `display: 'standalone'`, `start_url` y `scope` `'/COMIDIA/'`, iconos 192 y 512 y `apple-touch-icon` 180). Iconos provisorios; la Tarea 10 los reemplaza.
- [ ] **Step 4:** `App.tsx` con `HashRouter` y una ruta `/` que muestra "Comidia". Prueba `src/App.test.tsx`: renderiza y encuentra el texto "Comidia".
- [ ] **Step 5:** Run: `npm test` → PASS. Run: `npm run build` → sin errores.
- [ ] **Step 6:** `deploy.yml`: en push a `main`, `npm ci`, `npm test`, `npm run build`, publicar `dist` con `actions/upload-pages-artifact` y `actions/deploy-pages`.
- [ ] **Step 7:** Con el visto bueno del Step 1: `gh repo create COMIDIA --public --source . --push`, y activar Pages con fuente "GitHub Actions". Verificar que `https://<usuario>.github.io/COMIDIA/` muestra "Comidia".
- [ ] **Step 8:** Commit: `chore: scaffold app and GitHub Pages deploy`.

### Task 2: Laboratorio de riesgos (punto de control con el dueño)

Página desechable para probar en el iPhone real las tres dependencias del enfoque. No lleva pruebas automáticas ni diseño.

**Files:**
- Create: `src/screens/lab/LabScreen.tsx`
- Modify: `src/App.tsx` (ruta `/lab`)

- [ ] **Step 1:** Sección **Open Food Facts**: campo de código y botón que hace `fetch('https://world.openfoodfacts.org/api/v2/product/{code}?fields=code,product_name,brands,nutriments,serving_quantity')` y muestra la respuesta cruda o el error. Segundo campo que prueba la búsqueda por texto con `https://world.openfoodfacts.org/cgi/search.pl?search_terms={q}&search_simple=1&action=process&json=1&page_size=20&cc=cl&fields=...`.
- [ ] **Step 2:** Sección **Gemini**: campo para pegar la key (solo en memoria), botón que lista modelos (`GET https://generativelanguage.googleapis.com/v1beta/models`, cabecera `x-goog-api-key`), selector de modelo, y dos pruebas con `POST .../models/{model}:generateContent`: una de texto y una con foto (`<input type="file" accept="image/*" capture="environment">`). Mostrar respuesta cruda, tiempo y código HTTP. Antes de escribir estas llamadas, leer la documentación vigente de la API de Gemini y ajustar rutas y nombres de campos si cambiaron.
- [ ] **Step 3:** Sección **Escáner**: vídeo con `getUserMedia({video:{facingMode:'environment'}})` y `BarcodeDetector` del paquete `barcode-detector` con formatos `ean_13`, `ean_8`, `upc_a`, `upc_e`; mostrar el código leído.
- [ ] **Step 4:** Publicar y pedir al dueño que, en su iPhone, con la app agregada a la pantalla de inicio: escanee 10 productos de su despensa y anote cuántos encuentra Open Food Facts con datos completos; pruebe una descripción y una foto con Gemini en dos modelos; revise en AI Studio su cuota diaria por modelo.
- [ ] **Step 5: Punto de control.** Registrar los resultados en `docs/superpowers/specs/2026-11-13-registro-de-macros-design.md` (sección nueva "Resultados del laboratorio"). Si OFF no responde desde el navegador, la cobertura es menor a la mitad, la cuota no alcanza o el escáner no lee: **detenerse y volver al dueño** con opciones. Si todo pasa, fijar ahí el endpoint de búsqueda y el modelo predeterminado confirmados.
- [ ] **Step 6:** Commit: `chore: add risk lab page`.

---

## Fase 1 — Lógica y datos

### Task 3: Tipos y cálculo de metas

**Files:**
- Create: `src/domain/types.ts`, `src/domain/targets.ts`
- Test: `src/domain/targets.test.ts`

**Interfaces:**
- Produces (`types.ts`):

```ts
export type Macros = { kcal: number; protein: number; carbs: number; fat: number };
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'high' | 'veryHigh';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Profile = {
  sex: 'male' | 'female'; birthDate: string; heightCm: number;
  activity: Activity; goal: Goal; rateKgPerWeek: 0.25 | 0.5 | 0.75;
  manualTargets?: Macros;
};
export type Portion = { label: string; grams: number };
export type FoodSource = 'generic' | 'off' | 'custom' | 'label';
export type Food = { id: string; name: string; brand?: string; barcode?: string;
  per100: Macros; portions: Portion[]; source: FoodSource; updatedAt: number };
export type Item = { name: string; grams: number; macros: Macros; foodId?: string };
export type EntrySource = 'text' | 'photo' | 'barcode' | 'search' | 'saved' | 'manual' | 'suggestion';
export type LogEntry = { id: string; date: string; slot: MealSlot; name: string;
  items: Item[]; source: EntrySource; createdAt: number };
export type SavedMeal = { id: string; name: string; items: Item[]; steps?: string[]; createdAt: number };
export type WeightEntry = { id: string; date: string; kg: number };
export type Settings = { geminiKey?: string; geminiModel?: string; lastExportAt?: number };
export type Targets = Macros & { bmr: number; tdee: number; flooredAtBmr: boolean; manual: boolean };
```

- Produces (`targets.ts`): `computeTargets(profile: Profile, weightKg: number, ageYears: number): Targets`

Reglas (del spec 7.1): Mifflin-St Jeor (`10·kg + 6.25·cm − 5·edad`, `+5` hombre, `−161` mujer). Factores: 1.2 / 1.375 / 1.55 / 1.725 / 1.9. Ajuste diario `rate × 7700 / 7`, restado en `lose`, sumado en `gain`, cero en `maintain`. Piso: `kcal ≥ bmr`. Redondeo: `kcal = round(...)`; `protein = round(g/kg × kg)` con 2.0 en `lose` y 1.8 en el resto; `fat = round(max(0.25·kcal/9, 0.6·kg))`; `carbs = max(0, round((kcal − 4·protein − 9·fat)/4))`. `bmr` y `tdee` redondeados. Si hay `manualTargets`, se devuelven esos cuatro valores con `manual: true` y `bmr`/`tdee` calculados igual.

- [ ] **Step 1: Pruebas**

```ts
const base = { birthDate: '1996-01-01', rateKgPerWeek: 0.5 } as const;
test('hombre 80 kg, 180 cm, 30 años, moderado, bajar 0.5', () => {
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'lose' }, 80, 30);
  expect(t).toMatchObject({ bmr: 1780, tdee: 2759, kcal: 2209, protein: 160, fat: 61, carbs: 255, flooredAtBmr: false, manual: false });
});
test('mantener no ajusta y usa 1.8 g/kg', () => {
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'maintain' }, 80, 30);
  expect(t.kcal).toBe(2759); expect(t.protein).toBe(144);
});
test('subir suma el ajuste', () => {
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'gain' }, 80, 30);
  expect(t.kcal).toBe(3309);
});
test('piso en metabolismo basal', () => {
  const t = computeTargets({ ...base, rateKgPerWeek: 0.75, sex: 'female', heightCm: 165, activity: 'sedentary', goal: 'lose' }, 60, 30);
  expect(t.bmr).toBe(1320); expect(t.kcal).toBe(1320); expect(t.flooredAtBmr).toBe(true);
});
test('metas manuales se respetan', () => {
  const manual = { kcal: 2000, protein: 150, carbs: 200, fat: 67 };
  const t = computeTargets({ ...base, sex: 'male', heightCm: 180, activity: 'moderate', goal: 'lose', manualTargets: manual }, 80, 30);
  expect(t).toMatchObject({ ...manual, manual: true, bmr: 1780 });
});
```

- [ ] **Step 2:** Run: `npm test -- src/domain/targets.test.ts` → FAIL (no existe).
- [ ] **Step 3:** Implementar `types.ts` y `computeTargets`.
- [ ] **Step 4:** Run de nuevo → PASS.
- [ ] **Step 5:** Commit: `feat: target calculation`.

### Task 4: Macros, fechas y números

**Files:**
- Create: `src/domain/macros.ts`, `src/domain/dates.ts`, `src/domain/numbers.ts`
- Test: `src/domain/macros.test.ts`, `src/domain/dates.test.ts`, `src/domain/numbers.test.ts`

**Interfaces:**
- Produces:
  - `ZERO: Macros`; `sumMacros(list: Macros[]): Macros`; `macrosForGrams(per100: Macros, grams: number): Macros`; `rescaleItem(item: Item, newGrams: number): Item`; `roundMacros(m: Macros): Macros` (kcal entero, gramos a 1 decimal); `remaining(target: Macros, eaten: Macros): Macros` (puede ser negativo).
  - `toLocalDate(d: Date): string`; `todayLocal(): string`; `addDays(date: string, n: number): string`; `ageOn(birthDate: string, on: string): number`; `weekRange(date: string): { from: string; to: string }` (lunes a domingo).
  - `parseDecimal(text: string): number | null`

- [ ] **Step 1: Pruebas**

```ts
test('macrosForGrams escala desde 100 g', () => {
  expect(macrosForGrams({ kcal: 200, protein: 10, carbs: 20, fat: 5 }, 150))
    .toEqual({ kcal: 300, protein: 15, carbs: 30, fat: 7.5 });
});
test('rescaleItem mantiene la proporción', () => {
  const it = { name: 'arroz', grams: 100, macros: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } };
  expect(rescaleItem(it, 200).macros.kcal).toBe(260);
  expect(rescaleItem(it, 200).grams).toBe(200);
});
test('rescaleItem con 0 g originales no divide por cero', () => {
  const it = { name: 'x', grams: 0, macros: { kcal: 50, protein: 1, carbs: 1, fat: 1 } };
  expect(rescaleItem(it, 100).macros).toEqual(it.macros);
});
test('sumMacros de lista vacía es cero', () => { expect(sumMacros([])).toEqual(ZERO); });

test('toLocalDate usa la fecha local, no UTC', () => {
  // 22:30 del 13 de noviembre en hora local
  expect(toLocalDate(new Date(2026, 10, 13, 22, 30))).toBe('2026-11-13');
});
test('addDays cruza mes y año', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});
test('ageOn antes y después del cumpleaños', () => {
  expect(ageOn('1996-11-14', '2026-11-13')).toBe(29);
  expect(ageOn('1996-11-13', '2026-11-13')).toBe(30);
});
test('weekRange va de lunes a domingo', () => {
  expect(weekRange('2026-11-13')).toEqual({ from: '2026-11-09', to: '2026-11-15' });
});

test.each([['72,5', 72.5], ['72.5', 72.5], [' 80 ', 80], ['1.250,5', null], ['', null], ['abc', null], ['-3', null]])(
  'parseDecimal(%s)', (input, expected) => { expect(parseDecimal(input)).toBe(expected); });
```

Agregar en la configuración de Vitest `TZ='America/Santiago'` para que las pruebas de fecha corran en hora de Chile.

- [ ] **Step 2:** Run: `npm test -- src/domain` → FAIL.
- [ ] **Step 3:** Implementar los tres módulos. `parseDecimal` acepta un solo separador (coma o punto) y rechaza negativos.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `feat: macro math, local dates, decimal parsing`.

### Task 5: Base de datos local

**Files:**
- Create: `src/db/db.ts`, `src/db/repo.ts`
- Test: `src/db/repo.test.ts`

**Interfaces:**
- Consumes: tipos de la Tarea 3.
- Produces (`db.ts`): `db` (Dexie, nombre `comidia`), versión 1 con tablas e índices: `profile` (clave fija `'me'`), `settings` (clave fija `'me'`), `entries` (`id, date, [date+slot]`), `weights` (`id, &date`), `foods` (`id, barcode, name`), `savedMeals` (`id, name`).
- Produces (`repo.ts`), todas `async`:
  - `getProfile(): Profile | undefined`; `saveProfile(p: Profile): void`
  - `getSettings(): Settings`; `patchSettings(p: Partial<Settings>): void`
  - `listEntries(date: string): LogEntry[]`; `listEntriesInRange(from: string, to: string): LogEntry[]`
  - `addEntry(e: Omit<LogEntry, 'id' | 'createdAt'>): LogEntry`; `updateEntry(id: string, patch: Partial<Omit<LogEntry, 'id'>>): void`; `deleteEntry(id: string): void`; `copyEntry(id: string, toDate: string, toSlot: MealSlot): LogEntry`
  - `listWeights(): WeightEntry[]` (ascendente por fecha); `latestWeight(): WeightEntry | undefined`; `setWeight(date: string, kg: number): void` (reemplaza si ya hay uno ese día)
  - `getFood(id: string)`, `getFoodByBarcode(code: string): Food | undefined`; `upsertFood(f: Food): void`; `searchLocalFoods(q: string, limit: number): Food[]` (sin distinguir mayúsculas ni tildes)
  - `listSavedMeals(): SavedMeal[]`; `saveMeal(m: Omit<SavedMeal, 'id' | 'createdAt'> & { id?: string }): SavedMeal`; `deleteMeal(id: string): void`
- Ids con `crypto.randomUUID()`.

- [ ] **Step 1: Pruebas** (cada una sobre una base limpia): `addEntry` + `listEntries` devuelve solo las del día; `copyEntry` crea una entrada nueva con otro id y deja la original; `updateEntry` cambiando `slot` la mueve; `setWeight` dos veces el mismo día deja una sola fila con el último valor; `latestWeight` devuelve la fecha más reciente aunque se haya insertado antes; `searchLocalFoods('platano')` encuentra un alimento llamado "Plátano"; `getSettings()` en base vacía devuelve `{}`; `listEntriesInRange` incluye ambos extremos.
- [ ] **Step 2:** Run: `npm test -- src/db/repo.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `db.ts` y `repo.ts`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `feat: local database and repositories`.

### Task 6: Respaldo

**Files:**
- Create: `src/db/backup.ts`
- Test: `src/db/backup.test.ts`

**Interfaces:**
- Consumes: `db` de la Tarea 5.
- Produces:

```ts
export type BackupFile = { app: 'comidia'; formatVersion: 1; exportedAt: string;
  data: { profile?: Profile; settings: Omit<Settings, 'geminiKey'>;
          entries: LogEntry[]; weights: WeightEntry[]; foods: Food[]; savedMeals: SavedMeal[] } };
export type BackupSummary = { exportedAt: string; entries: number; weights: number;
  foods: number; savedMeals: number; firstDate?: string; lastDate?: string };
export class BackupError extends Error { kind: 'not-json' | 'wrong-app' | 'newer-version' | 'invalid'; }
export async function exportBackup(): Promise<BackupFile>;      // también fija settings.lastExportAt
export function parseBackup(text: string): BackupFile;          // lanza BackupError
export function summarize(b: BackupFile): BackupSummary;
export async function importBackup(b: BackupFile): Promise<void>; // reemplaza todo en una transacción; conserva geminiKey y geminiModel actuales
export function backupFileName(now: Date): string;              // 'comidia-respaldo-2026-11-13.json'
```

`foods` exporta solo los de `source` distinto de `'generic'`. `parseBackup` valida con Zod.

- [ ] **Step 1: Pruebas**

```ts
test('ida y vuelta conserva los datos', async () => { /* sembrar, exportar, limpiar, importar, comparar tablas */ });
test('el archivo no contiene la key', async () => {
  await patchSettings({ geminiKey: 'SECRETA' });
  expect(JSON.stringify(await exportBackup())).not.toContain('SECRETA');
});
test('importar conserva la key del teléfono', async () => { /* key antes == key después */ });
test.each([['no es json', 'not-json'], ['{"app":"otra","formatVersion":1}', 'wrong-app'],
  ['{"app":"comidia","formatVersion":2,"exportedAt":"x","data":{}}', 'newer-version'],
  ['{"app":"comidia","formatVersion":1,"exportedAt":"x","data":{"entries":"mal"}}', 'invalid']])(
  'parseBackup rechaza %s', (text, kind) => {
    expect(() => parseBackup(text)).toThrow(expect.objectContaining({ kind }));
  });
test('un archivo rechazado no toca los datos', async () => { /* sembrar; parseBackup lanza; tablas intactas */ });
test('summarize cuenta y da el rango de fechas', () => { /* ... */ });
```

- [ ] **Step 2:** Run: `npm test -- src/db/backup.test.ts` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `feat: backup export and import`.

### Task 7: Cliente de Open Food Facts

**Files:**
- Create: `src/services/openFoodFacts.ts`
- Test: `src/services/openFoodFacts.test.ts`

**Interfaces:**
- Produces:

```ts
export class OffError extends Error { kind: 'offline' | 'rate-limit' | 'unknown'; }
export async function fetchProduct(barcode: string): Promise<Food | null>;
export async function searchProducts(query: string): Promise<Food[]>;
export function toFood(raw: unknown): Food | null;   // exportada para pruebas
```

Reglas: usar los endpoints confirmados en la Tarea 2. `toFood` devuelve `null` si falta nombre o cualquiera de `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`; si falta kcal pero hay `energy_100g` (kJ), convertir dividiendo por 4.184. `id = 'off:' + code`, `source: 'off'`. Porciones: `{ label: '100 g', grams: 100 }` y, si `serving_quantity` es número positivo, `{ label: 'Porción', grams }`. `fetchProduct` devuelve `null` con `status: 0`. HTTP 429 → `rate-limit`; fallo de red → `offline`. `searchProducts` descarta los incompletos. No guardan en la base; eso lo hace quien llama.

- [ ] **Step 1: Pruebas** con `fetch` simulado: producto completo → `Food` con `per100` correcto y porción; producto sin `fat_100g` → `null`; solo `energy_100g: 418.4` → `kcal` 100; `status: 0` → `null`; 429 → `OffError` `rate-limit`; `fetch` rechaza con `TypeError` → `offline`; búsqueda con dos completos y uno incompleto → 2 resultados.
- [ ] **Step 2:** Run: `npm test -- src/services/openFoodFacts.test.ts` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `feat: Open Food Facts client`.

### Task 8: Cliente de Gemini

**Files:**
- Create: `src/services/gemini.ts`, `src/services/geminiPrompts.ts`
- Test: `src/services/gemini.test.ts`

**Interfaces:**
- Produces:

```ts
export type AiConfig = { key: string; model: string };
export type Suggestion = { name: string; items: Item[]; steps: string[] };
export type LabelReading = { name?: string; per100: Macros; servingGrams?: number };
export class AiError extends Error {
  kind: 'no-key' | 'bad-key' | 'quota' | 'offline' | 'invalid-response' | 'no-food' | 'unknown';
}
export async function listModels(key: string): Promise<string[]>;   // solo los que admiten generateContent
export function pickDefaultModel(models: string[]): string | undefined;
export async function testKey(key: string): Promise<void>;          // lanza AiError
export async function estimateFromText(cfg: AiConfig, text: string): Promise<Item[]>;
export async function estimateFromPhoto(cfg: AiConfig, jpegBase64: string, note?: string): Promise<Item[]>;
export async function readLabel(cfg: AiConfig, jpegBase64: string): Promise<LabelReading>;
export async function suggestMeals(cfg: AiConfig,
  req: { remaining: Macros; slot: MealSlot; note?: string }): Promise<Suggestion[]>;
```

Reglas:
- Llamadas REST con cabecera `x-goog-api-key`, salida JSON con esquema (`responseMimeType: 'application/json'` y `responseSchema`), según lo confirmado en la Tarea 2.
- Toda respuesta se valida con Zod: `grams > 0`, macros `≥ 0`, nombre no vacío. Falla → `invalid-response`. Lista de ingredientes vacía → `no-food`.
- Errores: key vacía → `no-key` sin llamar a la red; 400/401/403 → `bad-key`; 429 → `quota`; fallo de red → `offline`; resto → `unknown`.
- `pickDefaultModel`: el de mayor versión numérica cuyo nombre contenga `flash-lite`; si no hay, el de mayor versión que contenga `flash`; si no, el primero. Excluir nombres que contengan `preview`, `exp`, `tts`, `image` o `live` salvo que no quede otro.
- `suggestMeals` devuelve exactamente 3 sugerencias; menos de 1 → `invalid-response`.
- `geminiPrompts.ts`: instrucciones en español de Chile. Deben pedir: porciones chilenas habituales cuando el usuario no da cantidad (marraqueta ≈ 100 g, taza ≈ 200 ml), un ingrediente por línea, gramos del alimento como se come (cocido si es cocido), estimar en vez de negarse, y lista vacía si no hay comida. Para etiquetas: valores por 100 g; si la tabla solo trae por porción, convertir usando los gramos de la porción.

- [ ] **Step 1: Pruebas** con `fetch` simulado: respuesta válida → `Item[]`; texto que no es JSON → `invalid-response`; ítem con `grams: -5` → `invalid-response`; `items: []` → `no-food`; 429 → `quota`; 403 → `bad-key`; key vacía → `no-key` y `fetch` no se llamó; `TypeError` → `offline`; la foto viaja como `inline_data` con `mime_type: 'image/jpeg'`; `suggestMeals` incluye los macros restantes en el cuerpo enviado.

```ts
test('pickDefaultModel prefiere el flash-lite más nuevo', () => {
  expect(pickDefaultModel(['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite',
    'gemini-3.9-flash-lite-preview'])).toBe('gemini-3.5-flash-lite');
  expect(pickDefaultModel(['gemini-3.6-flash', 'gemini-3.8-flash'])).toBe('gemini-3.8-flash');
  expect(pickDefaultModel([])).toBeUndefined();
});
```

- [ ] **Step 2:** Run: `npm test -- src/services/gemini.test.ts` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit: `feat: Gemini client with validated structured output`.

### Task 9: Alimentos genéricos y búsqueda

**Files:**
- Create: `data/generic-foods.source.csv`, `scripts/build-generic-foods.mjs`, `src/data/genericFoods.json` (generado), `src/services/foodSearch.ts`
- Test: `src/data/genericFoods.test.ts`, `src/services/foodSearch.test.ts`

**Interfaces:**
- Consumes: `searchLocalFoods`, `upsertFood` (Tarea 5); `searchProducts` (Tarea 7).
- Produces:
  - `genericFoods.json`: `Food[]` con `id: 'gen:<fdc_id>'`, `source: 'generic'`.
  - `searchLocal(query: string): Promise<Food[]>` — propios y usados primero, luego genéricos; sin tildes ni mayúsculas; coincide por palabras en cualquier orden; máximo 30.
  - `searchOnline(query: string): Promise<Food[]>` — Open Food Facts; excluye los que ya están en local.

- [ ] **Step 1:** Escribir `generic-foods.source.csv` con columnas `nombre_es,fdc_id,porciones` (porciones como `etiqueta:gramos` separadas por `|`). Unos 300 alimentos comunes en Chile: frutas, verduras, carnes y pescados (crudos y cocidos), huevos, lácteos, cereales, arroz y fideos cocidos, legumbres cocidas, pan (marraqueta, hallulla, molde), frutos secos, aceites, azúcar, bebidas básicas. Cada `fdc_id` se elige buscando el alimento en FoodData Central (conjuntos Foundation o SR Legacy).
- [ ] **Step 2:** `build-generic-foods.mjs`: lee el CSV, obtiene de la API de FoodData Central energía (kcal), proteína, carbohidratos y grasa por 100 g para cada `fdc_id`, y escribe el JSON. Falla con error si a algún alimento le falta un valor. La key de USDA se lee de la variable de entorno `FDC_API_KEY` (gratuita; `DEMO_KEY` sirve con límites).
- [ ] **Step 3: Pruebas del JSON**: al menos 250 entradas; ids únicos; todo `per100` con `0 < kcal ≤ 900` y `protein + carbs + fat ≤ 100`; toda entrada tiene al menos la porción `100 g`; existen "Arroz blanco cocido", "Huevo", "Palta", "Marraqueta", "Pechuga de pollo cocida".
- [ ] **Step 4: Pruebas de búsqueda**: `searchLocal('platano')` encuentra "Plátano"; `searchLocal('pollo pechuga')` encuentra "Pechuga de pollo cocida"; un alimento propio aparece antes que un genérico con el mismo nombre; `searchOnline` no repite un producto ya guardado localmente.
- [ ] **Step 5:** Run: `node scripts/build-generic-foods.mjs` y `npm test -- src/data src/services/foodSearch.test.ts` → PASS.
- [ ] **Step 6:** Commit: `feat: generic foods table and food search`.

---

## Fase 2 — Pantallas (con Impeccable)

Convenciones para todas las tareas de esta fase:
- Invocar `impeccable:impeccable` y seguir `DESIGN.md`.
- Lecturas reactivas con `useLiveQuery` sobre las funciones de `repo.ts`.
- Las pruebas de pantalla usan Testing Library sobre fake-indexeddb, con los servicios de red simulados.
- Campos numéricos: `inputMode="decimal"` y `parseDecimal`.
- Rutas en español. `:slot` usa los valores de `MealSlot`.

### Task 10: Dirección de diseño, componentes base y navegación

**Files:**
- Create: `DESIGN.md`, `src/ui/*` (tokens, `Button`, `Field`, `NumberField`, `Sheet`, `ListRow`, `ProgressBar`, `EmptyState`, `Toast`, `TabBar`), `src/ui/labels.ts`
- Modify: `src/App.tsx`, `index.html`, `public/icons/*`

**Interfaces:**
- Produces: componentes de `src/ui`; `labels.ts` con `SLOT_LABEL: Record<MealSlot, string>` (`Desayuno`, `Almuerzo`, `Cena`, `Colaciones`), `ACTIVITY_LABEL`, `GOAL_LABEL` (`Bajar`, `Mantener`, `Subir`); rutas: `/` (Hoy), `/bienvenida`, `/agregar/:slot`, `/agregar/:slot/texto`, `/agregar/:slot/foto`, `/agregar/:slot/codigo`, `/agregar/:slot/buscar`, `/agregar/:slot/mis-comidas`, `/revision`, `/comidas`, `/sugerencias`, `/progreso`, `/ajustes`. Barra inferior con Hoy, Comidas, Progreso, Ajustes. La fecha activa viaja en el parámetro `?d=YYYY-MM-DD`.

- [ ] **Step 1:** Invocar Impeccable para definir la dirección visual con el dueño (él aprueba el aspecto), dejando el resultado en `DESIGN.md`. Entregarle el boceto de "Hoy" del spec 7.8 como contenido y jerarquía. Requisitos: modo claro y oscuro, áreas táctiles de al menos 44 px, respeto de `safe-area-inset`, identidad propia.
- [ ] **Step 2:** Implementar tokens y componentes base, con una prueba de render por componente.
- [ ] **Step 3:** Rutas con pantallas vacías y `TabBar`. Si no hay perfil, `/` redirige a `/bienvenida`. Prueba: sin perfil redirige; con perfil muestra Hoy.
- [ ] **Step 4:** Iconos e imagen de inicio definitivos.
- [ ] **Step 5:** Run: `npm test` → PASS. Commit: `feat: design system, base components and navigation`.

### Task 11: Bienvenida y metas

**Files:**
- Create: `src/screens/welcome/WelcomeScreen.tsx`, `src/screens/settings/ProfileForm.tsx`, `src/screens/settings/TargetsCard.tsx`, `src/state/useTargets.ts`
- Test: `src/screens/welcome/WelcomeScreen.test.tsx`, `src/state/useTargets.test.tsx`

**Interfaces:**
- Consumes: `computeTargets`, `ageOn`, `todayLocal`, `saveProfile`, `setWeight`, `latestWeight`.
- Produces: `useTargets(): Targets | undefined` (perfil + último peso + edad de hoy); `<ProfileForm>` y `<TargetsCard>` reutilizados en Ajustes.

- [ ] **Step 1: Pruebas**: completar el formulario (hombre, 1996-01-01, 180 cm, "80,0" kg, moderado, bajar, 0.5) muestra `2.209 kcal`, `160 g`, `255 g`, `61 g` y al confirmar guarda perfil y peso de hoy; con un ritmo que cae bajo el basal se ve el aviso del piso; activar ajuste manual y escribir valores hace que `useTargets` devuelva `manual: true`; "Volver al cálculo automático" borra `manualTargets`; no se puede avanzar con altura o peso vacíos.
- [ ] **Step 2:** Run → FAIL. Implementar. El paso de la key de Gemini en la bienvenida es omitible y reutiliza el componente de la Tarea 19 cuando exista; por ahora, solo un texto que indique que se configura en Ajustes.
- [ ] **Step 3:** Run → PASS. Commit: `feat: onboarding and targets`.

### Task 12: Pantalla Hoy

**Files:**
- Create: `src/screens/today/TodayScreen.tsx`, `src/screens/today/EntrySheet.tsx`, `src/screens/today/DaySummary.tsx`
- Test: `src/screens/today/TodayScreen.test.tsx`

**Interfaces:**
- Consumes: `useTargets`, `listEntries`, `updateEntry`, `deleteEntry`, `copyEntry`, `sumMacros`, `remaining`, `addDays`.

- [ ] **Step 1: Pruebas**: muestra consumido, meta y "quedan" para calorías y los tres macros; al pasarse de la meta muestra el exceso en vez de un negativo; agrupa por las cuatro comidas con subtotal; flechas cambian de día y `?d=` se actualiza; no se puede avanzar más allá de hoy; tocar una entrada abre `EntrySheet` con editar ingredientes, mover a otra comida, copiar a otro día y borrar, y cada acción se refleja en la lista; "Agregar" en una comida navega a `/agregar/:slot?d=`.
- [ ] **Step 2:** Run → FAIL. Implementar. Borrar muestra un aviso con "Deshacer" durante unos segundos.
- [ ] **Step 3:** Run → PASS. Commit: `feat: today screen`.

### Task 13: Agregar por búsqueda y manual

**Files:**
- Create: `src/screens/add/AddMenuScreen.tsx`, `src/screens/add/SearchScreen.tsx`, `src/screens/add/QuantitySheet.tsx`, `src/screens/add/ManualFoodForm.tsx`
- Test: `src/screens/add/SearchScreen.test.tsx`, `src/screens/add/QuantitySheet.test.tsx`

**Interfaces:**
- Consumes: `searchLocal`, `searchOnline`, `upsertFood`, `addEntry`, `macrosForGrams`.
- Produces: `<QuantitySheet food onConfirm(item: Item)>` — elige porción o gramos y muestra los macros resultantes; reutilizado por el escáner.

- [ ] **Step 1: Pruebas**: `AddMenuScreen` ofrece Escribir, Foto, Código, Buscar y Mis comidas, y sin key de Gemini deshabilita Escribir y Foto con una explicación; escribir en la búsqueda muestra resultados locales al instante; la búsqueda en línea solo se dispara con el botón "Buscar en productos"; elegir un producto en línea lo guarda con `upsertFood`; `QuantitySheet` con "1,5" porciones de 30 g calcula 45 g; confirmar crea una entrada con `source: 'search'` y vuelve a Hoy; error `rate-limit` y `offline` muestran su mensaje sin perder lo escrito; "Crear alimento" guarda un `Food` con `source: 'custom'`.
- [ ] **Step 2:** Run → FAIL. Implementar.
- [ ] **Step 3:** Run → PASS. Commit: `feat: add food by search and manual entry`.

### Task 14: Revisión y registro por texto

**Files:**
- Create: `src/state/DraftContext.tsx`, `src/screens/review/ReviewScreen.tsx`, `src/screens/add/TextScreen.tsx`, `src/state/useAi.ts`, `src/ui/aiErrorMessage.ts`
- Test: `src/screens/review/ReviewScreen.test.tsx`, `src/screens/add/TextScreen.test.tsx`

**Interfaces:**
- Consumes: `estimateFromText`, `AiError`, `rescaleItem`, `addEntry`, `saveMeal`.
- Produces:
  - `type Draft = { date: string; slot: MealSlot; name: string; items: Item[]; source: EntrySource; steps?: string[] }`; `useDraft(): { draft?: Draft; setDraft(d: Draft): void; clear(): void }`.
  - `useAi(): { config?: AiConfig; ready: boolean }` desde `getSettings()`.
  - `aiErrorMessage(kind: AiError['kind']): string` con un texto en español por cada tipo.

- [ ] **Step 1: Pruebas de `ReviewScreen`**: lista cada ingrediente con gramos y macros y el total; "Guardar" sin tocar nada crea la entrada y vuelve a Hoy (un toque); cambiar gramos de 100 a "150" escala los macros de esa línea y el total; editar un macro a mano se respeta; borrar una línea la quita; con cero líneas "Guardar" queda deshabilitado; "Guardar también en Mis comidas" crea un `SavedMeal`; se puede cambiar el nombre y la comida de destino; sin borrador redirige a Hoy.
- [ ] **Step 2: Pruebas de `TextScreen`**: enviar llama a `estimateFromText` y navega a `/revision` con el borrador (`source: 'text'`, nombre = primeras palabras del texto); durante la espera el botón queda deshabilitado con indicador; ante `quota`, `offline`, `invalid-response` o `no-food` muestra el mensaje correspondiente y **el texto sigue en el campo**; volver desde revisión conserva el texto.
- [ ] **Step 3:** Run → FAIL. Implementar.
- [ ] **Step 4:** Run → PASS. Commit: `feat: review screen and text logging`.

### Task 15: Registro por foto

**Files:**
- Create: `src/lib/image.ts`, `src/screens/add/PhotoScreen.tsx`
- Test: `src/lib/image.test.ts`, `src/screens/add/PhotoScreen.test.tsx`

**Interfaces:**
- Consumes: `estimateFromPhoto`, `useDraft`, `useAi`, `aiErrorMessage`.
- Produces: `fitWithin(w: number, h: number, maxSide: number): { w: number; h: number }`; `downscaleToJpegBase64(file: Blob, maxSide = 1024, quality = 0.8): Promise<string>` (sin el prefijo `data:`).

- [ ] **Step 1: Pruebas**: `fitWithin(4032, 3024, 1024)` → `{ w: 1024, h: 768 }`; `fitWithin(800, 600, 1024)` no agranda; la pantalla ofrece cámara y galería (`<input type="file" accept="image/*">` con y sin `capture`); al elegir imagen muestra vista previa y campo de nota opcional; enviar llama a `estimateFromPhoto` con la nota y navega a `/revision` con `source: 'photo'`; ante error se conservan la foto y la nota; la imagen no se escribe en la base.
- [ ] **Step 2:** Run → FAIL. Implementar. `downscaleToJpegBase64` con `createImageBitmap` y canvas; se verifica a mano en el iPhone.
- [ ] **Step 3:** Run → PASS. Commit: `feat: photo logging`.

### Task 16: Código de barras y lectura de etiqueta

**Files:**
- Create: `src/ui/BarcodeScanner.tsx`, `src/screens/add/BarcodeScreen.tsx`, `src/screens/add/LabelScreen.tsx`
- Test: `src/screens/add/BarcodeScreen.test.tsx`, `src/screens/add/LabelScreen.test.tsx`

**Interfaces:**
- Consumes: `getFoodByBarcode`, `fetchProduct`, `upsertFood`, `QuantitySheet`, `readLabel`, `downscaleToJpegBase64`.
- Produces: `<BarcodeScanner onDetected(code: string) onUnavailable(reason: 'denied' | 'unsupported')>`. Libera la cámara al desmontarse.

- [ ] **Step 1: Pruebas de `BarcodeScreen`** (con `BarcodeScanner` simulado): código ya guardado localmente → abre `QuantitySheet` sin llamar a la red; código nuevo → `fetchProduct`, guarda con `upsertFood`, abre `QuantitySheet`; confirmar crea entrada con `source: 'barcode'`; `fetchProduct` devuelve `null` → muestra "No encontramos este producto" con las opciones "Fotografiar la tabla nutricional" e "Ingresar a mano"; cámara denegada → muestra campo para escribir el código; sin conexión y código desconocido → mensaje propio; el mismo código detectado varias veces seguidas se procesa una sola vez.
- [ ] **Step 2: Pruebas de `LabelScreen`**: tras la foto llama a `readLabel` y muestra un formulario con nombre, los cuatro valores por 100 g y gramos por porción, todos editables; confirmar guarda un `Food` con `source: 'label'` y el código de barras, y abre `QuantitySheet`; escanear ese código después lo encuentra localmente; sin key de Gemini la opción de fotografiar la etiqueta no aparece y queda "Ingresar a mano".
- [ ] **Step 3:** Run → FAIL. Implementar.
- [ ] **Step 4:** Run → PASS. Commit: `feat: barcode scanning and label reading`.

### Task 17: Mis comidas y sugerencias

**Files:**
- Create: `src/screens/meals/MealsScreen.tsx`, `src/screens/meals/MealEditor.tsx`, `src/screens/add/SavedMealsPicker.tsx`, `src/screens/meals/SuggestScreen.tsx`
- Test: `src/screens/meals/MealsScreen.test.tsx`, `src/screens/meals/SuggestScreen.test.tsx`

**Interfaces:**
- Consumes: `listSavedMeals`, `saveMeal`, `deleteMeal`, `addEntry`, `suggestMeals`, `useTargets`, `listEntries`, `remaining`, `useDraft`.

- [ ] **Step 1: Pruebas de comidas guardadas**: en `SavedMealsPicker`, tocar una comida y confirmar crea la entrada con `source: 'saved'` (un toque más confirmar); el selector de porción "0,5" escala todos los ingredientes; desde `EntrySheet` de Hoy, "Guardar como comida" la agrega a la lista; `MealEditor` permite crear desde cero agregando ingredientes por búsqueda, renombrar y borrar; una comida con pasos los muestra.
- [ ] **Step 2: Pruebas de sugerencias**: la pantalla muestra los macros restantes de hoy y permite elegir comida y escribir una nota; pedir llama a `suggestMeals` con esos restantes; se ven 3 tarjetas con nombre, macros, ingredientes y pasos; "Anotar" lleva a `/revision` con `source: 'suggestion'`; "Guardar" crea un `SavedMeal` con sus pasos; errores de IA con su mensaje; sin key, la pantalla explica cómo configurarla.
- [ ] **Step 3:** Run → FAIL. Implementar.
- [ ] **Step 4:** Run → PASS. Commit: `feat: saved meals and AI suggestions`.

### Task 18: Progreso y peso

**Files:**
- Create: `src/screens/progress/ProgressScreen.tsx`, `src/screens/progress/WeightChart.tsx`, `src/screens/progress/WeeklySummary.tsx`, `src/domain/weekly.ts`
- Test: `src/domain/weekly.test.ts`, `src/screens/progress/ProgressScreen.test.tsx`

**Interfaces:**
- Consumes: `listWeights`, `setWeight`, `listEntriesInRange`, `weekRange`, `useTargets`, `computeTargets`.
- Produces: `weeklyAverage(entries: LogEntry[]): { daysLogged: number; average: Macros }` — promedia solo los días con al menos una entrada.

- [ ] **Step 1: Pruebas**: `weeklyAverage` con 3 días anotados de 7 divide por 3; sin entradas devuelve `daysLogged: 0` y ceros; registrar "79,2" kg guarda el peso de hoy; tras registrar, si las metas automáticas cambiaron, se muestra "Tus metas cambiaron" con el valor anterior y el nuevo de calorías; con metas manuales no aparece ese aviso; el gráfico se dibuja con un solo punto y con ninguno muestra el estado vacío; el resumen semanal muestra promedio contra meta y permite ir a semanas anteriores.
- [ ] **Step 2:** Run → FAIL. Implementar. Gráfico en SVG propio, sin librería.
- [ ] **Step 3:** Run → PASS. Commit: `feat: weight tracking and weekly summary`.

### Task 19: Ajustes — IA, respaldo y almacenamiento

**Files:**
- Create: `src/screens/settings/SettingsScreen.tsx`, `src/screens/settings/AiSettings.tsx`, `src/screens/settings/BackupSettings.tsx`, `src/screens/today/BackupReminder.tsx`, `src/lib/share.ts`
- Modify: `src/screens/welcome/WelcomeScreen.tsx` (paso opcional de key), `src/screens/today/TodayScreen.tsx` (recordatorio), `src/main.tsx` (`navigator.storage.persist()`)
- Test: `src/screens/settings/AiSettings.test.tsx`, `src/screens/settings/BackupSettings.test.tsx`, `src/screens/today/BackupReminder.test.tsx`

**Interfaces:**
- Consumes: `testKey`, `listModels`, `pickDefaultModel`, `patchSettings`, `exportBackup`, `parseBackup`, `summarize`, `importBackup`, `backupFileName`, `BackupError`, `ProfileForm`, `TargetsCard`.
- Produces: `shareOrDownload(file: File): Promise<'shared' | 'downloaded' | 'cancelled'>` — usa `navigator.share({ files })` si `navigator.canShare` lo admite; si no, descarga por enlace.

- [ ] **Step 1: Pruebas de IA**: pegar la key y tocar "Probar" llama a `testKey`; si pasa, guarda la key, carga los modelos y preselecciona `pickDefaultModel`; `bad-key` muestra su mensaje y no guarda; el campo de la key es de tipo contraseña y, una vez guardada, se muestra enmascarada con opción de borrarla; cambiar el modelo lo guarda; hay un texto que explica que la cuota es diaria y se comparte si dos personas usan la misma key.
- [ ] **Step 2: Pruebas de respaldo**: "Exportar" genera un archivo con el nombre de `backupFileName` y llama a `shareOrDownload`; tras exportar se muestra la fecha del último respaldo; elegir un archivo válido muestra el resumen (cantidades y rango de fechas) y pide confirmación con el texto "Esto reemplaza todos tus datos actuales"; confirmar importa; cancelar no cambia nada; cada tipo de `BackupError` muestra su mensaje y los datos quedan intactos.
- [ ] **Step 3: Pruebas del recordatorio**: aparece en Hoy si `lastExportAt` tiene más de 30 días, o si nunca se exportó y la primera entrada tiene más de 30 días; no aparece en una app recién instalada; se puede descartar y vuelve a aparecer a los 7 días.
- [ ] **Step 4:** Run → FAIL. Implementar. `SettingsScreen` reúne perfil, metas, IA y respaldo.
- [ ] **Step 5:** Run → PASS. Commit: `feat: settings for AI, backup and storage persistence`.

### Task 20: Sin conexión, pulido y verificación en iPhone

**Files:**
- Modify: `vite.config.ts` (precache), `src/App.tsx` (quitar `/lab`), pantallas según hallazgos
- Delete: `src/screens/lab/LabScreen.tsx`
- Create: `docs/verificacion-iphone.md`, `README.md`

- [ ] **Step 1:** Precache del shell, `genericFoods.json` y el WASM del escáner. Aviso discreto cuando no hay conexión. Verificar con `npm run build && npm run preview` y la red desactivada: abre, muestra Hoy, busca genéricos, anota una comida guardada.
- [ ] **Step 2:** Eliminar el laboratorio. Buscar en el repositorio que no quede ninguna key ni dato personal: `git grep -n "AIza"` → sin resultados.
- [ ] **Step 3:** Pasada de `impeccable:impeccable` (auditoría y pulido) sobre todas las pantallas: estados vacíos, de carga y de error, modo oscuro, textos, accesibilidad, tamaños táctiles.
- [ ] **Step 4:** `README.md`: qué es, cómo instalarla en el iPhone, cómo obtener y pegar la key, cómo respaldar, cómo correrla en desarrollo. `docs/verificacion-iphone.md` con la lista de abajo.
- [ ] **Step 5:** Run: `npm test` y `npm run build` → PASS. Publicar.
- [ ] **Step 6: Verificación manual con el dueño en su iPhone** (y luego en el de su polola):
  - Agregar a pantalla de inicio; abre a pantalla completa con su icono.
  - Bienvenida completa y metas razonables.
  - Anotar por texto, por foto, por código (producto encontrado y no encontrado con lectura de etiqueta) y por búsqueda.
  - Guardar una comida y volver a anotarla; pedir sugerencias.
  - Registrar peso y ver el gráfico.
  - Exportar a Archivos; borrar la app; reinstalar; importar; todo vuelve.
  - Modo avión: abre y permite anotar una comida guardada.
  - Cerrar y abrir la app al día siguiente: los datos siguen ahí.
- [ ] **Step 7:** Commit: `feat: offline support, polish and release checklist`.

---

## Notas para el dueño

1. **OneDrive.** La carpeta actual está dentro de OneDrive. Un proyecto de este tipo crea decenas de miles de archivos en `node_modules` y una carpeta `.git` que OneDrive intentará sincronizar, lo que lo vuelve lento y puede corromper el repositorio. Recomendación: mover el proyecto a una carpeta fuera de OneDrive (por ejemplo `C:\dev\comidia`); el respaldo del código pasa a ser GitHub.
2. **Repositorio público.** El código será visible para cualquiera. No contiene la key ni datos personales.
3. **Tu participación.** Tres momentos: probar el laboratorio en el iPhone (Tarea 2), aprobar la dirección visual (Tarea 10) y la verificación final (Tarea 20).
