# Dr. Balbi — Emergencias Veterinarias 🐾

Plataforma de gestión clínica veterinaria: historia clínica, turnos, internación, cola de atención, libreta sanitaria y más.

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Base de datos MySQL (se recomienda [Railway](https://railway.app))

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/valentino-giglia/Balbi-1.git
cd Balbi-1/balbi-back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env
```

Editá `.env` con tus datos de base de datos y las claves secretas:

```env
DB_HOST=tu_host_mysql
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos
DB_PORT=3306

JWT_SECRET=genera_uno_con_el_comando_de_abajo
API_KEY=genera_uno_con_el_comando_de_abajo
```

Para generar claves seguras:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Crear tablas y usuarios iniciales

Este comando crea las tablas automáticamente y carga los 3 usuarios de acceso:

```bash
npm run seed
```

Credenciales creadas:

| Rol         | Email                    | Contraseña   |
|-------------|--------------------------|--------------|
| Admin       | admin@drbalbi.vet        | Balbi2026!   |
| Veterinario | mendez@drbalbi.vet       | Vet2026!     |
| Recepción   | recepcion@drbalbi.vet    | Recep2026!   |

### 5. Iniciar el servidor

```bash
npm start          # producción
npm run dev        # desarrollo (con hot-reload)
```

Abrí el navegador en: **http://localhost:3000**

---

## Actualización de la base de datos

El servidor usa `sequelize.sync({ alter: true })`, lo que significa que **cada vez que iniciás el servidor se actualizan automáticamente las columnas y tablas** según los modelos. No necesitás correr migraciones manualmente.

---

## Estructura del proyecto

```
balbi-back/
├── server.js                    # Entry point
├── seed.js                      # Carga roles y usuarios iniciales
├── .env.example                 # Variables de entorno (plantilla)
├── Dr_Balbi_Plataforma_v4.html  # Frontend (React + Babel standalone)
│
├── config/
│   └── database.js              # Conexión MySQL con Sequelize
│
├── models/                      # Modelos Sequelize
│   ├── index.js                 # Relaciones entre modelos
│   ├── Usuario.js
│   ├── Rol.js / UsuarioRol.js
│   ├── Pacientes.js
│   ├── Mascotas.js
│   ├── Turnos.js
│   ├── Consultas.js
│   ├── LibretaItem.js
│   ├── Vacunas.js
│   ├── Fichas.js
│   ├── Files.js
│   ├── Servicios.js
│   ├── Profesionales.js
│   ├── Horarios.js
│   ├── BloqueosAgenda.js
│   └── EventosAgenda.js
│
├── controllers/                 # Lógica de negocio
├── routes/                      # Endpoints de la API
└── middleware/                  # Auth JWT + RBAC
```

---

## Roles y permisos

| Módulo               | Admin      | Veterinario    | Recepción |
|----------------------|------------|----------------|-----------|
| Dashboard / Guardia  | ✅ editar  | ✅ ver         | ✅ ver    |
| Clientes             | ✅         | ✅             | ✅        |
| Pacientes (mascotas) | ✅         | ✅             | ✅        |
| Consultas            | ✅ siempre | ✅ ver+crear   | ❌        |
| Libreta sanitaria    | ✅         | ✅             | ✅ ver    |
| Internación          | ✅         | ✅             | ✅ ver    |
| Configuración        | ✅         | ❌             | ❌        |

---

## API — Endpoints principales

Todos los endpoints requieren header `Authorization: Bearer <token>` excepto `/api/auth/login`.

```
POST   /api/auth/login
GET    /api/pacientes
POST   /api/pacientes
GET    /api/mascotas
GET    /api/mascotas/:id
PUT    /api/mascotas/:id
GET    /api/consultas?mascotaID=
POST   /api/consultas
PUT    /api/consultas/:id
GET    /api/libreta?mascotaID=
POST   /api/libreta
PUT    /api/libreta/:id
DELETE /api/libreta/:id
GET    /api/turnos?fechaInicio=&fechaFin=
POST   /api/turnos
GET    /api/vacunas?mascotaID=
POST   /api/vacunas
POST   /api/files       (multipart/form-data)
GET    /api/servicios
GET    /api/profesionales
```

---

## Zona horaria

La plataforma opera en **zona horaria Argentina (UTC-3, sin horario de verano)**. El reloj y todas las fechas se muestran en hora de Rosario / Buenos Aires.
