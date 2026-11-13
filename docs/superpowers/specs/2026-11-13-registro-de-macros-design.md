# Diseño: app personal de registro de macros

Fecha: 2026-11-13
Estado: aprobado por el dueño el 2026-11-13

## 1. Intención y porqué

El dueño del proyecto paga una suscripción a una app comercial de nutrición y le toca renovar. Usa solo una parte de lo que paga: calcular sus metas y anotar lo que come. Quiere una app propia, gratuita, que haga eso bien, para él y a lo más su polola, en iPhone.

Es una app original con funciones equivalentes. No copia el nombre, la marca, la interfaz ni los datos de ninguna app existente.

Nombre: **Comidia** (elegido por el dueño). Repositorio: `CacoDf/COMIDIA`.

## 2. Objetivos

Lo que el dueño pidió, en orden de importancia:

1. **Metas diarias personalizadas.** Calcular calorías de mantención según peso, altura, edad, género y nivel de actividad, y ajustar calorías y macros diarios según el objetivo (bajar, mantener, subir).
2. **Anotar comida escribiendo.** Describir en texto libre qué contiene la comida y recibir una estimación de macros hecha por IA.
3. **Código de barras.** Escanear un producto envasado y obtener sus datos nutricionales reales.
4. **Foto de la comida.** Sacar una foto del plato y recibir una estimación de macros hecha por IA.
5. **Recetas**, en dos formas:
   - Comidas guardadas: armar una comida una vez y volver a anotarla con un toque.
   - Sugerencias: la IA propone platos a pedido según los macros que quedan en el día; las que gusten se guardan como comidas.
6. **Respaldo por exportación.** Exportar todos los datos a un archivo e importarlos de vuelta.
7. **Costo cero.** Sin suscripciones ni cuentas pagadas.

Propuestas del autor del diseño que el dueño no objetó:

- Buscar alimentos por nombre como cuarta forma de anotar.
- Registro de peso; las metas se recalculan cuando el peso cambia.
- Pantalla del día con lo consumido y lo restante, separado por comida.
- Revisión del desglose de la IA antes de guardar.

## 3. Fuera de alcance

- Plan de comidas automático.
- Lista de compras.
- Precios de supermercado o scraping de sitios de supermercados.
- Cuentas de usuario, servidor propio, sincronización entre dispositivos.
- App nativa de App Store.
- Registro de ejercicio, agua, micronutrientes, integración con Apple Health.
- Migrar datos desde la app actual. La app parte vacía (supuesto del autor del diseño; ver sección 10).
- Ajuste adaptativo de la mantención a partir de la tendencia real de peso (candidato a una versión posterior).

## 4. Qué sería un fracaso aunque funcione

- Que anotar una comida sea lento o engorroso. Criterio concreto (decisión del autor del diseño): una comida guardada se anota con un toque más confirmar; un resultado de IA se guarda con un solo toque en "Guardar" desde la pantalla de revisión cuando no hay nada que corregir. La revisión es una sola pantalla donde editar es opcional, no un asistente de varios pasos.
- Que la IA guarde números sin que el usuario pueda verlos y corregirlos.
- Que se pierda el historial sin haber tenido una forma clara de respaldarlo.
- Que la API key quede escrita en el código o en el repositorio.
- Que termine costando plata.

## 5. Restricciones

- **Dispositivo:** iPhone, Safari. Se usa instalada en la pantalla de inicio. Se asume una versión reciente de iOS en ambos teléfonos (supuesto del autor del diseño; ver sección 10). Si compartir el archivo de respaldo por el menú de iOS no está disponible, se ofrece una descarga directa.
- **Dirección fija.** Los datos quedan atados a la dirección web de la app. Cambiar de hosting o de dirección después obliga a exportar en la dirección antigua e importar en la nueva. Por eso el hosting se decide antes de empezar.
- **Usuarios:** uno por teléfono. Cada persona instala la app en su iPhone y tiene sus propios datos. No hay perfiles múltiples dentro de un mismo teléfono.
- **IA:** API de Gemini con la key gratuita del dueño.
- **Idioma:** español de Chile en toda la interfaz y en las instrucciones a la IA. Unidades métricas.
- **Frontend:** diseñado e implementado usando el skill Impeccable.
- **Sin backend.** Todo corre en el navegador.

