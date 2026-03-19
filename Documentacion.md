# CRM Fantasilandia - Automatización de Reservas Escolares

## Resumen del Proyecto
Este proyecto es un sistema de automatización híbrido diseñado para capturar solicitudes de reserva de colegios desde un formulario web público y enrutarlas de manera segura hacia un entorno CRM construido en Microsoft SharePoint y Power Apps.

Debido a las limitaciones de las licencias Microsoft 365 Standard (que impiden la escritura directa no autenticada en SharePoint a través de APIs), este sistema utiliza una arquitectura de "Puente de Correo Electrónico" (Email Bridge).



## Arquitectura y Diagrama de Flujo

```mermaid
graph TD
    A[Colegio / Usuario] -->|Llena datos y valida| B(Formulario Web - GitHub Pages)
    B -->|Genera JSON| C{EmailJS API}
    C -->|Envía correo oculto| D[Bandeja Outlook Interna]
    D -->|Gatilla flujo| E(Power Automate)
    E -->|Extrae JSON y crea fila| F[(Lista de SharePoint)]
    F <-->|Lee y actualiza datos| G((Power Apps - Panel Ventas))
    H[Ejecutivo Comercial] <-->|Gestiona reservas| G

## 1. Componentes del Frontend
Alojados en el repositorio de GitHub Pages.
* **`index.html`**: La interfaz del formulario. Construida con Bootstrap, con diseño responsivo, paletas de colores corporativas de Fantasilandia y protección anti-spam Google reCAPTCHA v2.
* **`script.js`**: Contiene toda la lógica del cliente:
  - Búsqueda en tiempo real y autocompletado por RBD o RUT.
  - Menús desplegables en cascada (Región -> Comuna -> Colegio).
  - Selección dinámica de fechas basada en Modalidad.
  - Validación matemática para opciones de alimentación vs. cantidad de visitantes.
  - Empaquetado JSON y envío mediante EmailJS.
* **`schools.json`**: Base de datos estática con ~15,000 colegios del Mineduc utilizada para validación instantánea y sin servidor.

## 2. El Puente de Correo (EmailJS)
* **Servicio:** Conectado a una cuenta de correo saliente autorizada mediante OAuth.
* **Plantilla:** 
  - **Para (To):** Bandeja de entrada interna de Office 365 monitoreada por Power Automate.
  - **Asunto:** `Nueva Reserva Escolar - {{{school_name}}}`
  - **Cuerpo:** `{{{json_payload}}}` *(Debe usar llaves triples para preservar el formato JSON puro).*

## 3. Componentes del Backend (Microsoft 365)

### Lista de SharePoint (`Reserva Colegios`)
Actúa como la base de datos relacional central.
* Todos los campos del formulario web (RBD, RUT, Región, Cursos, Alimentación) se almacenan como columnas de "Línea de texto única" para evitar errores de búsqueda (Lookup) en Power Automate.
* Los campos del sistema (`Created`, `ID`) se utilizan de forma nativa.

### Flujo de Power Automate
* **Desencadenador:** "Cuando llega un nuevo correo electrónico (V3)" (Filtrado por Asunto: "Nueva Reserva Escolar -").
* **Acción 1:** "De HTML a texto" (Elimina las etiquetas HTML invisibles de Microsoft del cuerpo del correo).
* **Acción 2:** "Analizar JSON" (Convierte el texto plano en variables dinámicas).
* **Acción 3:** "Crear elemento" (Mapea las variables JSON a las columnas respectivas de SharePoint).

### Power Apps (Panel del Ejecutivo de Ventas)
Integrado directamente en una página de SharePoint para un acceso fluido.
* **Diseño Maestro-Detalle:** Galería desplazable al 30% a la izquierda, formulario de detalles al 70% a la derecha.
* **Codificación de Colores:** Los elementos de la galería cambian de color según el campo "Estado" (ej. Prospección = Azul, Cotización = Amarillo).
* **Orden y Filtros Avanzados:** Los elementos se filtran mediante un ComboBox y se ordenan usando una función `Sort()` anidada, aplicando una jerarquía numérica personalizada a los valores de Estado, seguidos por la fecha de creación.
* **Seguridad de Solo Lectura:** Los datos enviados por la web (RUT, RBD, Colegio) se bloquean (`DisplayMode.Disabled`) manteniendo un diseño nativo y legible, mientras que los campos comerciales (Estado, Order Entry, Método de Pago) permanecen editables.

## Mantenimiento y Actualizaciones Futuras
* **Actualizar Opciones de Alimentación:** Modificar el array `mealOptions` al inicio de `script.js`.
* **Actualizar Fechas Disponibles:** Modificar el objeto `availableDates` al inicio de `script.js`.
* **Cambiar el Correo Receptor:** 
  1. Actualizar el campo "To" en la plantilla de EmailJS.
  2. Actualizar el campo "Para" en el desencadenador de Power Automate.
  3. Asegurar que la conexión de Office 365 en Power Automate tenga permisos de lectura en la nueva bandeja de entrada.
