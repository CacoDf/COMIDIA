# Comidia

App personal para calcular tus metas diarias de calorías y macros y anotar lo que comes: escribiendo, con una foto, escaneando el código de barras o buscando. Funciona como app instalada en el iPhone, gratis y sin cuentas. Tus datos quedan solo en tu teléfono.

**Abrir:** https://cacodf.github.io/COMIDIA/

## Instalar en el iPhone

1. Abre el link en **Safari**.
2. Toca el botón **Compartir** y luego **Agregar a pantalla de inicio**.
3. Abre Comidia desde el ícono. Así se ve a pantalla completa y funciona sin conexión.

Cada persona la instala en su propio iPhone y tiene sus propios datos.

## Activar la IA (escribir, foto, sugerencias)

1. Entra a https://aistudio.google.com y toca **Get API key** para crear una key gratis.
2. En Comidia, ve a **Ajustes › Inteligencia artificial**, pega la key y toca **Probar**.

La key queda guardada solo en el teléfono y nunca va en el respaldo. La cuota gratis de Gemini es diaria; si dos personas usan la misma key, la comparten. Sin key, igual funcionan el escáner, la búsqueda, Mis comidas y el registro manual.

## Respaldo

Como los datos viven en el teléfono, exporta un respaldo de vez en cuando: **Ajustes › Respaldo › Exportar respaldo** y guárdalo en Archivos o iCloud. Para restaurarlo (por ejemplo, en un teléfono nuevo), usa **Importar respaldo**; reemplaza los datos actuales. La app te recuerda respaldar si pasan 30 días.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173/COMIDIA/
npm test         # pruebas (Vitest)
npm run build    # compila a dist/
```

Cada push a `main` corre las pruebas y publica en GitHub Pages (`.github/workflows/deploy.yml`).

- Alimentos genéricos: `data/generic-foods.source.csv` → `node scripts/build-generic-foods.mjs <carpeta SR Legacy CSV>` (datos públicos del USDA FoodData Central).
- Íconos: `node scripts/build-icons.mjs`.
- Diseño y plan: `docs/superpowers/specs/` y `docs/superpowers/plans/`.

Datos de productos: [Open Food Facts](https://world.openfoodfacts.org) (licencia ODbL).
