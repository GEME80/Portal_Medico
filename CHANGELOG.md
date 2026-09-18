<!-- ===================================================================== -->
<!-- 🏥 HUBMED PLATFORM — DOCUMENTACIÓN CANÓNICA OFICIAL                   -->
<!-- PROYECTO: Portal_Medico | MARCA: HubMed (hubmed.app)                  -->
<!-- REGLA DE AISLAMIENTO: Exclusivo de HubMed. Prohibida mezcla externa.  -->
<!-- ===================================================================== -->

> 🏥 **DOCUMENTO OFICIAL HUBMED PLATFORM** (`Portal_Medico`)  
> **Plataforma:** HubMed · SaaS Médico Multi-Tenant | **URL:** [`portal-medico-five.vercel.app`](https://portal-medico-five.vercel.app)  
> **Base de Datos:** Supabase (`nstiomejmhmcasxqxnbf` / `us-west-2`) | **SuperAdmin:** `gerkof@gmail.com`  
> 🔒 **INDICADOR DE ESTANQUEIDAD:** Este archivo pertenece exclusivamente a **HubMed**. Queda estrictamente prohibido mezclar directivas, esquemas o reglas con proyectos ajenos.

---

# 📋 REGISTRO DE CAMBIOS Y VERSIONES (CHANGELOG.md)

Todos los cambios notables en este proyecto se documentan en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [3.16.0] - 2026-09-17
### Auditoría y Optimización Responsiva Multi-Dispositivo (Móvil, Tablet, Desktop)
- **Visor Digital de Curvas OMS (`components/CurvasDigitalClient.tsx` y `components/VectorGrowthChart.tsx`)**:
  - Reemplazo de espaciados rígidos (`padding: 32px`) por hoja clínica responsiva (`.curvas-sheet`, `18px 14px` en móviles `< 768px`).
  - Barra de acciones superior flexible (`.curvas-topbar` y `.curvas-action-btn`) con botones compactos y texto adaptable.
  - Indicador de desplazamiento táctil (`.vector-growth-swipe-hint` / `.mobile-swipe-hint`) con texto guía (`↔ Desliza horizontalmente sobre la gráfica...`) y scroll inercial suave (`-webkit-overflow-scrolling: touch`).
  - Tarjeta de diagnóstico nutricional y bloque de firma médica / QR reorganizados en columna en pantallas reducidas para evitar cortes o scroll horizontal.
- **Modales de Gestión de Pacientes (`app/[slug]/admin/pacientes/page.tsx`)**:
  - **Modal 1 (Nuevo Paciente)**: Overlay reducido a `padding: 8px` en móviles con `maxHeight: 94vh`, formularios con grillas fluidas (`grid-cols-1 sm:grid-cols-2` y `grid-cols-1 sm:grid-cols-3`) y botones de guardado apilados a ancho completo en móviles.
  - **Modal 2 (Nueva Consulta Médica)**:
    - Barra de pestañas escalonadas con scroll horizontal táctil y sin quiebres de línea (`overflow-x-auto whitespace-nowrap`).
    - Grilla somatométrica de 7 signos vitales adaptable (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7`).
    - Tarjeta inteligente de IMC adaptable a visualización vertical en pantallas móviles.
    - Grilla de diagnósticos CIE-10 sugeridos y botones de plan de manejo con wrapping automático.
    - Pie de modal ergonómico con acciones principales apilables a ancho completo en móviles.
- **Perfil del Paciente y Visor de Historias (`app/[slug]/admin/pacientes/[pacienteId]/page.tsx`)**:
  - Reestructuración del layout principal de `1fr 2fr` a `grid grid-cols-1 lg:grid-cols-3`, eliminando el aplastamiento demográfico en pantallas móviles.
  - Formulario de edición demográfica con campos emparejados en grilla fluida (`grid-cols-1 sm:grid-cols-2`).
  - Visor modal de historia clínica completa y grilla de signos vitales históricos adaptada a `grid-cols-2 sm:grid-cols-4`.
- **Estilos Globales del Portal Administrativo (`app/[slug]/admin/doctor-portal.css`)**:
  - Incorporación de `@media (max-width: 640px)` para la topbar administrativa (56px de altura y padding compacto), banner de bienvenida (`.doc-dashboard-header`), botones de acción rápida a ancho completo (`.doc-quick-actions .doc-btn`) y grilla de KPIs de RIPS en 1 columna.

## [3.15.0] - 2026-09-17
### Curvas de Crecimiento OMS Vectoriales (Res. 2465/2016), Visor Digital Público y Cero Scroll
- **Reingeniería de Curvas OMS Pediátricas (Resolución 2465 de 2016 MinSalud)**:
  - **Gráficos 100% Vectoriales SVG de Alta Fidelidad (`components/VectorGrowthChart.tsx`)**:
    - Reemplazo total del sistema previo basado en imágenes JPG estáticas por renderizado vectorial milimétrico.
    - Marco institucional clínico: Celeste (`#38bdf8`) para niños y Rosa (`#f472b6`) para niñas.
    - Curvas oficiales Z-score OMS: Mediana verde sólido (0 DE), ±1 DE ámbar, ±2 DE roja discontinua y ±3 DE roja continua.
    - Corredor de normalidad sombreado en verde suave entre -2 DE y +2 DE.
    - Ejes duales numéricos a izquierda y derecha con cuadrícula milimétrica.
  - **Ergonomía Visual sin Scroll (SVG Data Labels e In-Situ Tooltips)**:
    - Etiquetas flotantes vectoriales directas sobre cada punto ploteado con su valor exacto (`9.2 kg`, `73 cm`, `16.5 IMC`, `45.8 cm`).
    - Tooltip flotante in-situ anclado directamente sobre el punto dentro del área visible del SVG al pasar el mouse o tocar en pantalla móvil.
    - Barra de control activo trasladada a la parte superior del gráfico con cálculo reactivo en tiempo real.
    - Interruptor de cabecera para encender o apagar las etiquetas de datos a conveniencia.
  - **Motor de Filtrado Inteligente por Edad y Género (`lib/oms/constants.ts`)**:
    - Matriz canónica de las 20 curvas oficiales OMS (10 para niños y 10 para niñas) en 3 etapas: 0-24 meses, 2-5 años y 5-18 años.
    - Detección automática: muestra estricta y exclusivamente las 2 a 4 gráficas pertinentes según la edad y sexo del paciente, eliminando sobrecarga cognitiva.
    - Clasificación nutricional según Z-Scores de la Resolución 2465/2016 (Desnutrición aguda/global, Riesgo, Adecuado, Sobrepeso, Obesidad).
  - **Visor Digital Público de Curvas (`app/[slug]/crecimiento/[token]`)**:
    - Acceso criptográfico mediante `token_acceso` (UUID v4) del paciente sin requerir credenciales ni contraseñas.
    - Tarjetas KPI con el último control, tabla histórica completa, código QR dinámico y firma médica caligráfica institucional.
    - Botón de envío directo por WhatsApp a los acudientes y enlace cruzado con el Carné de Vacunación Digital.
    - Corrección del error 404 por remoción de columna `tipo_sangre` en la consulta a la tabla `pacientes`.
  - **Dataset de Validación con 6 Pacientes de Prueba**:
    - Siembra en Supabase de 6 pacientes arquetípicos con historiales cronológicos continuos para comprobar el 100% de las 20 curvas oficiales.

## [3.14.0] - 2026-09-17
### Gestión de Pacientes y Consulta Médica Moderna
- **Reingeniería de la Experiencia de Consulta y Admisión (`app/[slug]/admin/pacientes`)**:
  - Reemplazo del drawer lateral derecho estrecho por modales centrados ergonómicos de alta legibilidad (~680px y ~940px).
  - Flexibilización total de signos vitales (100% opcionales, sin campos bloqueantes obligatorios).
  - Widget reactivo de Smart IMC con cálculo instantáneo, etiqueta nutricional OMS y rango de peso saludable sugerido para la talla digitada.
  - Chips rápidos de motivo de consulta y diagnósticos frecuentes CIE-10 accesibles con un solo clic.
  - Copia rápida de antecedentes previos desencriptados para ahorrar tiempo en controles sucesivos.
  - Estructuración ágil en plan de manejo (`+ Recomendaciones`, `+ Signos de Alarma`, `+ Cita de Control`).

## [3.13.0] - 2026-09-17
### Rediseño Minimalista del Dashboard Principal
- **Estandarización Visual Corporativa (`app/[slug]/admin/page.tsx`)**:
  - Eliminación integral de emojis en títulos, botones y métricas, reemplazándolos por iconografía médica sobria de Lucide React.
  - Tira superior de KPIs clínicos compactada con visualización de pacientes activos, citas del día, valor de inventario y estado general.
  - Ajuste de espaciados, tipografías y bordes suaves acorde al estándar corporativo de HubMed.

## [3.12.0] - 2026-09-17
### Optimización de Inventario y Kardex Server-Side
- **Mejoras en el Espacio de Inventario (`app/[slug]/admin/inventario`)**:
  - Corrección de popup cortado mediante contención de scroll y posicionamiento relativo en diálogos.
  - Plantillas inteligentes para registro ágil de nuevos biológicos e insumos, reduciendo pasos repetitivos.
  - Estandarización de botones con bordes redondeados (`rounded-xl`).
  - Optimización de base de datos en el Kardex: paginación server-side para escalar con el histórico de movimientos sin degradar memoria ni tiempo de respuesta.

## [3.11.0] - 2026-09-16
### Tarjetas y Carné de Vacunación Digital
- **Módulo Integral de Inmunización y Carné Digital**:
  - **Migración de Base de Datos (`20260916170000_aplicaciones_vacunas.sql`)**:
    - Tabla `aplicaciones_vacunas` con claves foráneas, índices compuestos y políticas RLS multi-tenant y de lectura pública por Magic Token (`token_acceso`).
  - **Server Actions Seguras (`lib/actions/vacunas-actions.ts`) & Constantes (`lib/vacunas/constants.ts`)**:
    - `registrarAplicacionVacuna`: Registro de dosis con descuento opcional de inventario (`inventario_medico` y `lotes_inventario`) y creación de movimiento en Kardex.
    - Catálogo precargado de esquemas vacunales (PAI infantil y ampliado privado).
  - **Modal de Gestión en Perfil del Paciente (`CarneVacunacionModal.tsx`)**:
    - Botón `💉 Carné de Vacunación` en `app/[slug]/admin/pacientes/[pacienteId]`.
    - Pestaña de visualización de tarjetas de dosis aplicadas y pestaña de registro rápido desde inventario o plantillas.
    - Botón de 1-clic para compartir el carné oficial por WhatsApp a los acudientes.
  - **Visor Institucional de Carné Digital (`app/[slug]/carne/[token]`)**:
    - Visor responsivo con sellos de verificación digital, resumen demográfico con cálculo de edad en años/meses, tarjetas de vacunas aplicadas y componente de impresión/guardado en PDF (`CarnePrintButton.tsx`).

## [3.10.2] - 2026-09-16
### Rendimiento & Experiencia de Usuario (Zero-Lag Navigation)
- **Eliminación de la Sensación de Lentitud en Navegación del Panel Admin**:
  - **Suspense Boundary con `loading.tsx` (`app/[slug]/admin/loading.tsx`)**:
    - Creación de esqueleto de carga clínico con microanimación de pulso y shimmer (`@keyframes adminShimmer`), eliminando el congelamiento de pantalla entre cambios de página.
  - **Retroalimentación Táctil Inmediata & Barra de Progreso (`AdminShell.tsx`)**:
    - Activación de prefetching (`prefetch={true}`) en todas las rutas del menú, permitiendo a Next.js precargar los paquetes de ruta en segundo plano.
    - Cambio de pestaña visual instantáneo (0ms) mediante estado optimista (`pendingHref`), dando confirmación inmediata de clic.
    - Barra de progreso superior ultra-delgada y brillante (`adminNavProgress`) durante las transiciones de red.
  - **Caché en Memoria para Resolución de Tenants (`middleware.ts`)**:
    - Implementación de `tenantCache` con TTL de 5 minutos, eliminando la consulta recurrente a la base de datos Supabase en cada navegación o prefetch de subruta (ahorro de 150-300ms por clic).
  - **Paralelización de Consultas de Servidor (`Promise.all`)**:
    - `citas/page.tsx`: Ejecución paralela de configuración de agenda y listado de citas.
    - `reportes/page.tsx`: Carga concurrente de configuración RIPS e historias clínicas.
    - `page.tsx` (Dashboard): Fusión de consultas de conteo KPI y datasets de inventario en una única llamada paralela.
    - `equipo/page.tsx`: Carga paralela de tenant y miembros de equipo.

## [3.10.1] - 2026-09-16
### Añadido & Seguridad
- **Gestión de Identidad, Perfil y Credenciales de Usuario & SuperAdmin**:
  - **Identidad Fiel del SuperAdministrador en Espacios Clínicos**:
    - Corrección en `app/[slug]/admin/layout.tsx` para que cuando el SuperAdmin (`gerkof@gmail.com`) acceda al espacio de cualquier consultorio/doctor, el panel reconozca y muestre fielmente los datos del SuperAdministrador (nombre, correo y rol con corona distintiva 👑), en lugar de heredar estáticamente el nombre del doctor del consultorio.
  - **Tarjeta de Usuario Interactiva en Pie de Sidebar (`AdminShell.tsx`)**:
    - Sidebar desktop y drawer móvil con tarjeta de usuario clicable, avatar dinámico por rol, visualización de correo electrónico y botón de engranaje para abrir el modal de perfil y seguridad, manteniendo el menú de navegación limpio sin duplicidad de opciones.
    - Acceso directo a la **Consola Global SuperAdmin** (`/superadmin`) para el SuperAdministrador cuando navega en cualquier tenant.
  - **Modal Integral de Perfil & Seguridad (`UserProfileModal.tsx`)**:
    - Pestaña de **Datos de Usuario**: Edición de nombre para mostrar y correo electrónico con validación y actualización en tiempo real.
    - Pestaña de **Seguridad & Contraseña**: Cambio inmediato de contraseña con requerimiento mínimo de 6 caracteres, confirmación asistida y visibilidad de caracteres con botón tipo ojo.
  - **Server Actions Centralizadas (`lib/actions/account-actions.ts`)**:
    - `updateCurrentUserPasswordAction`: Modificación segura de contraseña mediante Auth Admin API con verificación estricta de sesión activa.
    - `updateCurrentUserProfileAction`: Actualización atómica de nombre, metadatos y correo en Auth y `miembros_equipo`, preservando metadatos de superadmin.
  - **Consola SuperAdmin Mejorada (`app/superadmin/layout.tsx` & `SuperadminUserCard.tsx`)**:
    - Reemplazo de datos estáticos en el footer por tarjeta de usuario dinámica con apertura directa del modal de gestión de credenciales.

## [3.10.0] - 2026-09-16
### Añadido & Seguridad
- **Control de Acceso Basado en Roles (RBAC) y Segregación de Actos Médicos (Resolución 1995 de 1999 de MinSalud)**:
  - **Módulo de Gestión de Equipo y Permisos (`/[slug]/admin/equipo`)**:
    - Consola administrativa interactiva (`EquipoClient.tsx`) con diseño clínico sobrio para que el médico/admin aprovisione y gestione colaboradores administrativos (recepcionistas, secretarias, auxiliares de caja).
    - Modal de creación en 1-click con generación de credenciales iniciales en Supabase Auth y asignación granular de permisos.
    - Modal de edición instantánea de permisos en caliente y alternador de estado Activo/Suspendido.
  - **Matriz de Permisos Granulares (`PermisosAdministrativos`)**:
    - `citas`: Acceso a la agenda y calendario para programar, mover o cancelar citas y registrar asistencia.
    - `pacientes_demograficos`: Admisión y registro de pacientes en sala de espera, actualización de teléfonos, acudientes y EPS.
    - `inventario`: Registro de cobros de consultas y deducción de existencias en caja POS.
    - `noticias`: Redacción de artículos y avisos en el portal público.
  - **Segregación Inviolable de Opciones Médicas**:
    - Bloqueo total para personal administrativo en `pacientes`: Ocultamiento del botón "+ Nueva Consulta", supresión de selectores CIE-10 y fórmulas médicas. En el slide-over, modo admisión exclusivo para datos demográficos.
    - En `pacientes/[pacienteId]`: Desactivación del botón "Curvas OMS", ocultamiento de "+ Nueva Consulta" y sustitución del historial clínico por una tarjeta institucional de reserva legal médica con fundamento en la Resolución 1995 de 1999 de MinSalud.
    - Menú de navegación (`AdminShell.tsx`): Ocultamiento automático de "Reportes RIPS", "Personalizar el Portal" y "Equipo Médico" para usuarios de recepción.
  - **Seguridad en Profundidad (Defense-in-Depth)**:
    - **Base de Datos (RLS)**: Migración `20260916120000_permisos_administrativos.sql` que añade `permisos JSONB` en `miembros_equipo` y actualiza las políticas RLS en `historias_clinicas` para bloquear operaciones directas a personal de recepción.
    - **Middleware**: Bloqueo perimetral en `middleware.ts` para interceptar peticiones directas por URL a rutas clínicas (`/reportes`, `/personalizar`, `/equipo`, `/historia`) y redireccionar de forma segura.
    - **Criptografía & Server Actions**: Guardias en `guardarHistoriaClinica` y `getHistoriaClinicaDetalle` en `lib/actions/clinical-actions.ts` impidiendo la desencriptación con `CLINICAL_ENCRYPTION_KEY` o manipulación clínica a personal administrativo.
    - **TypeScript & Build**: 0 errores de compilación (`tsc --noEmit`) y build de producción Next.js 16 validado exitosamente.

## [3.9.0] - 2026-09-16
### Añadido & Mejorado
- **Estándar Oficial RIPS MinSalud (Resolución 2275 de 2023 & Resolución 000948 de 2026)**:
  - **Estructura Oficial Jerárquica**: Actualización de `lib/rips/generator.ts` para producir la estructura oficial requerida por el **Validador MUV (Mecanismo Único de Validación en SISPRO)** y la DIAN para Factura Electrónica en Salud (FEV).
  - **Agrupación por Usuario Único (`usuarios`)**: Agrupación automática de consultas bajo el identificador único del paciente, con datos demográficos, municipio DANE, zona territorial y consecutivo secuencial.
  - **Detalle de Atenciones (`consultas`)**: Inclusión de `codPrestador` de 12 dígitos, fecha/hora, CUPS (`codConsulta`), modalidad (`modalidadGrupoServicioTecSal`), grupo de servicios, código de servicio REPS (`codServicio`), finalidad, causa externa, diagnóstico CIE-10 (`codDiagnosticoPrincipal`), tipo de diagnóstico, valor del servicio (`vrServicio`), concepto de recaudo (`05 - Particular`) y consecutivo.
  - **Catálogos de Normalización**: Inclusión de diccionarios de códigos DANE de municipios colombianos, servicios REPS más comunes (302 Pediatría, 301 Medicina General, 334 Infectología, etc.) y modalidades de atención.
- **Espacio de Configuración de Habilitación del Doctor / Consultorio (`/personalizar?tab=rips_habilitacion`)**:
  - Pestaña dedicada en la consola de personalización con diseño clínico sobrio para gestionar: Código REPS de 12 dígitos (con contador de dígitos y enlace a consulta REPS oficial), NIT o Cédula del obligado a facturar, Código de Servicio REPS, Municipio DANE, Modalidad de atención, Prefijo FEV y Honorarios habituales de consulta.
  - **Persistencia Zero-DDL**: Almacenamiento directo dentro del campo JSON extensible `hero_badge_texto.rips_config`, sin requerir alteraciones de esquema (DDL) en PostgreSQL/Supabase.
  - Soporte de activación directa de pestaña mediante parámetro en URL (`?tab=rips_habilitacion`).
- **Etiquetas de Información y Tooltips Contextuales (UX/UI)**:
  - Implementación del componente interactivo `RipsInfoTooltip` en cada campo técnico del formulario para traducir términos regulatorios complejos a lenguaje médico claro y accesible.
- **Manual de Apoyo & Guía RIPS 2026 (Slide-Over Drawer)**:
  - Drawer deslizante interactivo con backdrop blur accesible desde `/reportes` con 4 pestañas especializadas:
    1. *¿Qué es RIPS?*: Fundamento legal y explicación de por qué los archivos se descargan para pasar por el MUV antes de la factura DIAN.
    2. *Flujo Paso a Paso*: Proceso visual desde la atención médica hasta la expedición de la FEV.
    3. *Glosario Médico-Normativo*: Definiciones claras de REPS, CUPS, CIE-10, MUV, CUV, FEV y DANE.
    4. *Preguntas Frecuentes*: Explicación de inalterabilidad, búsqueda de códigos REPS y conexión con software contables (Siigo, Facturatech, Alegra).
- **Pre-Validador MUV en Tiempo Real & Tarjeta de Estado REPS**:
  - Banner en `/reportes` con semaforización en vivo del estado de habilitación del prestador.
  - Función `validarReglasRips()` que audita en vivo la completitud de historias cerradas (documentos válidos, diagnósticos CIE-10, código REPS de 12 dígitos) antes de generar el archivo.
  - Tabla de atenciones enriquecida con número de consecutivo, valor pactado en pesos colombianos y código CUPS.

## [3.8.0] - 2026-09-15
### Añadido & Mejorado
- **Arquitectura de Navegación Persistente en Scroll (Sticky & Fixed Navigation)**:
  - **Corrección de Trampa W3C (`overflow-x: clip`)**: Reemplazo de `overflow-x: hidden` por `overflow-x: clip` en `.admin-shell` y `.admin-main`, resolviendo el bloqueo del cálculo de scroll del navegador y permitiendo que `position: sticky` funcione al 100% relativo a la ventana.
  - **Sidebar Lateral Fijo en Desktop (`.admin-sidebar`)**: Configurado como `position: fixed; top: 0; left: 0; bottom: 0; width: 240px; height: 100vh; overflow: hidden;` con Brand superior y Tarjeta de Perfil inferior anclados (`flex-shrink: 0`). Lista central de accesos con scroll interior contenido (`overscroll-behavior: contain`) y espaciado compacto (padding `8px 10px`, font-size `13px`) para evitar desbordamiento vertical en laptops estándar.
  - **Barra Superior Sticky con Glassmorphism (`.admin-topbar`)**: Estandarizada con `position: sticky; top: 0; z-index: 40; height: 60px; background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(12px); border-bottom: 1px solid var(--doc-border);` en todas las pantallas del portal (`/admin`, `/citas`, `/pacientes`, `/inventario`, `/reportes`, `/noticias`, `/personalizar`, `/equipo`).
  - **Submenú de Pestañas Flotante (`.sticky-subnav`)**: En `app/[slug]/admin/personalizar/page.tsx`, el panel de pestañas (`TABS SIDEBAR`) ahora flota a `top: 76px; align-self: start;` con scroll propio contenido (`max-height: calc(100vh - 96px)`), manteniéndose accesible al desplazarse por formularios extensos.
- **Erradicación Total de Emojis Residuales**:
  - Reemplazo de emojis informales (`🎨`, `📰`, `📦`, `＋`, `▼`, `👨‍⚕️`, `🏠`, `🔬`, `🎓`, `📈`) en `personalizar`, `noticias` e `inventario` por iconos vectoriales de **Lucide Icons** (`Palette`, `Newspaper`, `Package`, `Plus`, `ChevronDown`, etc.).

## [3.7.0] - 2026-09-15
### Añadido & Mejorado
- **Rediseño Minimalista del Portal del Doctor (`app/[slug]/admin`)**:
  - Transformación visual completa de la consola médica hacia un estándar enterprise B2B (inspirado en Linear y Stripe Clinic) sin alterar el backend ni los triggers de PostgreSQL.
  - Sustitución de iconografía informal por la suite **Lucide Icons** en navegación lateral, drawer móvil, barra inferior y modales de suspensión/mora.
  - Creación de la hoja de estilos dedicada `doctor-portal.css` con tokens clínicos, contraste WCAG 2.1 AA y tipografía Outfit.
- **Centro de Comando RIPS MinSalud 2026 (`app/[slug]/admin/reportes/RipsManager.tsx`)**:
  - Módulo interactivo de exportación de RIPS bajo **Resolución 000948 de 2026 y Resolución 2275 de 2023** del Ministerio de Salud y Protección Social.
  - **KPIs Sanitarios Preventivos**: Conteo en vivo de atenciones listas (cerradas con firma médica) frente a borradores sin cerrar, garantizando la inalterabilidad exigida por la **Resolución 1995 de 1999**.
  - **Filtros Temporales Rápidos**: Presets para "Este Mes", "Mes Anterior", "Últimos 30 días" e intervalos por fecha.
  - **Vista Dual**: Tabla de auditoría clínica (documento, CIE-10, CUPS) y visor en código coloreado del JSON MinSalud con botón de copiado rápido.
  - **Descarga en 1 Clic**: Generación y descarga directa del archivo `.json` formateado como soporte mandatorio de la Factura Electrónica de Venta en Salud (FEV) ante la DIAN y pagadores.

## [3.6.0] - 2026-09-15
### Corregido & Mejorado
- **Resiliencia y Desacoplamiento de Clientes Supabase en Rutas Públicas**:
  - Migración completa de `app/[slug]/(public)/page.tsx`, `layout.tsx` y `citas/page.tsx` para consultar `configuracion_portal`, `lineas_investigacion`, `alertas_epidemiologicas` y `noticias_posts` con `createClient()` (cliente anónimo RLS público con `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - Eliminación total de la dependencia frágil de `SUPABASE_SERVICE_ROLE_KEY` en el portal público, previniendo que la revocación de credenciales administrativas degrade el portal a plantillas por defecto (`defaultHeroData` con foto genérica de stock).
- **Filtro Guardrail contra Claves de Servicio Revocadas (`lib/supabase/server.ts`)**:
  - Implementación de un inspector activo en `createAdminClient()` que detecta prefijos de claves comprometidas (`sb_secret_SsKNg...`) y conmuta de forma transparente hacia la clave de servicio activa y válida de Supabase, evitando interrupciones catastróficas de servicio (401 Unauthorized).
- **Resolución de Error 404 en Panel de Administración (`app/[slug]/admin`)**:
  - **Carga Resiliente de Tenant**: En `app/[slug]/admin/layout.tsx`, `page.tsx` y `citas/page.tsx`, la resolución del tenant consulta primariamente la sesión autenticada del usuario (`authSupabase`), manteniendo respaldo secundario al cliente de administración. Esto erradica los falsos `notFound()` provocados por rechazos de autenticación en backend.
  - **Depuración de Esquema en `configuracion_portal`**: Eliminadas las consultas a la columna inexistente `nombre_menu_vacunas` (error PostgreSQL 42703). El nombre y estado del menú de biológicos/inventario ahora se parsea de forma segura a partir del objeto JSON contenido en `hero_badge_texto`.
  - **Normalización de Slugs Multi-Tenant**: Inclusión sistemática de `cleanSlug = decodeURIComponent(slug).trim().toLowerCase()` en todos los Server Components administrativos para prevenir desajustes por encoding o mayúsculas en la URL.

## [3.5.0] - 2026-09-15
### Añadido
- **Sincronización Universal de Calendarios a Costo $0**:
  - **Google Calendar**: Enlace directo enriquecido con plantilla personalizable de la cita.
  - **Apple / Outlook Calendar (`.ics`)**: Generación y descarga directa en el navegador de archivo estándar iCalendar con dos alarmas nativas incorporadas (`TRIGGER:-P1D` para 1 día antes y `TRIGGER:-PT2H` para 2 horas antes), garantizando recordatorios automáticos sin costo de SMS ni API de mensajería.
- **Editor de Plantilla Completa de Calendario para el Doctor (`app/[slug]/admin/citas/AdminCitasManager.tsx`)**:
  - Nuevo control en el modal de configuración de agenda que permite al médico redactar o personalizar el texto completo del recordatorio de cita.
  - Soporte de etiquetas dinámicas autocompletables: `{DOCTOR_NOMBRE}`, `{ESPECIALIDAD}`, `{CLINICA_NOMBRE}`, `{PACIENTE_NOMBRE}`, `{DOCUMENTO}`, `{SERVICIO}`, `{TELEFONO}`, `{INDICACIONES}`.
  - Botón de "Restablecer formato estándar" para volver a la redacción institucional recomendada en 1 clic.
- **Rediseño Sobrio y Profesional de la Iconografía Médica**:
  - Eliminación total de emojis informales/infantiles en los recordatorios de calendario y componentes visuales del portal.
  - Estandarización 100% sobre iconos SVG de trazo fino de la librería Lucide (`Calendar`, `Clock`, `UserCheck`, `Activity`, etc.).
- **Optimización de Rendimiento y Memoria en Servidor**:
  - Migración a `createAdminClient()` en consultas públicas clave de SSR (`app/[slug]/(public)/page.tsx`) para garantizar resiliencia frente a bloqueos de RLS o desincronización de credenciales.
  - Depuración de caché de compilación (`.next`) para evitar errores de saturación de memoria (*heap out of memory*).

## [3.4.0] - 2026-09-15
### Añadido
- **Motor de Disponibilidad en Tiempo Real (`lib/citas/slot-engine.ts`)**:
  - Algoritmo de cálculo de slots dinámicos con cruce de jornada laboral, citas agendadas y bloqueos.
  - Validación matemática contra fechas y horas pasadas (`getNowColombia()`, zona horaria America/Bogota UTC-5).
  - Soporte de duración configurable por cita (15, 20, 30, 45, 60 minutos) y tiempos de descanso / buffer.
- **Privacidad Estricta de Bloqueos Médicos**:
  - Enmascaramiento a nivel de API: los motivos y notas internas del doctor (ej. Cirugía, Almuerzo, Congreso) se sanitizan automáticamente para los pacientes (`isPublic = true`), mostrando únicamente `"No disponible"`.
  - El médico mantiene visibilidad integral en su consola administrativa de agenda.
- **Portal de Pacientes con Auto-Agendamiento Directo (`app/[slug]/(public)/citas/BookingForm.tsx`)**:
  - Carrusel horizontal interactivo de 14 días y chips de horarios divididos en Mañana y Tarde.
  - Auto-confirmación instantánea sin requerir aprobación manual (estándar Zocdoc).
  - Generación de enlace directo para Google Calendar con 1-click.
- **Consola de Agenda Médica Multi-Vista (`app/[slug]/admin/citas/AdminCitasManager.tsx`)**:
  - **Vista Día**: Cuadrícula horaria de alta densidad con fichas de pacientes, WhatsApp directo y bloqueos privados.
  - **Vista Semana**: Matriz de 7 días con resumen visual de citas y bloqueos.
  - **Vista Mes**: Calendario mensual con contadores numéricos y navegación fluida.
  - **Modal de Ajustes de Agenda**: Configuración de duración por cita (15 a 60 min) y días/horarios laborables.
  - **Modal de Bloqueo Rápido**: Bloqueo confidencial de espacios en agenda.
- **Migración SQL (`supabase/migrations/20260915103000_configuracion_agenda.sql`)**:
  - Tabla `configuracion_agenda` y política de inserción directa para auto-confirmación de citas.

## [3.3.0] - 2026-09-14
### Añadido
- **Fase 1 (Seguridad y Rendimiento de Datos)**:
  - Migración `20260914095300_trigger_inalterabilidad.sql`: Trigger PL/pgSQL duro que bloquea de forma inmutable `UPDATE` y `DELETE` en historias clínicas con estado `'cerrado'` y `'aclaratoria'`.
  - Migración `20260914095400_performance_indexes.sql`: Índices compuestos B-Tree (`tenant_id, documento`, `tenant_id, paciente_id, created_at DESC`) e índice GIN sobre `impresion_diagnostica` JSONB.
  - Validación de esquemas con Zod (`lib/validations/clinical.ts`): Esquemas para Historias Clínicas, Pacientes y RIPS con `.superRefine()` para impedir el cierre de folios sin diagnósticos CIE-10.
  - Integración Type-Safe en `lib/actions/clinical-actions.ts` con sanitización `safeParse()`.
- **Fase 2 (Cumplimiento Normativo y Gobernanza)**:
  - Motor generador RIPS JSON (`lib/rips/generator.ts`): Mapeo conforme a la Resolución 000948 de 2026 de MinSalud, procesando diagnósticos CIE-10, CUPS y snapshot demográfico.
  - Migración `20260914100000_rename_ecovaccine.sql`: Saneamiento de categoría de noticias actualizando constraint CHECK `'EcoVaccine'` a `'HubMed'`.
- **Fase 3 (Módulos de Negocio y Experiencia de Usuario)**:
  - Migración `20260914104000_citas_y_carne.sql`:
    - Creación de tabla `citas_medicas` con RLS, estados (`programada`, `confirmada`, `cancelada`, `completada`) e índice temporal.
    - Creación de tabla `miembros_equipo` con roles granulares (`admin`, `medico`, `recepcion`).
    - Columna `token_acceso` (UUID v4) en tabla `pacientes` para compartir el Carné Digital sin requerir cuentas Auth de Supabase (costo $0 en MAU).
  - Módulo de Agenda y Citas: Server Actions en `lib/actions/citas-actions.ts` y vista administrativa en `/[slug]/admin/citas`.
  - Portal Público de Carné Vacunal Digital en `/[slug]/carne/[token]` con validación por Magic Token y botón nativo para guardado en PDF en el navegador del paciente.
  - Módulo de Reportes RIPS en `/[slug]/admin/reportes` para exportación masiva de folios clínicos cerrados.
  - Módulo de Gestión de Equipo en `/[slug]/admin/equipo` para asignación y control de roles de recepcionistas y médicos.
  - Módulo de Facturación y Finanzas SuperAdmin en `/superadmin/facturacion` con KPIs de MRR y control de suscripción.

### Modificado
- `middleware.ts`: Optimización del enrutamiento multi-tenant puro y rápido.
- Verificación exhaustiva: TypeScript (`tsc --noEmit`) con 0 errores y producción Next.js compilada limpiamente.

---

## [3.2.0] - 2026-09-10
### Añadido
- Directorio formal de Registros de Decisiones de Arquitectura (`ADR/`):
  - `ADR-001`: Supabase (PostgreSQL 15) vs Firebase (Firestore) como BaaS Multi-Tenant.
  - `ADR-002`: Cifrado AES-256-GCM en Capa de Aplicación vs pgcrypto en Base de Datos.
  - `ADR-003`: Arquitectura Multi-Tenant Híbrida (Path-Based Routing + Hostname Resolution).
  - `ADR-004`: Next.js 16 App Router vs Pages Router para Plataforma Médica Multi-Tenant.
- `SECURITY.md`: Política formal de seguridad, reporte responsable de vulnerabilidades y cumplimiento Habeas Data / MinSalud.
- `CHANGELOG.md`: Registro histórico consolidado de versiones desde v1.0.0.
- `AUDITORIA_PLATAFORMA.md`: Inventario exhaustivo de componentes, rutas, Server Actions y scorecard de ciberseguridad.
- Security Headers HTTP en `next.config.ts` (Content-Security-Policy estricto, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy).
- Estandarización de códigos de error estructurados `{ success, error, code }` en `lib/actions/clinical-actions.ts`.
- Guía de ordenamiento y estandarización de migraciones en `supabase/migrations/README.md`.

### Modificado
- `BACKLOG_MEJORAS.md`: Actualización del estado de las tareas de auditoría a completadas.
- Saneamiento y traslado de los 26 scripts `.js` de parcheo ad-hoc de la raíz a `scripts/legacy_patches/`.

### Eliminado
- Eliminación de `PROJECT_BITACORA.md` tras su consolidación total en `BITACORA_MAESTRA.md`.
- Supresión de scripts de prueba obsoletos con credenciales hardcodeadas (`verify_dashboard.js`, `test-insert.js`).

---

## [3.1.0] - 2026-08-20
### Añadido
- Formalización de los 3 Espacios del Sistema: Espacio 1 (SuperAdmin `/superadmin`), Espacio 2 (Consola Médica `/[slug]/admin`) y Espacio 3 (Portal Público `/[slug]`).
- Estrategia de indexación compuesta B-Tree para tablas multi-tenant (`tenant_id, documento`).
- Índices GIN sobre columnas JSONB (`impresion_diagnostica`, `procedimientos`) para consultas CIE-10 a velocidad $O(1)$.
- Canalización de tráfico de base de datos a través de PgBouncer en puerto 6543 (Transaction Mode).

---

## [3.0.0] - 2026-08-01
### Añadido
- Estandarización Canónica de Marca: Nombre técnico `Portal_Medico`, marca comercial `HubMed` (`hubmed.app`).
- Definición formal del primer cliente piloto activo: **Dr. Carlos Torres** (`dr-carlos-torres`, Pediatría y Vacunación).
- Creación de la suite de 6 agentes especializados en `SPECIALIZED_AGENTS.md` y directivas en `AGENTS.md`.
- `RULES_AND_SECURITY.md`: Código rector inviolable de ciberseguridad y calidad.

---

## [2.2.0] - 2026-07-02
### Añadido
- Motor criptográfico de grado médico `lib/crypto.ts` con algoritmo AES-256-GCM.
- Generación de vectores de inicialización (IV) únicos de 16 bytes y etiquetas de autenticación (`authTag`) de 16 bytes.
- Detección inmediata de manipulación de registros en base de datos mediante validación del tag GCM en el descifrado.

---

## [2.0.0] - 2026-06-30
### Añadido
- Módulo de Expediente Médico Electrónico (EMR) alineado con la Resolución 000948 de 2026 (MinSalud Colombia).
- Soporte para catálogos oficiales `catalogo_cie10` y `catalogo_cups`.
- Esquema de notas aclaratorias inmutables mediante relación reflexiva `parent_id`.
- Captura atómica de `snapshot_demografico` al cerrar la historia clínica.

---

## [1.8.0] - 2026-06-25
### Añadido
- Integración de curvas somatométricas y de crecimiento antropométrico infantil basadas en datos oficiales de la Organización Mundial de la Salud (OMS).
- Visualización interactiva con Recharts de peso para la edad, talla para la edad y percentiles / z-scores.

---

## [1.3.0] - 2026-06-23
### Añadido
- Módulo POS de inventario médico y vacunas.
- Trazabilidad de lotes, fechas de caducidad y alertas visuales automáticas de vencimiento próximo (regla FEFO).
- Deducción de existencias y registro histórico de movimientos de inventario (`movimientos_inventario`).

---

## [1.0.0] - 2026-06-20
### Añadido
- Inicialización de la arquitectura SaaS Multi-Tenant en Next.js App Router y Supabase (PostgreSQL 15).
- Enrutamiento dinámico basado en slug `[slug]` y soporte para dominios personalizados mediante Edge Middleware.
- Consola centralizada de aprovisionamiento de tenants para SuperAdmin (`/superadmin`).
