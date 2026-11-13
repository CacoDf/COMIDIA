// Genera src/data/genericFoods.json desde la lista curada y la tabla SR Legacy del USDA (dominio público).
// Uso: node scripts/build-generic-foods.mjs <carpeta con food_nutrient.csv de SR Legacy CSV 2018-04>
// Descarga: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NUTRIENT = { 1008: 'kcal', 1003: 'protein', 1005: 'carbs', 1004: 'fat' };

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const srDir = process.argv[2];
if (!srDir) {
  console.error('Falta la carpeta de SR Legacy. Ver comentario al inicio del script.');
  process.exit(1);
}

const [, ...source] = parseCsv(readFileSync('data/generic-foods.source.csv', 'utf8'));
const wanted = new Set(source.map((r) => r[1]));

const values = new Map();
const [header, ...nutrients] = parseCsv(readFileSync(join(srDir, 'food_nutrient.csv'), 'utf8'));
const iFdc = header.indexOf('fdc_id'), iNut = header.indexOf('nutrient_id'), iAmt = header.indexOf('amount');
for (const r of nutrients) {
  const key = NUTRIENT[r[iNut]];
  if (!key || !wanted.has(r[iFdc])) continue;
  if (!values.has(r[iFdc])) values.set(r[iFdc], {});
  values.get(r[iFdc])[key] = Number(r[iAmt]);
}

const round1 = (n) => Math.round(n * 10) / 10;
const foods = source.map(([name, fdcId, portions]) => {
  const v = values.get(fdcId) ?? {};
  for (const k of ['kcal', 'protein', 'carbs', 'fat']) {
    if (typeof v[k] !== 'number' || Number.isNaN(v[k])) throw new Error(`${name} (${fdcId}) no tiene ${k}`);
  }
  return {
    id: `gen:${fdcId}`,
    name,
    per100: { kcal: Math.round(v.kcal), protein: round1(v.protein), carbs: round1(v.carbs), fat: round1(v.fat) },
    portions: [
      { label: '100 g', grams: 100 },
      ...portions.split('|').filter(Boolean).map((p) => {
        const [label, grams] = p.split(':');
        return { label, grams: Number(grams) };
      }),
    ],
    source: 'generic',
    updatedAt: 0,
  };
});

writeFileSync('src/data/genericFoods.json', JSON.stringify(foods, null, 1) + '\n');
console.log(`${foods.length} alimentos escritos en src/data/genericFoods.json`);
