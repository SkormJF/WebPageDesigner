# Flujo del Cuestionario

Haz las preguntas de forma conversacional por rondas. No leas este archivo en voz alta — usalo como guia. Adapta las frases para que se sientan naturales. Despues de cada ronda, resume lo que escuchaste antes de avanzar.

Cuatro rondas, cada una con un tema claro: quien sos (1) -> que dice la pagina (2) -> como se comporta, solo si aplica (3) -> como se ve, de lo rapido a lo profundo (4).

**Guarda a medida que avanzas.** Apenas la Ronda 1 te da el nombre del negocio, crea `site/PROJECT-BRIEF.md` (plantilla en `CLAUDE.md`, Fase 3 Paso 1) con lo que ya sabes y el resto marcado `[pendiente]`. Actualizalo al cerrar **cada** ronda, y deja `## Current Phase` diciendo en que ronda vas. Esta conversacion es el tramo mas largo de todo el flujo -- si la sesion se corta y no quedo nada escrito, se pierde y hay que preguntar todo de nuevo.

---

## Ronda 1: Lo Basico (siempre preguntar)

1. **Esto es una pagina de presentacion, o necesita funcionalidad real — cuentas de usuario, un panel privado, datos que cada quien ve distinto?**
   - Pregunta base, siempre primero. La respuesta decide si esta conversacion va a incluir tambien la Ronda 3 (Flujo Funcional) mas adelante — nunca se infiere a mitad de camino.
   - Si la respuesta es ambigua o el usuario no esta seguro, seguir con ejemplos concretos: "algo como necesitar que la gente inicie sesion, o que cada quien vea su propia informacion?"
   - Si apunta a funcionalidad real, aplicar la confirmacion explicita de `CLAUDE.md` (Full-Stack Extension → Detection) aqui mismo, antes de seguir con la Ronda 1.

2. **Como se llama tu negocio o proyecto?**
   - Obligatorio. Sin default.

3. **En una oracion, a que se dedican?**
   - Default: Inferir del nombre y el contexto.

4. **A quien quieres llegar?**
   - Default: "Audiencia general"
   - Si es vago, pregunta: "Son mas bien profesionales jovenes, familias, duenos de negocios...?"

Despues de la Ronda 1, resume: "Perfecto — [negocio] ayuda a [audiencia] con [servicio]. Ahora hablemos de que quieres decir en la pagina."

---

## Ronda 2: Contenido

5. **En que idioma quieres la pagina?**
   - Default: Mismo idioma en el que el usuario ha estado hablando.
   - Nota: Todo el contenido (titulos, texto, CTAs, meta tags) sera en el idioma elegido — se pregunta primero en esta ronda para que el resto del contenido se piense ya en ese idioma.

6. **Cual es la accion principal que quieres que hagan los visitantes?**
   - Ejemplos: registrarse, agendar una llamada, comprar algo, saber mas, pedir una cotizacion.
   - Default: "Saber mas / ponerse en contacto."

7. **Cuales son 3-4 cosas clave que quieras destacar?**
   - Estas se convierten en la seccion de servicios/caracteristicas.
   - Default: Generar de la descripcion del negocio + normas de la industria.

8. **Quieres un formulario de contacto en la pagina?**
   - Si quiere: Que campos? (Nombre, email, mensaje es lo estandar. Telefono? Empresa?)
   - Opciones:
     - **Simple (default):** Un enlace "mailto:" con estilo de seccion de contacto — no necesita backend.
     - **Formulario con Formspree:** Servicio gratuito, sin backend. Dile al usuario: "Ve a formspree.io, crea una cuenta gratis, crea un formulario, y dame el form ID (se ve asi: 'xpznqkdl')." Si no quiere hacerlo ahora, usa mailto: como default y deja un comentario TODO.
   - Si solo quiere un link de email o telefono, tambien funciona.

9. **Tienes un eslogan o frase?**
   - Default: Escribir uno. Pasar por humanizalo.

10. **Tienes testimonios, resenas o prueba social?**
    - Default: Crear una seccion de testimonios con placeholders. Usar nombres realistas pero claramente de ejemplo.

