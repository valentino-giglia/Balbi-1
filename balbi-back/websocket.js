const { WebSocketServer } = require('ws');

let wss = null;

/**
 * Inicializa el servidor WebSocket adjunto al mismo HTTP server.
 * Debe llamarse después de crear el servidor HTTP y antes de listen.
 * @param {import('http').Server} server - Servidor HTTP de Express
 */
function initWebSocket(server) {
  if (wss) {
    return wss;
  }
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    console.log('🔌 Cliente WebSocket conectado');
    ws.on('close', () => {
      console.log('🔌 Cliente WebSocket desconectado');
    });
    ws.on('error', (err) => {
      console.warn('WebSocket error:', err.message);
    });
  });
  console.log('✅ WebSocket server listo en path /ws');
  return wss;
}

/**
 * Obtiene la instancia del WebSocket server (puede ser null si no se inicializó).
 * @returns {WebSocketServer | null}
 */
function getWss() {
  return wss;
}

/**
 * Notifica a los clientes que llegó un mensaje nuevo en un chat (para actualizar mensajes).
 * @param {number} pacienteID - ID del paciente cuya conversación tiene un mensaje nuevo
 */
function broadcastChatNuevoMensaje(pacienteID) {
  if (!wss) return;
  const payload = JSON.stringify({
    type: 'chat-nuevo-mensaje',
    data: { pacienteID }
  });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
  console.log('📤 Broadcast chat nuevo mensaje, pacienteID:', pacienteID);
}

module.exports = {
  initWebSocket,
  getWss,
  broadcastChatNuevoMensaje
};

