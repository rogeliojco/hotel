# Proyecto de Hotel

## Descripción
Este proyecto es una aplicación web para la gestión de reservas de hotel. Incluye funcionalidades para la administración de habitaciones, usuarios y reservas.

## Estructura del Proyecto

- **database.js**: Configuración de la base de datos.
- **hotel\index.js**: Archivo principal de la aplicación.
- **keys.js**: Llaves y configuraciones.
- **middlewares\auth.js**: Middleware para autenticación.
- **models**: Modelos de datos.
  - `habitacion.js`: Modelo de habitación.
  - `reserva.js`: Modelo de reserva.
  - `soloHotel.js`: Modelo específico del hotel.
  - `user.js`: Modelo de usuario.
- **passport\local-auth.js**: Estrategia de autenticación local.
- **public**: Archivos públicos y estáticos.
  - **asset**: Imágenes y logos.
  - **css**: Archivos de estilos.
- **rutas**: Archivos de rutas.
  - `admin.js`: Rutas de administración.
  - `index.js`: Rutas principales.
  - `reservas.js`: Rutas de reservas.
- **views**: Vistas de la aplicación.
  - **admin**: Vistas de administración.
  - **hoteles**: Vistas relacionadas con hoteles.
  - **layout**: Plantillas de diseño.

## Instalación
1. Clona el repositorio.
2. Ejecuta `npm install` para instalar las dependencias.
3. Configura las variables de entorno en `.env`.

## Uso
Ejecuta `npm run dev` para iniciar la aplicación.