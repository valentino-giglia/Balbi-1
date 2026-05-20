const axios = require('axios');
const { Pacientes } = require('../models');
const { Op } = require('sequelize');
const { broadcastChatNuevoMensaje } = require('../websocket');

const KAPSO_API_KEY = process.env.KAPSO_API_KEY;
const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp/v24.0';

const convertKapsoMessage = (kapsoMessage) => {
  const message = {
    id: kapsoMessage.id,
    type: kapsoMessage.type?.toUpperCase() || 'TEXT',
    timestamp: kapsoMessage.timestamp,
    direction: kapsoMessage.kapso?.direction || 'unknown',
    status: kapsoMessage.kapso?.status || 'unknown',
    text: null,
    imageUrl: null,
    audioUrl: null,
    videoUrl: null,
    documentUrl: null,
    transcript: null
  };

  // Determinar dirección (inbound = recibido, outbound = enviado)
  if (kapsoMessage.kapso?.direction === 'inbound') {
    message.from = kapsoMessage.from;
  } else {
    message.to = kapsoMessage.to;
  }

  // Procesar según el tipo de mensaje
  switch (kapsoMessage.type) {
    case 'text':
      message.text = kapsoMessage.text?.body || kapsoMessage.kapso?.content || '';
      break;

    case 'image':
      message.imageUrl = kapsoMessage.kapso?.media_url || kapsoMessage.image?.link;
      message.text = kapsoMessage.text?.body || '';
      break;

    case 'audio':
      message.audioUrl = kapsoMessage.kapso?.media_url || kapsoMessage.audio?.link;
      const transcript = kapsoMessage.kapso?.transcript?.text;
      const content = kapsoMessage.kapso?.content || '';
      if (transcript) {
        message.transcript = transcript;
        message.text = `[TRANSCRIPCION DE AUDIO] ${transcript}`;
      } else {
        message.text = content;
      }
      break;

    case 'video':
      message.videoUrl = kapsoMessage.kapso?.media_url || kapsoMessage.video?.link;
      message.text = kapsoMessage.video?.caption || kapsoMessage.kapso?.content || '';
      break;

    case 'document':
      message.documentUrl = kapsoMessage.kapso?.media_url || kapsoMessage.document?.link;
      message.text = kapsoMessage.document?.caption || kapsoMessage.kapso?.content || '';
      break;

    default:
      message.text = kapsoMessage.kapso?.content || '';
      break;
  }

  return message;
};

const listarPacientesConChat = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const snDerivado = req.query.sn_derivado;

    const where = {
      estado: 'ACTIVO',
      kapso_phone_number_id: { [Op.ne]: null }
    };

    if (snDerivado === 'true' || snDerivado === '1') {
      where.sn_derivado = true;
    } else if (snDerivado === 'false' || snDerivado === '0') {
      where.sn_derivado = false;
    }

    const { count, rows } = await Pacientes.findAndCountAll({
      where,
      limit,
      offset,
      order: [['nombre', 'ASC']]
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
      data: rows
    });
  } catch (error) {
    console.error('Error listando pacientes con chat:', error);
    res.status(500).json({ error: 'Error al listar pacientes con chat' });
  }
};

const listarMensajes = async (req, res) => {
  try {
    const { phone_number_id, conversation_id, after, limit = 20 } = req.query;

    if (!KAPSO_API_KEY) {
      return res.status(500).json({ error: 'KAPSO_API_KEY no configurada' });
    }

    if (!phone_number_id) {
      return res.status(400).json({ error: 'phone_number_id es requerido' });
    }

    const params = {
      limit: parseInt(limit),
      conversation_id: conversation_id
    };

    if (after) {
      params.after = after;
    }

    const response = await axios.get(`${KAPSO_BASE_URL}/${phone_number_id}/messages`, {
      headers: {
        'X-API-Key': KAPSO_API_KEY
      },
      params
    });

    // Convertir mensajes de Kapso al formato simplificado
    const kapsoData = response.data?.data || [];
    const messages = Array.isArray(kapsoData) 
      ? kapsoData.map(convertKapsoMessage)
      : [];

    // Ordenar mensajes por timestamp (más antiguos primero)
    messages.sort((a, b) => {
      const timestampA = parseInt(a.timestamp || '0');
      const timestampB = parseInt(b.timestamp || '0');
      return timestampA - timestampB;
    });

    res.json({
      data: messages,
      paging: response.data?.paging || null
    });
  } catch (error) {
    console.error('Error listando mensajes:', error);
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data?.error || 'Error al listar mensajes' });
    }
    res.status(500).json({ error: 'Error al listar mensajes' });
  }
};

const enviarMensaje = async (req, res) => {
  try {
    const { phone_number_id, to, text, type, mediaUrl, fileName, caption } = req.body;

    if (!KAPSO_API_KEY) {
      return res.status(500).json({ error: 'KAPSO_API_KEY no configurada' });
    }

    if (!phone_number_id || !to) {
      return res.status(400).json({ error: 'phone_number_id y to son requeridos' });
    }

    let payload;
    if (type === 'document' && mediaUrl) {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: { link: mediaUrl, caption: caption || fileName || '', filename: fileName || 'archivo' }
      };
    } else if (type === 'image' && mediaUrl) {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: { link: mediaUrl, caption: caption || '' }
      };
    } else {
      if (!text) return res.status(400).json({ error: 'text es requerido para mensajes de texto' });
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text }
      };
    }

    const response = await axios.post(
      `${KAPSO_BASE_URL}/${phone_number_id}/messages`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': KAPSO_API_KEY
        }
      }
    );

    // Apagar el agente y notificar para actualizar mensajes en el front
    const paciente = await Pacientes.findOne({
      where: { kapso_phone_number_id: phone_number_id }
    });

    if (paciente) {
      await paciente.update({ kapso_agent_status: 'OFF' });
      broadcastChatNuevoMensaje(paciente.id);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data?.error || 'Error al enviar mensaje' });
    }
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

/**
 * Webhook que Kapso llama cuando llega un mensaje (o evento) de WhatsApp.
 * URL para configurar en Kapso: POST https://tu-dominio.com/api/chat/webhook
 * (En local: POST http://localhost:3000/api/chat/webhook)
 * Responde 200 inmediatamente y luego emite por WebSocket chat-nuevo-mensaje.
 */
const webhookKapso = async (req, res) => {
  res.status(200).send();

  const body = req.body ? { ...req.body } : {};
  setTimeout(async () => {
    try {
      let phoneNumberId = null;

      if (body.entry && Array.isArray(body.entry) && body.entry.length > 0) {
        const entry = body.entry[0];
        phoneNumberId = entry.id || entry.phone_number_id;
        if (!phoneNumberId && entry.changes?.[0]?.value?.metadata?.phone_number_id) {
          phoneNumberId = entry.changes[0].value.metadata.phone_number_id;
        }
      }
      if (!phoneNumberId && body.metadata?.phone_number_id) {
        phoneNumberId = body.metadata.phone_number_id;
      }
      if (!phoneNumberId && body.phone_number_id) {
        phoneNumberId = body.phone_number_id;
      }

      if (phoneNumberId) {
        const paciente = await Pacientes.findOne({
          where: { kapso_phone_number_id: String(phoneNumberId) }
        });
        if (paciente) {
          broadcastChatNuevoMensaje(paciente.id);
        }
      }
    } catch (error) {
      console.error('Error en webhook Kapso:', error);
    }
  }, 1);
};

module.exports = {
  listarPacientesConChat,
  listarMensajes,
  enviarMensaje,
  webhookKapso
};