### Hechos verificados el 2026-11-13

- **Cuota gratuita de Gemini.** Fuentes recientes de terceros reportan unas 20 solicitudes al día en los modelos Flash y unas 500 al día en los modelos Flash-Lite, por proyecto y no por key, con reinicio a medianoche hora del Pacífico. No se encontró la página oficial; los números pueden variar. Consecuencias para el diseño: el modelo es configurable, el predeterminado es de la familia Flash-Lite, y si dos personas comparten la key comparten la cuota.
- **Open Food Facts.** Gratuita y abierta. Búsqueda por código en `GET /api/v2/product/{codigo}`. Límite documentado de 15 lecturas de producto por minuto por IP; la búsqueda por texto tiene un límite más bajo. La documentación declara soporte de CORS, pero hay que confirmarlo con una prueba real desde el navegador. Un navegador no puede fijar un User-Agent propio.
- **Escáner en iOS.** Safari en iOS no soporta la API nativa `BarcodeDetector`. Se necesita una librería en WebAssembly (ZXing o un polyfill de `BarcodeDetector`).

## 6. Enfoques considerados

| Enfoque | Qué es | A favor | En contra |
|---|---|---|---|
| **1. App web instalable, todo en el teléfono** (elegido) | Sitio estático; datos en el almacenamiento del navegador; llamadas directas a Gemini y Open Food Facts | Lo más simple, sin cuentas ni servidor | El historial vive solo en el teléfono; sin acceso desde otro dispositivo |
| 2. App web + servidor gratuito en Cloudflare | Igual, más un servidor mínimo con base de datos | Respaldo automático, multi-dispositivo, key fuera del teléfono | Más piezas, requiere cuenta y más trabajo |
| 3. App nativa | App de iOS real | Mejor acceso a cámara y sistema | 99 USD al año o reinstalar cada 7 días |

**Elección del dueño:** enfoque 1, con exportación de respaldos para cubrir el riesgo de pérdida de datos. El autor del diseño recomendó el 2; el dueño prefirió la simplicidad del 1.

## 7. Cómo funciona

### 7.1 Metas

Datos del perfil: género, fecha de nacimiento, altura, peso actual, nivel de actividad, objetivo y ritmo.

- **Metabolismo basal:** ecuación de Mifflin-St Jeor.
- **Mantención:** basal por factor de actividad (sedentario 1,2; ligero 1,375; moderado 1,55; alto 1,725; muy alto 1,9).
- **Objetivo:** bajar o subir a un ritmo elegido en kg por semana (0,25 / 0,5 / 0,75). Ajuste diario = ritmo × 7700 kcal ÷ 7. Mantener = sin ajuste.
- **Piso de seguridad:** la meta de calorías no baja del metabolismo basal. Si el ritmo elegido lo exigiera, la app usa el piso y lo avisa.
- **Macros:** proteína 2,0 g por kg de peso al bajar y 1,8 g por kg en los otros casos; grasa 25 % de las calorías con mínimo de 0,6 g por kg; carbohidratos con el resto.
- **Ajuste manual:** el usuario puede sobrescribir calorías y cada macro. Los valores manuales se respetan hasta que elija volver al cálculo automático.
- **Recalculo:** al registrar un peso nuevo, las metas automáticas se recalculan y la app muestra qué cambió.

Las constantes de esta sección son decisiones del autor del diseño.

### 7.2 Registro de comida

Cada día tiene cuatro comidas: desayuno, almuerzo, cena y colaciones. Hay cuatro formas de agregar, más las comidas guardadas:

