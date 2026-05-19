# Dr. Balbi — Plataforma de Gestión Clínica

## Descripción

Sistema de gestión para la clínica veterinaria Dr. Balbi. Incluye agenda, historia clínica, internación, mensajería y precios.

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+
- Cuenta de Railway (deploy)
- Cuenta de OpenAI (IA del chat)
- Cuenta de Google Cloud (Calendar + Sheets + Firebase Storage)

---

## 1. Crear cuenta en Railway

Railway es la plataforma donde se despliega el backend.

### Pasos

1. Ir a [https://railway.app](https://railway.app) y hacer clic en **Start a New Project**.
2. Registrarse con la cuenta de Google o email del cliente:
   - Email recomendado: `admin@drbalbi.com.ar` (o el que use el cliente)
3. Una vez dentro, crear un **New Project** → seleccionar **Deploy from GitHub repo**.
4. Conectar la cuenta de GitHub donde está el repositorio `balbi-back`.
5. Railway detecta automáticamente el `package.json` y configura Node.js.

### Variables de entorno en Railway

En el proyecto de Railway → pestaña **Variables**, agregar:

```
DATABASE_URL=<URL de PostgreSQL — Railway puede provisionar una automáticamente>
JWT_SECRET=<string aleatorio largo, ej: openssl rand -hex 32>
JWT_EXPIRATION=8h
AUTH_USER=admin
AUTH_PASSWORD=<contraseña segura>
API_KEY=<string aleatorio para la API interna>
NODE_ENV=production
FIREBASE_PROJECT_ID=<id del proyecto Firebase>
FIREBASE_PRIVATE_KEY=<clave privada del service account, con saltos de línea como \n>
FIREBASE_CLIENT_EMAIL=<email del service account Firebase>
FIREBASE_STORAGE_BUCKET=<nombre del bucket, ej: drbalbi-app.appspot.com>
OPENAI_API_KEY=<ver sección 2>
```

### Base de datos PostgreSQL en Railway

1. En el mismo proyecto de Railway → **+ New** → **Database** → **PostgreSQL**.
2. Railway genera la variable `DATABASE_URL` automáticamente y la inyecta al servicio.
3. Las tablas se crean automáticamente al iniciar el servidor (Sequelize sync).

### Dominio

- Railway asigna un dominio automático tipo `balbi-back.up.railway.app`.
- Para dominio propio: **Settings** → **Networking** → **Custom Domain** → agregar `api.drbalbi.com.ar` y configurar el CNAME en el DNS.

---

## 2. Crear cuenta en OpenAI

La plataforma usa OpenAI para el asistente de chat con clientes.

### Pasos

1. Ir a [https://platform.openai.com](https://platform.openai.com) y hacer clic en **Sign up**.
2. Registrarse con el email del cliente: `admin@drbalbi.com.ar`.
3. Verificar el email y agregar un método de pago (tarjeta de crédito o prepaga).
4. Ir a **API Keys** → **+ Create new secret key**.
   - Nombre: `DrBalbi Producción`
   - Copiar la clave (solo se muestra una vez).
5. Pegar la clave en Railway como variable `OPENAI_API_KEY`.

### Recomendaciones de uso

- Establecer un **límite de gasto mensual** en Settings → Limits → Set monthly budget (ej: $30 USD/mes).
- Usar modelo `gpt-4o-mini` para reducir costos (ya configurado en el código).

---

## 3. Firebase Storage (para archivos e imágenes)

Los estudios adjuntos se guardan en Firebase Storage.

### Pasos

1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com) y crear un proyecto nuevo: `drbalbi-app`.
2. En el proyecto → **Storage** → **Get Started** → elegir región `us-central1` (o la más cercana).
3. En **Project Settings** → **Service Accounts** → **Generate new private key**.
   - Descargar el archivo JSON.
   - Copiar `project_id`, `private_key` y `client_email` a las variables de Railway.
4. En Storage → **Rules** → asegurarse de que solo el backend autenticado pueda leer/escribir.

---

## 4. Instalación local

```bash
npm install
cp .env.example .env   # completar las variables
node server.js
```

El servidor queda disponible en `http://localhost:3000`.

---

## 5. Roles del sistema

| Rol         | Acceso                                                        |
|-------------|---------------------------------------------------------------|
| admin       | Todo el sistema + Configuración de usuarios y roles           |
| veterinario | Dashboard, Agenda, Pacientes, Consultas, Libreta, Internación |
| recepcion   | Dashboard, Agenda, Clientes, Mensajes                         |

Los roles se asignan desde **Configuración → Usuarios y Roles** (solo admin).

---

## 6. Soporte

Para soporte técnico contactar al desarrollador.
