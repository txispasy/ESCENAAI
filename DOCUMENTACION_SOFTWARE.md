# Documentación del Software: Escena.AI V2

Este documento proporciona una descripción técnica detallada de la aplicación Escena.AI V2, su arquitectura, componentes principales y flujos de datos. Está destinado a desarrolladores que trabajen o deseen contribuir al proyecto.

## Índice

1.  [Visión General y Stack Tecnológico](#1-visión-general-y-stack-tecnológico)
2.  [Estructura del Proyecto](#2-estructura-del-proyecto)
3.  [Arquitectura de la Aplicación](#3-arquitectura-de-la-aplicación)
    *   [Flujo de Datos y Estado](#flujo-de-datos-y-estado)
    *   [Enrutamiento](#enrutamiento)
    *   [Estilos](#estilos)
4.  [Análisis de Componentes Clave](#4-análisis-de-componentes-clave)
    *   [`pages/Generator.tsx`](#pagesgeneratortsx)
    *   [`components/AnimationModal.tsx`](#componentsanimationmodaltsx)
    *   [`pages/Gallery.tsx` y `pages/Classification.tsx`](#pagesgallerytsx-y-pagesclassificationtsx)
5.  [Servicios y Lógica Externa](#5-servicios-y-lógica-externa)
    *   [`services/apiService.ts`](#servicesapiservicets)
6.  [Definiciones de Tipos (`types.ts`)](#6-definiciones-de-tipos-typests)
7.  [Variables de Entorno](#7-variables-de-entorno)

---

### 1. Visión General y Stack Tecnológico

Escena.AI V2 es una Single Page Application (SPA) que permite a los usuarios generar y manipular imágenes y videos mediante IA.

*   **Framework Principal:** React 19
*   **Lenguaje:** TypeScript
*   **Enrutamiento:** `react-router-dom` v7
*   **Estilos:** Tailwind CSS (configurado directamente en `index.html`)
*   **APIs de IA:**
    *   Google Gemini (`@google/genai`): Usado para optimización de prompts, análisis de imágenes, generación de imágenes (Imagen 4.0) y generación de video (VEO).
    *   Grok (x.AI): Usado como motor de respaldo para la generación de imágenes.
*   **Persistencia de Datos:** `localStorage` del navegador.

---

### 2. Estructura del Proyecto

El proyecto sigue una estructura modular y orientada a funcionalidades:

```
/
├── components/
│   ├── AnimationModal.tsx   # Modal para el proceso de animación de video.
│   ├── BottomNav.tsx        # Navegación inferior para dispositivos móviles.
│   └── Sidebar.tsx          # Menú lateral para escritorio.
├── pages/
│   ├── Classification.tsx   # Vista de la galería pública y votación.
│   ├── Gallery.tsx          # Vista de la galería privada del usuario.
│   └── Generator.tsx        # Vista principal para la generación de imágenes.
├── services/
│   └── apiService.ts        # Lógica de negocio y comunicación con APIs externas y localStorage.
├── App.tsx                  # Componente raíz que gestiona el layout y el enrutamiento.
├── constants.tsx            # Constantes de la aplicación (estilos, items de navegación, iconos SVG).
├── index.html               # Punto de entrada HTML, incluye configuración de Tailwind y scripts.
├── index.tsx                # Punto de entrada de React, monta el componente App.
├── metadata.json            # Metadatos de la aplicación.
└── types.ts                 # Definiciones de tipos y interfaces de TypeScript.
```

---

### 3. Arquitectura de la Aplicación

#### Flujo de Datos y Estado

El estado de la aplicación se gestiona principalmente a nivel de componente utilizando los hooks de React (`useState`, `useEffect`, `useCallback`). No se utiliza un gestor de estado global (como Redux o Zustand) para mantener la simplicidad.

*   **Estado del Generador:** `Generator.tsx` mantiene un estado local complejo que incluye los prompts del usuario, el estilo seleccionado, la relación de aspecto, el número de variantes, el estado de carga y los resultados.
*   **Persistencia:** El `storageService` (dentro de `apiService.ts`) actúa como una capa de abstracción sobre `localStorage`. Se encarga de guardar (`saveToGallery`), leer (`getGalleryImages`), y eliminar imágenes, así como de gestionar los datos de la galería de clasificación. Implementa una lógica de caducidad de 90 días para los datos.

#### Enrutamiento

Se utiliza `HashRouter` de `react-router-dom` para la navegación. `App.tsx` define las tres rutas principales (`/`, `/gallery`, `/classification`) y renderiza el componente de página correspondiente junto con un layout consistente (Sidebar/Header/BottomNav).

#### Estilos

Tailwind CSS se utiliza para un estilizado rápido y responsivo. La configuración se inyecta directamente en el `<head>` de `index.html`, definiendo colores personalizados (`brand-*`), tipografía y otras extensiones del tema.

---

### 4. Análisis de Componentes Clave

#### `pages/Generator.tsx`

Este es el componente más complejo y el núcleo de la aplicación.

*   **Estado:** Gestiona múltiples estados, incluyendo `mode` (Simple/Pro), `scenes`, `negativePrompt`, `style`, `isLoading`, `isOptimizing`, `optimizedPrompt` y `generatedImages`.
*   **Flujo de Generación (`generate` function):**
    1.  Establece el estado `isLoading` a `true`.
    2.  Llama a `geminiService.optimizePrompt` para mejorar la entrada del usuario.
    3.  Intenta generar imágenes con `geminiService.generateImages`.
    4.  **Lógica de Fallback:** Si la llamada a Gemini falla, el bloque `catch` llama a `grokService.generateImages` como respaldo, actualizando el `engineUsed`.
    5.  Si todos los motores fallan, muestra un error al usuario.
    6.  Procesa las imágenes recibidas (en formato base64), las convierte a objetos `StoredImage`, las guarda en la galería a través de `storageService.saveToGallery`, y actualiza el estado local para mostrarlas en la UI.
    7.  Finalmente, establece `isLoading` a `false`.
*   **Interacción:** Maneja la subida de archivos para el análisis de imágenes y la interacción con el modal de animación.

#### `components/AnimationModal.tsx`

Componente reutilizable que encapsula toda la lógica de la animación de video.

*   **Ciclo de Vida:**
    1.  Se activa cuando la prop `isOpen` es `true`.
    2.  Un `useEffect` se dispara al abrirse, llamando a `geminiService.animateImage`.
    3.  Gestiona su propio estado interno: `status` ('idle', 'animating', 'success', 'error'), `videoUrl`, `error` y `progressMessage`.
    4.  Mientras está en estado `animating`, un `setInterval` cicla a través de mensajes de progreso para mejorar la UX.
    5.  Si la llamada a la API tiene éxito, guarda la URL del blob de video (`URL.createObjectURL`) en su estado y muestra el reproductor de `<video>`.
    6.  Si falla, muestra un mensaje de error.
    7.  **Limpieza:** Al cerrarse, un `useEffect` revoca la URL del blob (`URL.revokeObjectURL`) para evitar fugas de memoria y resetea su estado interno.

#### `pages/Gallery.tsx` y `pages/Classification.tsx`

Estos componentes son responsables de mostrar los datos persistidos.

*   Utilizan `useEffect` para llamar a las funciones correspondientes de `storageService` (`getGalleryImages`, `getClassificationImages`) y cargar los datos en su estado local al montarse.
*   Las acciones del usuario (eliminar, votar, etc.) llaman a los métodos de `storageService` y luego vuelven a cargar los datos para reflejar los cambios en la UI.

---

### 5. Servicios y Lógica Externa

#### `services/apiService.ts`

Este archivo es crucial, ya que centraliza toda la lógica de negocio y las interacciones con servicios externos.

*   **`geminiService`:**
    *   `optimizePrompt`: Mejora un prompt de usuario utilizando una `systemInstruction` específica.
    *   `analyzeImage`: Envía una imagen en base64 a Gemini para obtener un prompt descriptivo.
    *   `generateImages`: Llama al modelo `imagen-4.0-generate-001`.
    *   `animateImage`:
        1.  Inicia una operación de larga duración con `ai.models.generateVideos`.
        2.  Entra en un bucle `while` que sondea el estado de la operación cada 10 segundos usando `ai.operations.getVideosOperation`.
        3.  Una vez completada (`operation.done`), obtiene el `downloadLink`.
        4.  Descarga el video como un `blob` y crea una URL local para ser usada por el frontend.

*   **`grokService`:**
    *   `generateImages`: Realiza una petición `fetch` al endpoint de la API de Grok, manejando la autenticación y el formato de datos específico (`b64_json`).

*   **`storageService`:**
    *   Implementa una interfaz CRUD simple para `localStorage`.
    *   La función `getActiveItems` es clave, ya que filtra los elementos que han superado el tiempo de expiración de 90 días antes de devolverlos.

---

### 6. Definiciones de Tipos (`types.ts`)

Este archivo centraliza todas las interfaces y tipos personalizados, proporcionando seguridad de tipos en todo el proyecto.

*   `StoredImage`: La estructura de datos base para una imagen generada.
*   `ClassificationImage`: Extiende `StoredImage` para añadir la propiedad `votes`.
*   `GenerationSettings`: Un objeto que agrupa todos los parámetros de una solicitud de generación.
*   `Enums` (`GenerationEngine`, `GenerationMode`): Proporcionan valores constantes para el motor de IA utilizado y el modo de UI.

---

### 7. Variables de Entorno

La aplicación requiere claves de API para interactuar con los servicios de inteligencia artificial. Estas claves deben configurarse como variables de entorno en el sistema donde se ejecuta la aplicación.

*   **`API_KEY`**: (Obligatoria) Tu clave de API de Google AI Studio para los modelos de Gemini. Es esencial para la mayoría de las funcionalidades de la aplicación, incluyendo la generación de imágenes y video, y el análisis de prompts.

*   **`XAI_API_KEY`**: (Opcional) Tu clave de API de Grok (x.AI). Se utiliza como motor de respaldo para la generación de imágenes en caso de que el servicio de Gemini falle. Si no se proporciona, la funcionalidad de respaldo no estará disponible.

Asegúrate de que estas variables estén disponibles en el contexto de ejecución del proyecto.
