---
name: Comidia
description: Personal calorie and macro diary for iPhone, built as a PWA that behaves like a first-party iOS app.
colors:
  tint: "#0e7c93"
  tint-dark: "#40c8e0"
  tint-soft: "rgba(14, 124, 147, 0.13)"
  tint-soft-dark: "rgba(64, 200, 224, 0.18)"
  on-tint: "#ffffff"
  on-tint-dark: "#001f26"
  danger: "#d70015"
  danger-dark: "#ff6961"
  kcal: "#ff9500"
  kcal-dark: "#ff9f0a"
  protein: "#ff2d55"
  protein-dark: "#ff375f"
  carbs: "#5856d6"
  carbs-dark: "#5e5ce6"
  fat: "#ffcc00"
  fat-dark: "#ffd60a"
  switch-on: "#34c759"
  grouped-bg: "#f2f2f7"
  grouped-bg-dark: "#000000"
  surface: "#ffffff"
  surface-dark: "#1c1c1e"
  surface-raised: "#ffffff"
  surface-raised-dark: "#2c2c2e"
  segment-selected: "#ffffff"
  segment-selected-dark: "#636366"
  fill: "rgba(120, 120, 128, 0.2)"
  fill-dark: "rgba(120, 120, 128, 0.36)"
  fill-2: "rgba(118, 118, 128, 0.12)"
  fill-2-dark: "rgba(118, 118, 128, 0.24)"
  material: "rgba(249, 249, 249, 0.82)"
  material-dark: "rgba(22, 22, 23, 0.8)"
  label: "#000000"
  label-dark: "#ffffff"
  label-2: "rgba(60, 60, 67, 0.62)"
  label-2-dark: "rgba(235, 235, 245, 0.62)"
  label-3: "rgba(60, 60, 67, 0.32)"
  label-3-dark: "rgba(235, 235, 245, 0.32)"
  separator: "rgba(60, 60, 67, 0.29)"
  separator-dark: "rgba(84, 84, 88, 0.65)"
typography:
  large-title:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  kcal-figure:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title2:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.294rem"
    fontWeight: 700
    lineHeight: 1.27
    letterSpacing: "-0.02em"
  title3:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.176rem"
    fontWeight: 600
    lineHeight: 1.25
  headline:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: "-0.024em"
  body:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: "-0.024em"
    fontFeature: "tnum"
  subhead:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.882rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "-0.015em"
  footnote:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.765rem"
    fontWeight: 400
    lineHeight: 1.38
    letterSpacing: "-0.005em"
  caption:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.706rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0"
  tab-label:
    fontFamily: "-apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.6rem"
    fontWeight: 500
    letterSpacing: "0.01em"
rounded:
  grams: "8px"
  segment-inner: "7px"
  segment: "9px"
  control: "10px"
  group: "12px"
  toast: "14px"
  pill: "999px"
spacing:
  hairline: "0.5px"
  row-pad-y: "11px"
  gutter: "16px"
  group-gap: "32px"
  row-min: "44px"
  tabbar: "50px"