1. **Escribir.** Texto libre → Gemini devuelve una lista de ingredientes con gramos, calorías, proteína, carbohidratos y grasa.
2. **Foto.** Imagen desde cámara o galería, reducida a un lado máximo de unos 1024 px antes de enviarla → misma salida. Se puede agregar una nota de texto para ayudar ("es con arroz integral").
3. **Código de barras.** Cámara en vivo → código → Open Food Facts → el usuario indica la cantidad en gramos o porciones.
4. **Buscar.** Por nombre, sobre tres fuentes en este orden: alimentos propios y ya usados, tabla de genéricos incluida, Open Food Facts.

**Pantalla de revisión.** Todo resultado de IA pasa por una pantalla donde se ve cada ingrediente y se puede editar cantidad, valores o borrar líneas antes de guardar. Al cambiar los gramos, los macros se escalan en proporción.

**Producto no encontrado.** Si el código no existe en Open Food Facts o no tiene datos nutricionales, la app ofrece fotografiar la tabla nutricional. Gemini la lee, el usuario confirma los valores y el producto queda guardado en la base propia, asociado a ese código.

**Entradas guardadas con copia de valores.** Cada entrada del diario guarda sus propios números. Editar un alimento después no cambia el historial.

**Edición.** Las entradas se pueden editar, borrar, mover de comida y copiar a otro día.

### 7.3 Base de alimentos

- **Envasados:** Open Food Facts, consultada en línea. Cada producto consultado se guarda localmente para no repetir la consulta y funcionar sin conexión.
- **Genéricos:** tabla incluida en la app con unos 300 alimentos comunes en Chile (frutas, verduras, carnes, cereales, legumbres, lácteos, pan), con nombres en español de Chile, valores por 100 g y porciones habituales (unidad, taza, cucharada). Los valores salen de USDA FoodData Central, que es de dominio público. No se inventan ni se generan con IA.
- **Propios:** alimentos creados a mano o leídos de una etiqueta.

### 7.4 Recetas

- **Comidas guardadas.** Desde cualquier comida anotada, o desde cero, se guarda un conjunto de ingredientes con nombre. Se anota completa con un toque, con opción de ajustar la porción.
- **Sugerencias.** El usuario pide ideas; la app envía a Gemini los macros restantes del día, la comida para la que busca, y un texto opcional ("tengo pollo y arroz", "sin lactosa"). Gemini devuelve tres propuestas con ingredientes, cantidades, pasos breves y macros. Cada una se puede anotar directo o guardar como comida.

### 7.5 Peso y progreso

Registro de peso con fecha. Gráfico de peso en el tiempo y resumen semanal de calorías y macros promedio contra la meta.

### 7.6 Respaldo

- **Exportar:** un archivo JSON con todos los datos y un número de versión del formato. Se entrega por el menú de compartir de iOS, para guardarlo en Archivos, iCloud o enviárselo a uno mismo. La API key **no** se incluye en el archivo.
- **Importar:** se elige un archivo, la app muestra qué contiene (fechas y cantidad de registros) y pide confirmación. Importar reemplaza los datos actuales.
- **Recordatorio:** si pasan 30 días sin exportar, la app lo sugiere en la pantalla del día.
- **Persistencia:** la app pide almacenamiento persistente al navegador al instalarse.

### 7.7 IA

- Llamadas directas del navegador a la API de Gemini, con salida estructurada en JSON validada antes de usarla.
- **Key:** se ingresa en Ajustes y se guarda solo en el teléfono. Nunca va en el código ni en el repositorio. Ajustes incluye un botón para probar la key.
- **Modelo:** configurable en Ajustes, eligiendo de la lista que devuelve la propia API. Predeterminado: el modelo Flash-Lite más reciente disponible, por su cuota diaria más alta.
- **Sin key o sin cuota:** escribir, foto y sugerencias quedan deshabilitadas con una explicación; código de barras, búsqueda, comidas guardadas y entrada manual siguen funcionando.
- **Errores:** cuota agotada, sin conexión, respuesta inválida y key rechazada tienen cada uno su mensaje, y nunca se pierde lo que el usuario escribió.
- Las fotos no se guardan después de analizarlas.

