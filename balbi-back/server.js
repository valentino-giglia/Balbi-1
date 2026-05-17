const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initWebSocket } = require('./websocket');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const initializeApp = async () => {
  try {
    await require('./routes/index')(app);

    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'Connected'
      });
    });

    app.use(express.static(__dirname));

    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Ruta no encontrada'
      });
    });

    const server = http.createServer(app);
    initWebSocket(server);

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

initializeApp();

module.exports = app;
