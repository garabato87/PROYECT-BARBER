# Feature — Página pública Para negocios VANITY

Estado: STEPs 1 y 2 implementados y validados en alcance; pendiente de aceptación final del propietario.
Proyecto: PROYECT-BARBER. Clasificación: FEATURE / UI/UX.

## Objetivo y diseño

Crear `/para-negocios`, accesible desde “Sumar mi negocio”, tomando como base el modelo 01 (producto), la presentación editorial del modelo 02 y un contacto para alta asistida inspirado en el modelo 03.

Reutilizar ExploreLayout, BrandLogo, Inter, temas y tokens existentes. No copiar controles del prototipo ni insertar turnos ficticios como si fueran datos reales o capturas del producto.

Contenido: presentación clara; agenda, servicios y profesionales; recorrido del cliente; explicación del alta asistida; preguntas frecuentes; contacto final. Sin precios, pruebas gratuitas, promesas financieras o tiempos de respuesta inventados. Usar VANITY para negocios, sin introducir un plan PRO no definido.

## Discovery verificado

- HomePage dirige actualmente “Sumar mi negocio” a `/register`.
- App.tsx no tiene una ruta para negocios.
- ExploreLayout ya aporta navegación horizontal, sesión y temas.
- No se encontró un canal comercial ni un servicio de recepción de solicitudes en las superficies inspeccionadas.
- Hay numerosos cambios locales previos: conservarlos y editar únicamente fragmentos necesarios.
- Tests disponibles: Vitest y Testing Library. Scripts: test, lint y build; build incluye chequeo TypeScript.

## Requisitos

1. Ruta pública `/para-negocios`, independiente de sesión, sin cambios de roles ni permisos.
2. Botón del home enlaza a la nueva página; ajustar su texto descriptivo para no prometer finanzas o automatización no verificadas.
3. Navegación de vuelta al home y anclas accesibles a funcionalidades, preguntas y contacto.
4. Página responsive, ambos temas, labels, foco visible y movimiento reducido.
5. Preguntas frecuentes mediante controles semánticos; respuestas verificadas.
6. Contacto real: no mostrar éxito sin envío, guardar solicitudes sin autorización ni usar un formulario demostrativo en producción.
7. Si se acuerda email/WhatsApp, el formulario prepara un mensaje y abre ese canal con confirmación final del usuario. No afirmar que el mensaje fue enviado. Si se requiere almacenamiento en Firebase, tratar backend, reglas, prevención de abuso y acceso administrativo como alcance adicional aprobado.
8. No publicar, instalar dependencias ni modificar reglas de seguridad como parte de la página.

## STEP 1 — Página pública e integración

Entrada: `APPROVED STEP 1` para esta feature.
Archivos previstos: nueva página y sus tests, App.tsx, bloque comercial de HomePage; ExploreLayout solo si necesita un enlace compartido.
Entregable: presentación, funcionalidades verificadas, recorrido de reserva, preguntas frecuentes, navegación y sección de contacto dependiente del canal acordado. Mientras falte canal, no publicar un botón de envío inoperante ni declarar la feature terminada.
Pruebas: render público, navegación del CTA, contenidos y preguntas, revisión móvil/escritorio y claro/oscuro; lint acotado y build, diferenciando fallos previos.
Revisión: ECC y UI/UX Pro Max según instrucciones locales; preservar código previo.
HARD STOP al terminar. No continuar al STEP 2 sin su aprobación.

## STEP 2 — Contacto de alta asistida y QA

Entrada: `APPROVED STEP 2` y canal/destinatario confirmado.
Formulario propuesto: nombre, negocio, rubro y contacto. Recoger solo datos necesarios. Aclarar qué acción ejecuta el botón y quién recibe la solicitud.
Pruebas: campos requeridos, validación, codificación del mensaje, destino correcto, ausencia de envíos automáticos y mensajes de estado veraces; regresión del home y navegación por rol.
HARD STOP y aceptación final; no deploy implícito.

## Definition of Done