### 7.8 Pantallas

1. **Bienvenida:** datos del perfil, objetivo, resultado de metas, key de Gemini (se puede omitir).
2. **Hoy:** la pantalla principal.
3. **Agregar:** elegir entre escribir, foto, código, buscar y mis comidas.
4. **Revisión:** desglose editable antes de guardar.
5. **Mis comidas y sugerencias.**
6. **Progreso:** peso y resumen semanal.
7. **Ajustes:** perfil, metas, IA, respaldo.

Boceto de **Hoy**:

```
  ‹  viernes 13 nov  ›

  1.420 / 2.150 kcal        quedan 730
  ████████████░░░░░░

  Proteína  98/150 g   Carbos 140/230 g   Grasa 45/70 g

  Desayuno                         410 kcal
    Avena con plátano              410
  Almuerzo                         720 kcal
    Pollo con arroz                610
    Coca-Cola Zero 350 ml            1
  Cena                               —
  Colaciones                       290 kcal

                 [ + Agregar ]
```

La navegación por días permite ver y editar días pasados. La apariencia final la define el trabajo con Impeccable; este boceto fija contenido y jerarquía, no estilo.

### 7.9 Sin conexión

La app abre sin conexión. Funcionan el diario, las comidas guardadas, la búsqueda en genéricos y en productos ya consultados, la entrada manual y el registro de peso. Necesitan conexión la IA y los productos nuevos de Open Food Facts.

## 8. Decisiones técnicas del autor del diseño

El dueño delegó el cómo. Estas son propuestas, no acuerdos:

- **Vite + React + TypeScript**, como app web progresiva instalable.
- **IndexedDB** mediante Dexie para los datos.
- **ZXing en WebAssembly** para leer códigos EAN-13, EAN-8 y UPC.
- **Vitest** para pruebas.
- **GitHub Pages** como hosting (elegido por el dueño), publicado con GitHub Actions.

## 9. Lo que queda al constructor

- Estructura de carpetas y componentes.
- Redacción exacta de las instrucciones a Gemini y los esquemas de salida.
- Selección concreta de los ~300 alimentos genéricos y sus porciones.
- Diseño visual, dentro del proceso de Impeccable.
- Estrategia de caché del modo sin conexión.

### Orden sugerido: riesgos primero

Antes de construir pantallas, comprobar en un iPhone real las tres cosas de las que depende el enfoque:

1. Open Food Facts responde desde el navegador y tiene cobertura razonable de productos chilenos.
2. La key gratuita de Gemini alcanza para el uso diario con el modelo elegido, y la estimación por foto es utilizable.
3. El escáner con ZXing lee códigos con la cámara dentro de la app instalada.

Si alguna falla, se vuelve al dueño antes de seguir.

### Pruebas

- Automáticas: cálculo de metas (incluido el piso de seguridad), escalado de macros, validación de respuestas de Gemini y de Open Food Facts con respuestas simuladas, ida y vuelta de exportar e importar.
- Manuales en iPhone: instalación, cámara, escáner, compartir el archivo de respaldo.

## 10. Respuestas del dueño (2026-11-13)

1. **Hosting:** GitHub Pages, con repositorio público. La app queda en `https://<usuario>.github.io/<repositorio>/`, así que el manifiesto, el caché sin conexión y las rutas deben funcionar bajo esa sub-ruta. El nombre del repositorio fija la dirección y no debe cambiarse después.
2. **iOS:** ambos teléfonos tienen una versión reciente.
3. **Datos:** parte de cero, sin migración.