11. **Tienes redes sociales para incluir?**
    - Instagram, X/Twitter, Facebook, LinkedIn, TikTok, YouTube, etc.
    - Default: Iconos de redes sociales en el footer como placeholder — el usuario llena las URLs despues.

Despues de la Ronda 2, resume: "Ya tengo todo el contenido." Si el proyecto es Full-Stack Extension (confirmado en la pregunta 1): "Ahora quiero entender bien como deberia funcionar por dentro." -> segui a la Ronda 3. Si no: "Ahora hablemos de como se ve." -> saltate la Ronda 3 y segui directo a la Ronda 4.

---

## Ronda 3: Flujo Funcional (solo si la pregunta 1 confirmo Full-Stack Extension)

Esta ronda no es una lista fija de preguntas para leer una por una -- es abierta a proposito. Las reglas de negocio reales (que en Njord solo salieron de que el usuario uso la app de verdad, ej. "Movimientos pasa a ser solo debitos") se sacan mejor dejando que el usuario cuente el flujo con sus propias palabras, no interrogandolo con un checklist.

1. **Arranca con una pregunta abierta, sin interrumpir:** "Contame como te imaginas el flujo completo, de principio a fin -- quien entra, que hace, que ve cada quien." Dejalo contar antes de preguntar nada puntual.

2. **De lo que cuente, saca preguntas de seguimiento concretas** hasta cubrir:
   - Entidades/tablas principales y como se relacionan entre si
   - Roles (quien ve/hace que)
   - Estados por los que pasa un registro (ej. pendiente -> aprobado -> suspendido)
   - Valores calculados/derivados que deben mantenerse correctos cuando algo relacionado cambia
   - Que NO deberia poder pasar -- no solo lo permitido
   - Si no salio solo en el punto 1: pedi al menos un caso real de punta a punta, con datos concretos ("caminame por un ejemplo real")

3. **Resumi lo que entendiste antes de seguir a la Ronda 4:** "Entonces tenemos [entidad] que hace [x], con estos roles... asi es, o me perdi algo?"

El objetivo es que estas reglas queden resueltas ahora, antes de construir nada -- no despues de que el usuario use la app real y encuentre que el modelo no encaja con como piensa usarla.

---

## Ronda 4: Direccion Visual

Todo lo visual vive en esta ronda, de lo rapido a lo profundo: primero preferencias rapidas, despues una conversacion abierta para aprobar el sistema visual completo, y por ultimo los assets de marca -- en ese orden porque un logo existente deberia influir la paleta, no llegar despues de que ya se eligio todo.

**Preferencias rapidas:**

12. **Tienes alguna pagina web que te guste como se ve?**
    - Si tiene: Usa el skill `web-reader` para analizarla. Nota colores, layout, tipografia, vibra.
    - Default: Saltar, elegir basado en la industria.

13. **Tienes preferencia de colores, o quieres que yo elija basado en tu industria?**
    - Default: Usa `ui-ux-pro-max`. Corre: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<industria>" --domain color` — en Windows suele ser `python`, no `python3`; si devuelve vacio o error, prueba con el otro nombre antes de asumir que no hay resultados.
    - Si falla la busqueda: Elige basado en las normas de la industria en `docs/design-guide.md`.

14. **Tema claro u oscuro?**
    - Default: Claro.

15. **Que onda o sensacion deberian tener los visitantes?**
    - Ofrece opciones: profesional, jugueton, audaz, elegante, minimalista, calido, moderno, atrevido, lujoso.
    - Default: "Profesional y accesible."

**Assets de marca** (preguntalos antes de la pausa de aprobacion, para que el logo pueda informar la paleta):

16. **Tienes un logo?**
    - Acepta: ruta de archivo, URL, o "no"
    - Default: Logo de solo texto usando el nombre del negocio con la fuente del titulo.

17. **Tienes imagenes especificas que quieras usar?**
    - Acepta: rutas de archivo, URLs, o "no"
    - Formatos aceptados: JPG (fotos), PNG (logos con transparencia), SVG (iconos/logos), WebP (compresion moderna)
    - Si da URLs, descargarlas: `curl -o site/public/images/foto.jpg "URL"`
    - Default: Sin fotos de stock. Usar patrones geometricos, gradientes o elementos decorativos abstractos que combinen con el sistema de diseno.