components:
  button-filled:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-filled-large:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.group}"
    height: "50px"
    width: "100%"
  button-filled-disabled:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.label-3}"
  button-tinted:
    backgroundColor: "{colors.tint-soft}"
    textColor: "{colors.tint}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-plain:
    textColor: "{colors.tint}"
    padding: "0 8px"
    height: "44px"
  bar-button:
    textColor: "{colors.tint}"
    typography: "{typography.body}"
    padding: "0 8px"
    size: "44px"
  list-group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.group}"
  list-row:
    textColor: "{colors.label}"
    typography: "{typography.body}"
    padding: "11px 16px"
    height: "44px"
  list-row-action:
    textColor: "{colors.tint}"
    padding: "11px 16px"
    height: "44px"
  group-header:
    textColor: "{colors.label-2}"
    typography: "{typography.footnote}"
    padding: "0 16px 6px"
  segmented-control:
    backgroundColor: "{colors.fill-2}"
    rounded: "{rounded.segment}"
    padding: "2px"
  segmented-option-selected:
    backgroundColor: "{colors.segment-selected}"
    textColor: "{colors.label}"
    typography: "{typography.footnote}"
    rounded: "{rounded.segment-inner}"
    height: "32px"
  switch:
    backgroundColor: "{colors.fill}"
    rounded: "16px"
    width: "51px"
    height: "31px"
  switch-on:
    backgroundColor: "{colors.switch-on}"
  grams-input:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.label}"
    rounded: "{rounded.grams}"
    padding: "0 10px"
    height: "36px"
  search-field:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.label-2}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "36px"
  progress-bar:
    backgroundColor: "{colors.fill-2}"
    rounded: "2px"
    height: "4px"
  progress-bar-macro:
    backgroundColor: "{colors.fill-2}"
    rounded: "3px"
    height: "6px"
  tab-bar:
    backgroundColor: "{colors.material}"
    height: "50px"
  tab-item:
    textColor: "{colors.label-2}"
    typography: "{typography.tab-label}"
  tab-item-active:
    textColor: "{colors.tint}"
  nav-bar-scrolled:
    backgroundColor: "{colors.material}"
    height: "44px"
  sheet:
    backgroundColor: "{colors.grouped-bg}"
    rounded: "12px 12px 0 0"
    width: "100%"
  toast:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.label}"
    typography: "{typography.subhead}"
    rounded: "{rounded.toast}"
    padding: "10px 10px 10px 16px"
  offline-pill:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.label-2}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: Comidia

## Overview

**Creative North Star: "The First-Party App"**

Comidia is an iPhone app that happens to be built for the web. Every surface is drawn from iOS's own vocabulary (grouped inset lists on a grouped background, large titles that collapse into a translucent nav bar, a translucent tab bar, bottom sheets with a grabber, segmented controls, switches) and executed at the craft level of Apple's Health, Fitness and Settings. A fluent iOS user should never pause at a control. The owner pinned the look himself: "que se vea como app nativa de iPhone, que sea sobria y con modo oscuro".