- Ruta y CTA correctos, identidad VANITY coherente y página accesible/responsive.
- Contenido real sin precios, testimonios o capacidades inventadas.
- Contacto funcional con destinatario confirmado; no solicitudes simuladas.
- Tests/revisión completados, límites y fallos previos documentados.
- Cambios locales preservados y evidencia de aprobación por STEP.

## Convención de aprobación

Seguir el workflow local: `APPROVED STEP X` autoriza ejecutar ese STEP X, no el siguiente. Aprobaciones de features anteriores no se reutilizan.

## Decisión pendiente

Confirmado: solicitudes por email a ayuda.vanity@gmail.com mediante correo preparado en el dispositivo del visitante. Una bandeja interna de solicitudes requiere planificación separada de datos, seguridad y administración.

## Evidencia STEP 1 — implementado el 2026-09-17

Autorización recibida: APPROVED STEP 1. Destinatario confirmado: ayuda.vanity@gmail.com.

- Nueva página pública BusinessLandingPage.tsx y estilos acotados BusinessLandingPage.css.
- Ruta /para-negocios en App.tsx y CTA de HomePage integrado.
- Contenido de home ajustado: sin promesa de finanzas/automatización ni plan PRO no definido.
- Contacto básico mailto: abre el correo con destinatario y asunto; no envía automáticamente. Formulario de solicitud reservado para STEP 2.
- Tests: 3/3 aprobados. RED inicial: import de página ausente. GREEN: contenido, contacto y FAQ.
- ESLint acotado de nuevos TSX: PASS.
- Build y TypeScript: PASS. Advertencia de chunks grandes en módulos existentes.
- Browser: ruta pública, retorno a home y CTA hacia /para-negocios verificados. Inspección escritorio oscuro y móvil claro. Ancla contacto correcta; ancho contenido/documento iguales en viewport móvil de 390 px.
- Revisión independiente React: sin bloqueantes nuevos. Corregidos typo CSS y referencia PRO.
- Sin envío real de email, deploy, commits ni cambios a datos/reglas.
- Suite global y E2E automatizado no ejecutados. No se certifica auditoría WCAG completa. Limitaciones previas de ExploreLayout (perfil por hover y labels móviles ausentes) documentadas fuera de alcance.
- Se preservaron cambios locales previos. No se crearon checkpoints Git de una base con trabajo ajeno mezclado; evidencia RED/GREEN conservada aquí.

HARD STOP: STEP 2 requiere APPROVED STEP 2.

## Evidencia STEP 2 — 2026-09-17

Autorización: APPROVED STEP 2. Formulario público con nombre, negocio, rubro y email. Validación con mensajes por campo, foco en primer error, previsualización del mensaje y enlace mailto con asunto/cuerpo codificados. No usa base de datos, almacenamiento local, API ni envío automático. Cambiar un campo invalida el mensaje preparado para evitar datos desactualizados.

- Componente BusinessContactForm.tsx y tests; integración en BusinessLandingPage; CSS acotado y tests de página actualizados.
- RED: test falló antes de existir el componente. GREEN: tests del formulario y página pasan.
- Lint acotado y build/typecheck: PASS. Persiste advertencia de chunk grande en módulo existente.
- Navegador: preparación con datos ficticios y destino/cuerpo verificados sin abrir correo ni enviar. Vista móvil 390 px sin overflow horizontal (scrollWidth = clientWidth). Datos de prueba retirados mediante recarga.
- Revisión React independiente: sin issues nuevos concretos.
- No hay garantías de recepción: el visitante debe confirmar envío en su cliente de email; alternativa de copiar mensaje/dirección si mailto no tiene manejador.
- No deploy, cambios de permisos, dependencias, credenciales o reglas. Suite global/E2E automatizado y auditoría WCAG completa no ejecutados. Validación de otros roles sin cambios respecto a STEP 1; no se realizaron nuevos recorridos con cuentas privilegiadas.

HARD STOP: pendiente de aceptación final. Despliegue requiere autorización separada.
