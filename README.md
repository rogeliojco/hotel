# Proyecto de Hotel

## Descripción
Este proyecto es una aplicación web para la gestión de reservas de hotel. Permite a usuarios registrarse, buscar hoteles, ver habitaciones disponibles, hacer reservas y dejar reseñas; a los administradores les facilita gestionar habitaciones, usuarios, hoteles y generar reportes.

---

## Tecnologías Utilizadas

- Node.js + Express
- MongoDB + Mongoose
- Passport.js (autenticación)
- EJS + EJS-Mate (motor de plantillas)
- Bootstrap (interfaz)
- Moment.js (fechas)
- Dotenv (variables de entorno)
- Flatpickr (selector de fechas)

---

## Estructura del Proyecto

- **database.js**: Configuración de la base de datos.
- **index.js**: Archivo principal de la aplicación.
- **.env**: Llaves y configuraciones.
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
  - `perfil.js`: Rutas de perfil
  - `resenas.js`: Rutas de reseñas
  - `reservas.js`: Rutas de reservas.
- **views**: Vistas de la aplicación.
  - **admin**: Vistas de administración.
      - `nueva-habitacion.ejs`
      - `nueva-recomendacion.ejs`
      - `nuevo-hotel.ejs`
      - `panel.ejs`
      - `reportes.ejs`
      - `reservas-por-hotel.ejs`
      - `usuarios-sistema.ejs`
  - **hoteles\hotel-habitaciones.ejs**: Vistas relacionadas con hoteles.
  - **layout\layout.ejs**: Plantillas de diseño.
  - **resena\nueva.ejs**: Vista para la creación de reseñas
  - **confirmacionReserva.ejs**: Vista final del proceso de reservación
  - **detalle-reserva.ejs**: Vista en la que se muestran los detalles seleccionados por el usuario en el proceso de reservación
  - **hoteles.ejs**: Vista donde se muestran los hoteles registrados y el usuario selecciona el de su preferencia
  - **login.ejs**: Vista para iniciar sesión
  - **paginaPrincipal.ejs**: Vista de inicio, es la vista del directorio raíz
  - **perfil.ejs**: Vista donde el usuario puede ver sus reservaciones, modificar sus datos de usuario
  - **registro.ejs**: Vista los visitantes del sitio web se pueden registrar

##Pruebas del backend

1. Usa Postman para probar
2. Endpoints clave:
    - Página principal: GET localhost:3000
    - Iniciar Sesión: POST localhost:3000/login?email=cliente@cliente.com&password=cliente
    - Obtener Hoteles: GET localhost:3000/Hoteles
    - Obtener Reporte de Ingresos: GET localhost:3000/admin/reportes/generar?tipo=ingresos&modo=mes&mes=2025-05

##Rutas del Sistema

| Ruta                               | Funcionalidad / Vista                                    | Rol requerido            |
|------------------------------------|----------------------------------------------------------|--------------------------|
| `/`                                | Página principal con hoteles                             | Público                  |
| `/Hoteles`                         | Búsqueda y filtro de hoteles                             | Público                  |
| `/registro`                        | Formulario de registro de usuario                        | Público                  |
| `/login`                           | Formulario de inicio de sesión                           | Público                  |
| `/perfil`                          | Vista del perfil del usuario                             | Cliente                  |
| `/reservarHabitaciones`            | Seleccionar habitaciones y ver resumen de reserva        | Cliente                  |
| `/confirmar-reserva`               | Confirmar y registrar reserva                            | Cliente                  |
| `/resenas/nueva`                   | Mostrar formulario para nueva reseña                     | Cliente                  |
| `/admin`                           | Vista principal del panel administrativo                 | Admin                    |
| `/admin/reservas-por-hotel`        | Listado de reservaciones organizadas por hotel           | Admin                    |
| `/admin/usuarios-sistema`          | Listado y gestión de usuarios registrados                | Admin                    |
| `/admin/nueva-habitacion`          | Formulario para crear una nueva habitación               | Admin                    |
| `/admin/nuevo-hotel`               | Guardar un nuevo hotel                                   | Admin                    |
| `/admin/reportes`                  | Panel para generar distintos reportes                    | Admin                    |
| `/salir`                           | Cerrar sesión                                            | Autenticado              |

##Descripción de clases

| Archivo / Clase         | Descripción                                                                      |
|-------------------------|----------------------------------------------------------------------------------|
| `user.js`               | Modelo de usuario. Contiene nombre, email, contraseña (encriptada) y rol.        |
| `reserva.js`            | Modelo de reserva. Almacena fechas, usuario, habitaciones, estado y pago.        |
| `habitacion.js`         | Define el modelo de habitación con capacidad, precio, imágenes y reservas.       |
| `soloHotel.js`          | Modelo de hotel. Define ubicación, servicios, zona, precios y contacto.          |
| `resena.js`             | Permite a usuarios dejar comentarios y calificaciones sobre hoteles.             |
| `recomendacion.js`      | Define recomendaciones destacadas relacionadas con hoteles.                      |
| `auth.js`               | Middleware para validar si un usuario está autenticado o es administrador.       |
| `local-auth.js`         | Configura las estrategias de `Passport` para login y registro local.             |
| `index.js` (rutas)      | Maneja rutas generales: página principal, hoteles, login, registro, reservas.    |
| `reservas.js`           | CRUD de reservas: crear, ver, cancelar y consultar historial.                    |
| `perfil.js`             | Permite ver y editar datos del usuario autenticado.                              |
| `resenas.js`            | Rutas para publicar y visualizar reseñas de hoteles.                             |
| `admin.js`              | Rutas administrativas para gestionar usuarios, hoteles, habitaciones y reportes. |
| `database.js`           | Configuración de conexión a la base de datos MongoDB con variables `.env`.       |
| `insertarFechaRegistro.js` | Script para insertar fechas de registro a usuarios sin ese campo.             |


## Instalación
1. Clona el repositorio.
2. Ejecuta `npm install` para instalar las dependencias.
3. Ejecuta `npx puppeter browser install chrome` para descargar la versión de Chrome compatible con Puppeter (generar PDF)
4. Configura las variables de entorno en `.env`.

## Uso - Ejecución del Proyecto
Para iniciar aplicación ejecuta la linea de comandos:
```
npm run dev
```

## Créditos

El proyecto fue desarrollado en colaboración de:

- Alvaro Gabriel Quintero Andrade
- Blanca Angelica Rivera Garcia
- Jesus Manuel Ortiz Ortiz
- Rogelio Jallacy Camacho Ochoa