Sobriety is carried by color discipline, not by emptiness. The interface is grey grounds, white or near-black cards, and black or white labels; one teal tint marks everything that can be tapped, and four data colors appear only where a macro is being encoded. Numbers are the content: tabular, large where they matter (the day's calories), and always written as "consumido / meta". Dark mode is first class and true black, following the phone setting through `prefers-color-scheme`.

Density is Settings-like: 44 px minimum rows, 16 px gutters, 32 px between groups, hairline separators inset from the leading edge. There is no decoration: no gradients, no illustration, no progress rings, no gamified color. The single signature beyond stock iOS is the Hoy calorie summary: a large "1.046 / 2.209" figure over a shallow kcal arc with two ticks marking the ±10 % target range, then three macro columns with their own bars.

**Key Characteristics:**
- iOS semantic palette, light grouped grey and true-black dark, swapped wholesale by media query.
- One interactive tint (teal); four data colors reserved for kcal, protein, carbs and fat.
- System font with Dynamic Type; `1rem` is the user's body size, everything scales from it.
- Tabular numerals everywhere; quantities written "x / y".
- Grouped inset lists as the universal container; sheets for focused edits.
- Translucent material (saturate 180 % + blur 20 px) only on the bars that float over content.

## Colors

A grey-and-label iOS palette with one teal voice for interaction and four Apple system hues that exist only to encode macros. Every token has a light value and a `-dark` counterpart; the dark set replaces the light set on `:root` under `prefers-color-scheme: dark`.

### Primary
- **Comidia Teal** (`tint` / `tint-dark`): the only interactive color. Bar buttons, the "Agregar" action rows, filled and tinted buttons, plain links, the checkmark in choice lists, the selected tab, the caret, focus rings, the weight-chart line. Deepened in light mode for contrast on white, lifted to a bright cyan in dark.
- **Teal Wash** (`tint-soft` / `tint-soft-dark`): background of tinted buttons (the toast's "Deshacer", "Probar", "Crear comida") and text selection. Never a card or row fill.
- **On Teal** (`on-tint` / `on-tint-dark`): label on filled buttons; white in light, near-black teal in dark because the dark tint is too bright for white text.

### Secondary
- **Data colors** (`kcal` orange, `protein` pink, `carbs` indigo, `fat` yellow, each with `-dark`): Apple's system orange, pink, indigo and yellow. They appear as the kcal arc fill, the macro progress bars, and the 7 px dots that key a macro label (Hoy summary, Tus metas diarias). Nothing else.

### Tertiary
- **Destructive Red** (`danger` / `danger-dark`): destructive rows ("Borrar", "Quitar ingrediente", "Borrar key"), invalid numeric input text. Never a decorative accent and never used for "te pasaste".
- **Switch Green** (`switch-on`): the on state of the iOS switch, exactly as iOS draws it. Scoped to that one control.

### Neutral
- **Grouped Background** (`grouped-bg` / `grouped-bg-dark`): the page ground (#f2f2f7 light, true black dark) and the sheet ground.
- **Grouped Surface** (`surface` / `surface-dark`): every inset group body.
- **Raised Surface** (`surface-raised` / `surface-raised-dark`): floating elements above content (toast, offline pill); in dark it steps one level lighter than the group surface so it separates without a border.
- **Fills** (`fill`, `fill-2`, with `-dark`): system fills. `fill` is the switch track and disabled filled button; `fill-2` is the segmented-control track, search field, grams input, progress and arc track, and the pressed-row highlight.
- **Material** (`material` / `material-dark`): the translucent base of the tab bar and the scrolled nav bar, always paired with the backdrop blur.
- **Labels** (`label`, `label-2`, `label-3`, with `-dark`): primary text; secondary text (subtitles, details, units, group headers and footers, "Te quedan"); tertiary text (placeholders, chevrons, the "/" in the kcal figure, the arc range ticks, disabled controls, the sheet grabber).
- **Separator** (`separator` / `separator-dark`): 0.5 px hairlines between rows and under the scrolled bars.
- **Segment Thumb** (`segment-selected` / `segment-selected-dark`): the selected segment in a segmented control.

### Named Rules
**The One Tint Rule.** Teal means "you can tap this" and nothing else. If an element is teal it must be interactive; if it is interactive and not destructive, it is teal (the switch's green is the single iOS-native exception).

**The Data Color Rule.** Orange, pink, indigo and yellow encode kcal, protein, carbs and fat, always in that pairing, and appear only as bars, the arc, and key dots. They never color text, buttons, backgrounds, icons or states.

**The No Guilt Rule.** Going over a target never turns anything red. An over-target bar keeps its macro color at 55 % opacity, and the copy says "Te pasaste por … kcal" in secondary label color.

## Typography

**Display Font:** none; the system font carries every role.
**Body Font:** San Francisco via `-apple-system` (with system-ui, Segoe UI, Roboto, Helvetica Neue, Arial)
**Label/Mono Font:** same family; numbers use tabular figures rather than a mono face.

**Character:** Apple's own text styles, reproduced in rem. `html` takes `font: -apple-system-body`, so `1rem` equals the user's Dynamic Type body size (17 pt at default) and every role scales with the phone's text-size setting; browsers without that keyword fall back to 17 px.

### Hierarchy
- **Large Title** (700, 2rem, 1.2, +0.01em): the screen title on tab roots (Hoy, Comidas, Progreso, Ajustes); collapses into the inline nav title on scroll.
- **Kcal Figure** (700, 2rem, 1.1, -0.02em, tabular): the eaten / target number in the Hoy summary. The "/" is set in tertiary label at 600.
- **Title 2** (700, 1.294rem, 1.27): prominent figures in secondary contexts.
- **Title 3** (600, 1.176rem, 1.25): prominent group headers (sentence case, primary label).
- **Headline** (600, 1rem): inline nav titles, sheet titles, empty-state titles, macro values in the summary, bold bar buttons ("Guardar", "Listo").
- **Body** (400, 1rem, 1.29, -0.024em): rows, fields, buttons, bar buttons.
- **Subhead** (400, 0.882rem, 1.33): row subtitles ("P 16 · C 77 · G 8 g"), date under the large title, "Te quedan…", toast text, macro labels.
- **Footnote** (400, 0.765rem, 1.38): group headers (uppercase, secondary label), group footers, "Tu rango: …", segmented-control labels.
- **Caption** (400–500, 0.706rem): the offline pill.
- **Tab Label** (500, 0.6rem, +0.01em): tab bar item names under 25 px icons.

### Named Rules
**The Dynamic Type Rule.** Size every text role in rem off `-apple-system-body`. Pixel font sizes are reserved for SVG chart and arc tick labels, which scale with their viewBox.

**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set on `body` and repeated on inputs and SVG labels; every number aligns column to column and does not jitter as it updates.

## Layout

Single column, phone-first, designed for 375–430 px. Screens are a sticky nav bar, an optional large title block (2 px / 16 px / 8 px padding), and a body with 16 px side gutters holding a stack of inset groups 32 px apart. Group headers sit 6 px above the card, footers 6 px below it, both indented to the 16 px gutter. Rows are at least 44 px tall with 11 px vertical and 16 px horizontal padding and a 12 px gap between leading icon, text and detail; a 28 px leading column shifts the separator inset to 56 px.

Safe areas are respected everywhere: the nav bar adds `env(safe-area-inset-top)`, the tab bar and sheets add `env(safe-area-inset-bottom)`, and tab screens reserve the tab bar height plus 24 px at the bottom. Sheets cap at 640 px wide and at the viewport height minus the top inset and 12 px. The Hoy macro row collapses from three columns to one inside a container narrower than 17em (large Dynamic Type sizes). Primary actions sit in reach of the thumb: the "Agregar" row closes every meal group.

## Elevation & Depth

Flat by default, layered the iOS way. Depth comes from tonal grounds (grouped background behind white or #1c1c1e cards), from translucent material on the two bars, and from shadows only on things that genuinely float or move: the sheet, the toast, the offline pill, the switch thumb and the selected segment. Cards and rows never carry shadows or borders.

### Shadow Vocabulary
- **Bar hairline** (`box-shadow: 0 0.5px 0 var(--separator)`, and `0 -0.5px 0` on the tab bar): the edge of the scrolled nav bar and the tab bar.
- **Sheet lift** (`box-shadow: 0 -8px 30px rgba(0,0,0,0.18)`): the bottom sheet over its 32 % black scrim.
- **Toast float** (`box-shadow: 0 8px 24px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08)`): the confirmation toast.
- **Pill float** (`box-shadow: 0 2px 10px rgba(0,0,0,0.12)`): the offline pill.
- **Thumb** (`box-shadow: 0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06)`): switch knob; the selected segment uses the same shape at 0.12 / 0.04.

### Named Rules
**The Material Rule.** Translucency (`material` + `saturate(180%) blur(20px)`) belongs only to bars that float over scrolling content: the tab bar always, the nav bar once content scrolls under it or on inline-title screens. Nothing else is frosted.

## Shapes

Continuous, moderate rounding with a clear ladder: 12 px for inset groups, sheet top corners, the large button, the scanner and photo preview; 10 px for the search field; 9 px / 7 px for the segmented track and thumb; 8 px for the grams input; 14 px for the toast; fully round (999 px) for compact buttons and the offline pill; 2–3 px for progress bars, which also round their fill through `clip-path: inset(... round 2px)`. Separators are 0.5 px hairlines inset from the leading edge and running to the trailing edge. Strokes in the arc and chart are round-capped.

## Components

### Buttons
Quiet and native; most actions are bar buttons or rows, not filled buttons.
- **Shape:** compact buttons are pills (999 px) at 44 px min height; the large button is full width, 50 px, 12 px corners.
- **Filled:** teal background, on-tint label, 600 weight. The default variant; one per view at most (e.g. "Tomar foto" beside a tinted "Elegir de la galería").
- **Tinted:** teal wash with teal label (toast actions, secondary choices).
- **Plain / Destructive:** text only in teal or red, 400 weight.
- **Bar button:** 44 × 44 minimum, teal, body size; bold variant for the confirming action ("Guardar", "Listo"). Disabled goes to tertiary label.
- **Press:** opacity 0.7 and scale 0.98 over 120 ms (bar buttons drop to 0.4 opacity). Busy state hides the label and spins an 18 px ring.

### Grouped Lists and Rows
The universal container, Settings-style.
- **Group:** surface card, 12 px corners, clipped; uppercase footnote header in secondary label (the meal header carries its kcal subtotal right-aligned in the same style); footnote footer for help text. A prominent header variant uses Title 3 in sentence case.
- **Row:** title in body, optional subtitle in subhead secondary, trailing detail in secondary label, optional 18 px tertiary chevron. Pressed rows fill with `fill-2`; disabled rows drop to tertiary label.
- **Action row:** a row whose title and 20 px plus icon are teal ("Agregar"). Destructive rows are centered red ("Borrar", "Borrar comida").
- **Choice row:** a radio list where the selected row shows a trailing teal checkmark.
- **Field row:** label left, value right-aligned in the same row, unit in secondary label after it; stacked variant for long text; multiline textarea at 96 px min.

### Segmented Control
- **Style:** `fill-2` track, 2 px inset, 9 px corners; equal-width segments, 32 px tall, footnote 500.
- **State:** selected segment gets the segment thumb color, 600 weight and the thumb shadow; transition 180 ms. Focus shows a 2 px teal outline.

### Switch
- **Style:** 51 × 31 track in `fill`, white 27 px knob with thumb shadow.
- **State:** on turns the track switch green and slides the knob 20 px over 200 ms.

### Inline Grams Input
The review screen's trailing control for each ingredient.
- **Style:** `fill-2` capsule, 8 px corners, 36 px tall, right-aligned tabular number (3.4em wide) followed by "g" in secondary label.
- **Focus:** 2 px teal ring via box-shadow. **Invalid:** number turns red.

### Search Field
`fill-2`, 10 px corners, 36 px tall, leading magnifier and placeholder in secondary label.

### Progress Bar
4 px track in `fill-2`, 2 px corners, fill in the macro's data color revealed by `clip-path` (350 ms). In the Hoy summary it thickens to 6 px / 3 px corners. Over target: fill drops to 55 % opacity.

### Kcal Arc Gauge (signature)
A shallow quadratic arc (viewBox 320 × 70), not a ring. 9 px round-capped track in `fill-2`, fill in `kcal`, animated on `stroke-dasharray` over 450 ms. The scale runs 0 to twice the target so the target sits at the apex; two 3 px tertiary ticks mark 90 % and 110 % of target. It sits under the centered kcal figure and "kcal" unit, followed by "Te quedan … kcal" (subhead secondary) and "Tu rango: … – … kcal" (footnote secondary). A hairline divides it from three centered macro columns: dot + label, "83 / 160 g" in headline, 6 px bar. Exposed as `role="meter"`.

### Navigation
- **Nav bar:** sticky, three-column grid (leading, title, trailing), 44 px plus top inset. Transparent over a large title; when the large title scrolls out (or on inline-title detail screens) it gains material, blur and the bar hairline over 200 ms and fades in a headline title over 150 ms.
- **Large title:** tab roots only, with an optional subhead secondary line (the long date on Hoy). Day navigation uses 24 px chevrons as bar buttons.
- **Tab bar:** fixed, four equal items (Hoy, Comidas, Progreso, Ajustes), 50 px plus bottom inset, material and blur, 25 px stroke icons at 1.8 weight above tab labels; inactive secondary label, active teal.
- **Push transitions:** non-tab screens slide in 24 px from the right with opacity 0.6 → 1 over 280 ms; a 20 px left edge zone owns the swipe-back gesture.

### Sheet
- **Style:** grouped-background panel rising from the bottom, 12 px top corners, sheet lift shadow over a 32 % black scrim, 36 × 5 px tertiary grabber 6 px from the top.
- **Header:** Cancelar / Cerrar left, headline title centered, bold confirming bar button right ("Listo", "Agregar").
- **Behavior:** enters with a 320 ms slide up; closes by button, scrim tap, Escape, or dragging the handle down more than 120 px (follows the finger with no transition, then slides out over 220 ms while the scrim fades). Focus moves into the sheet and returns on close; body scroll locks.

### Toast
Raised surface, 14 px corners, toast float shadow, subhead text and an optional tinted action; centered 12 px above the tab bar; rises 12 px and fades in over 260 ms; dismisses after 2.5 s (5 s with an action). `role="status"`.

### Offline Pill
Fully round raised-surface pill, caption 500 in secondary label, pill float shadow, centered 8 px above the tab bar: "Sin conexión: la IA y los productos nuevos no están disponibles".

### Empty State
Centered column, 40 px / 24 px padding: tertiary icon, headline title, subhead secondary text capped at 32ch, optional action 8 px below.

### Motion
One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)` (a soft ease-out), for every movement; linear only for opacity fades and the spinner. Durations: 120 ms press, 150 ms title fade, 180 ms segment, 200 ms switch and bars, 220 ms sheet drag-release, 260 ms toast, 280 ms push, 320 ms sheet enter, 350 ms progress, 450 ms arc. Under `prefers-reduced-motion: reduce` every animation and transition collapses to 1 ms.

### Copy and Voice
UI copy is Spanish (Chile), cercano, tuteo, never vulgar: "¿Qué comiste?", "Te quedan 730 kcal", "Buena, guardado", "Te pasaste por 120 kcal", "Revisas los números antes de guardar", "Ahora no". Meals are Desayuno, Almuerzo, Cena and **Colaciones**. Macros are Calorías, Proteína, Carbos, Grasa; compact macro strings read "P 16 · C 77 · G 8 g". Quantities are written "consumido / meta" with spaces around the slash ("83 / 160 g", "1.046 / 2.209"), using es-CL grouping (dot for thousands) and decimal comma; kcal as integers, grams to at most one decimal. The Gemini credential is called **key**, the owner's own word ("Falta tu key de Gemini. Agrégala en Ajustes."), never "clave API". Sheet left buttons say "Cancelar" when there is something to discard and "Cerrar" when only viewing.

## Do's and Don'ts

### Do:
- **Do** build every screen from inset groups on the grouped background, 16 px gutters, 32 px between groups, 44 px minimum rows.
- **Do** use teal (`tint`) for every tappable non-destructive element and for nothing else.
- **Do** use the four data colors only for the kcal arc, macro bars and macro key dots, always kcal orange, protein pink, carbs indigo, fat yellow.
- **Do** size text in rem off `-apple-system-body` and keep tabular numerals on every number.
- **Do** write quantities as "x / y" with es-CL number formatting.
- **Do** put focused edits in a bottom sheet with a grabber, Cancelar/Cerrar left and a bold confirm right, dismissible by dragging down.
- **Do** define every new color as a light/dark pair and test both, with true black as the dark ground.
- **Do** use `cubic-bezier(0.22, 1, 0.36, 1)` for movement and honor reduced motion.

### Don't:
- **Don't** use progress rings, gradient cards, gamified color or celebratory decoration; the kcal gauge is a shallow arc with range ticks, not a ring.
- **Don't** color text, buttons or backgrounds with a data color, or use teal for anything that cannot be tapped.
- **Don't** turn over-target values red or write guilt copy; dim the bar and say "Te pasaste por …".
- **Don't** put shadows or borders on cards and rows; shadows are for sheets, toasts, the offline pill and control thumbs.
- **Don't** frost anything except the tab bar and the scrolled nav bar.
- **Don't** set text sizes in px outside SVG labels, or swap the system font for a web font.
- **Don't** add glyph or emoji icons; icons come from the one stroke library already in use, at SF Symbol-like weights (1.8 in the tab bar, 2.2–2.5 for chevrons and the plus).
- **Don't** rename "Colaciones" or "key", or copy wording, names or look from any existing nutrition app.
