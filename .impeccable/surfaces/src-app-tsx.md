---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/screens"]
---

# Surface brief: Comidia app shell and screens

Scope: every screen of the PWA (Hoy, Agregar, Revisión, Comidas, Progreso, Ajustes, Bienvenida). Visitor mode: Operate.

Audience and task: owner and partner on iPhone, logging a meal in seconds right when eating, or checking what is left before eating. Constraints: Safari standalone PWA, Spanish (Chile), cercano voice, four macros equal weight.

## Direction contract

THESIS: Comidia is an iPhone app that happens to be built for the web; a fluent iOS user should never pause at a control. It refuses the category default of progress rings, gradient cards and gamified color.

OWN-WORLD: iOS semantic palette (grouped background, secondary grouped surfaces, label/secondaryLabel, hairline separators) in light and true-black dark. One tint: teal, for interactive elements only. Four data colors, used only to encode macros: kcal orange, protein pink, carbs indigo, fat yellow. System font (SF via -apple-system) with Dynamic Type through -apple-system-body; tabular numerals everywhere a number appears. Grouped inset lists, translucent tab bar and nav bar using system-like material blur, bottom sheets with grabber, filled/tinted/plain buttons, segmented controls. Icons from one stroke library tuned to SF Symbol weight.

STORY: Open the app → see today's four numbers (eaten / target / left) at equal weight → tap Agregar under a meal → pick Escribir, Foto, Código, Buscar or Mis comidas → review the breakdown → one tap Guardar → back to Hoy with numbers updated.

FIRST VIEWPORT (Hoy): large title "Hoy" with the date and previous/next chevrons in the nav bar; directly beneath, an inset group of four equal macro columns (value, "de" target, thin bar in the macro color, "quedan" line); then one inset group per meal (Desayuno, Almuerzo, Cena, Colaciones) with entries and a tinted "Agregar" row; tab bar at the bottom: Hoy, Comidas, Progreso, Ajustes. Primary action is the Agregar row of each meal, within thumb reach.

FORM: the category standard (canon), executed as native iOS at Apple first-party craft; chosen by the owner over the roll; seed key 1b670626.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- App icon artwork (provisional solid icon in place).
