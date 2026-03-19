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