18. **Tienes un favicon (el iconito pequeno en la pestana del navegador)?**
    - Acepta: ruta de archivo, URL, o "no"
    - Default: Generar un favicon simple con los colores de la marca usando `site/src/app/icon.tsx`.

**La conversacion de aprobacion** -- despues de las preguntas rapidas y los assets, **PAUSA con una conversacion visual real, no una aprobacion de un solo tiro** — es el mismo espiritu que la Ronda 3, aplicado a lo visual en vez de a lo funcional: se itera de verdad hasta que todo quede resuelto, no se lee una lista y se espera un "ok".

1. Invoca el skill `imagegen-frontend-web` para generar 1-2 imagenes de referencia (el hero, y una seccion con componentes visibles como botones/cards) — no las 6-8 completas todavia, esas se generan mas adelante con las secciones ya definidas. Si hay logo, incorporalo en la referencia. Si el proyecto es Full-Stack Extension (confirmado en la Ronda 1), suma ademas una referencia de la pantalla de login o del shell del panel/dashboard.
2. Presenta la aprobacion **por elemento**, no como un "te late?" generico -- cubriendo todo el sistema visual, no solo el color:
   - Paleta / color
   - Tipografia
   - Estilo de boton (forma, tamano, esquinas)
   - Layout general / composicion (como se organiza cada seccion)
   - Fondos y texturas (solido, gradiente, patron, imagen)
   - Tono / esencia (que sensacion transmite en conjunto -- serio, calido, audaz, minimalista)
   - Si aplica (Full-Stack Extension): layout del login/panel

   Cada uno con su propio si/cambio -- no avances al siguiente hasta resolver el actual.
3. Itera elemento por elemento, regenerando la referencia visual si hace falta, hasta que todo quede aprobado.

**Espera la aprobacion del usuario antes de terminar el cuestionario.** Si el usuario quiere cambios, ajusta y vuelve a presentar hasta que apruebe. Esto asegura que casi no queden cambios de gusto/visual pendientes para despues de construir.

No se pregunta por deploy en ningun punto del cuestionario. El flujo siempre construye y prueba en local primero (Phase 5) -- recien en Phase 6 se pregunta si se quiere desplegar, cuando ya hay algo real que el usuario aprobo, no como una respuesta abstracta antes de construir nada.

---

## Cuando dice "No se" / "Tu decide"

Cuando el usuario deja una decision en tus manos:
- **Colores**: Correr ui-ux-pro-max color search para su industria + vibra.
- **Fuentes**: Correr ui-ux-pro-max typography search para su keyword de vibra.
- **Texto**: Generar basado en sus respuestas, pasar por humanizalo.
- **Layout**: Usar el orden probado: Hero > Servicios > Prueba Social > CTA > Footer.
- **Estilo**: Combinar con su industria: firma de abogados = refinado/serif, startup tech = limpio/moderno, restaurante = calido/organico, agencia creativa = audaz/experimental.
- **Formulario de contacto**: Usar un enlace mailto: con estilo de seccion de contacto.
- **Redes sociales**: Agregar iconos placeholder en el footer.

Siempre dile al usuario lo que elegiste y por que, brevemente: "Fui con una paleta calida — terracota y blanco hueso — porque va bien con el mundo de la comida artesanal."

---

## Despues de Todas las Rondas

Resume el brief completo para el usuario:
- Nombre y descripcion del negocio
- Audiencia objetivo
- Idioma de la pagina
- CTA principal, features, metodo de contacto, eslogan, testimonios, redes sociales
- Flujo funcional (si aplica Full-Stack Extension)
- Direccion de diseno (colores, fuentes, vibra, tono)
- Assets (logo, imagenes, favicon, o defaults)

Pregunta: "Esto cubre todo? Empiezo a construir en cuanto me des luz verde."

Despues procede a la Fase 2 (Sistema de Diseno) en el flujo de CLAUDE.md.
