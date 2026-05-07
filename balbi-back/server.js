const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initWebSocket } = require('./websocket');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Función async para inicializar
const initializeApp = async () => {
  try {
    // Llamar al index de routes que maneja DB y rutas específicas
    await require('./routes/index')(app);
    
    // Endpoint de salud
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'Connected'
      });
    });

    // Manejo de rutas no encontradas (404)
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Ruta no encontrada'
      });
    });

    // Crear servidor HTTP (compartido entre Express y WebSocket)
    const server = http.createServer(app);
    initWebSocket(server);

    // Iniciar servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });
    
  } catch (error) {
    console.error('❌ Error inicializando la aplicación:', error);
    process.exit(1);
  }
};

// Inicializar la aplicación
initializeApp();

module.exports = app;
