# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable web app (PWA) used from the iPhone home screen in Safari standalone mode. Mobile web, not native: design for 375–430 px wide, iOS safe areas, touch only.

## Users

Two people at most: the owner and his partner, each on their own iPhone with their own data. They track calories and macros to reach a body-composition goal (lose, maintain or gain). They previously paid for a commercial nutrition app and are replacing it with this one.

Usage scene, confirmed by the owner:
- **Right when eating:** plate in front of them, often away from home (university, street, restaurant). Logging must be fast, one-handed, done in seconds by photo, text or barcode.
- **Before eating:** opening the app to see how much is left today and decide what to eat; this is also where meal suggestions fit.

## Product Purpose

Calculate personal daily calorie and macro targets (maintenance from weight, height, age, sex and activity, adjusted for the goal) and make logging food as effortless as possible. Success: the owner stops paying for the commercial app and logs every meal without friction.

## Positioning

Free and personal: no subscription, no account, no ads. AI-first logging (describe a meal in words or snap a photo and get an editable macro breakdown) plus barcode scanning against Open Food Facts and a built-in table of common Chilean foods. Data stays on the phone.

## Operating Context

- Daily diary split into Desayuno, Almuerzo, Cena and Colaciones.
- Five ways to add: Escribir (AI from text), Foto (AI from photo), Código (live barcode scanner), Buscar (local and Open Food Facts), Mis comidas (saved meals).
- Every AI result passes through a review screen before saving; saving unchanged is one tap.
- Weight log, weekly averages, AI meal suggestions based on what's left today.
- Backup is a JSON file exported through the iOS share sheet.
- Works offline except AI and new Open Food Facts lookups.

## Capabilities and Constraints

- Gemini API with the owner's free key; daily quota is limited and shared if both people use the same key. AI features degrade gracefully without a key or quota.
- Static hosting on GitHub Pages at `/COMIDIA/`; no backend.
- Numbers are central: kcal as integers, grams to one decimal, decimal comma accepted on input.
- Spanish (Chile), metric units.

## Brand Commitments

- Name: **Comidia**.
- Voice: cercano, chileno, tuteo, natural, never vulgar. Examples the owner approved: "¿Qué comiste?", "Te quedan 730 kcal", "Buena, guardado".
- Must not copy the name, branding, copy or look of any existing nutrition app.
- **Look (pinned by the owner, 2026-11-13):** "que se vea como app nativa de iPhone, que sea sobria y con modo oscuro". Follow Apple's iOS conventions (system font, semantic colors, grouped inset lists, tab bar, sheets, large titles) at the craft level of Apple's own apps (Health, Fitness, Settings). Sober: restrained color, no decoration. Dark mode is first-class and follows the phone's setting.

## Evidence on Hand

No logo, imagery or brand assets exist. No testimonials or metrics; none should be invented.

## Product Principles

1. Logging speed beats everything: the shortest path from "I'm eating" to "it's saved".
2. Calories, protein, carbs and fat carry equal weight at a glance; none is hidden behind another.
3. The AI proposes, the person decides: every estimate is visible and editable before it counts.
4. Honest numbers: show estimates as estimates, never fake precision, never guilt-trip about going over.
5. Private and free by construction: nothing leaves the phone except the calls needed for AI and product lookup.

## Accessibility & Inclusion

Large touch targets (44 px minimum), legible numbers in bright outdoor light, respect iOS Dynamic Type sizes where practical, light and dark mode.
