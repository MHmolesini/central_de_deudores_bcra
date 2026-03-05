# Central de Deudores BCRA - Visualizador Premium

Un visualizador moderno y profesional para la consulta de información en la **Central de Deudores del Sistema Financiero** del Banco Central de la República Argentina (BCRA). Esta aplicación permite a los usuarios consultar su situación crediticia histórica y actual de forma clara, visual y eficiente.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-brightgreen)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)

## ✨ Características Principales

- 🔍 **Consulta Instantánea:** Búsqueda por CUIT/CUIL para obtener el historial crediticio consolidado.
- 💵 **Multimoneda (ARS/USD):** Conversión automática de deudas a dólares utilizando los tipos de cambio históricos oficiales del BCRA.
- 📊 **Visualización Dinámica:** Gráficos de evolución de deuda y flujo de fondos (inflows/outflows) en ambas monedas utilizando **Apache ECharts**.
- 🏦 **Detalle por Entidad:** Desglose de deuda y situación actual para cada entidad financiera informante.
- 🚫 **Información Especial:** Detección de procesos judiciales, deudas en revisión y cheques rechazados.
- 📱 **Diseño Premium & Responsive:** Interfaz moderna con estética "Glassmorphism" y modo oscuro refinado, optimizada para todos los dispositivos.
- 📖 **Guía Integrada:** Documentación técnica sobre las clasificaciones de deudores según la normativa del BCRA.

## 🚀 Tecnologías Utilizadas

- **Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 7](https://vite.dev/)
- **Estilos:** Vanilla CSS con variables modernas y Flexbox/Grid.
- **Gráficos:** [ECharts for React](https://echarts.apache.org/)
- **Iconografía:** [Lucide React](https://lucide.dev/)

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/central_de_deudores_bcra.git
   cd central_de_deudores_bcra
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. **Construir para producción:**
   ```bash
   npm run build
   ```

## 📈 Guía de Interpretación de Datos

### Clasificación de Deudores (Situaciones)
La aplicación utiliza la escala oficial del BCRA:

1. **Situación 1 (Normal):** Cumplimiento en tiempo y forma o atrasos no superiores a 31 días.
2. **Situación 2 (Riesgo Bajo / Seg. Especial):** Atrasos de 31 a 90 días.
3. **Situación 3 (Riesgo Medio / Con problemas):** Atrasos de 90 a 180 días.
4. **Situación 4 (Riesgo Alto / Insolvencia):** Atrasos de 180 días a 1 año.
5. **Situación 5 (Irrecuperable):** Atrasos superiores a 1 año.
6. **Situación 6 (Irrecuperable por Disp. Técnica):** Clientes de entidades liquidadas.

> **Nota:** Todos los montos de deuda se encuentran expresados en **miles de pesos**.

## ⚖️ Aviso Legal

Esta herramienta es un visualizador que utiliza servicios de terceros para obtener datos públicos del BCRA. Los derechos de rectificación, actualización o supresión de datos deben ejercerse ante la entidad financiera correspondiente o el BCRA según la Ley de Protección de Datos Personales.

---
Desarrollado con ❤️ para mejorar el acceso a la información financiera.

