const {
  Turnos,
  Pacientes,
  Profesionales,
  Servicios,
  Consultas,
  Mascotas
} = require('../models');
const { Op } = require('sequelize');
const { paginate } = require('../utils/pagination');
const { getCalendar, CALENDAR_ID } = require('../config/google');

// ── Google Calendar helpers ──────────────────────────────────────

function buildCalendarEvent(turno, paciente, mascota, profesional, servicio) {
  const nombreCliente = paciente ? paciente.nombre : 'Sin cliente';
  const nombreMascota = mascota ? ` (${mascota.nombre})` : '';
  const nombreServicio = servicio ? servicio.nombre : 'Turno';
  const nombreProfesional = profesional ? profesional.nombre : '';

  return {
    summary: `${nombreServicio} — ${nombreCliente}${nombreMascota}`,
    description: [
      nombreProfesional ? `Profesional: ${nombreProfesional}` : '',
      turno.notas ? `Notas: ${turno.notas}` : ''
    ].filter(Boolean).join('\n'),
    start: { dateTime: new Date(turno.horaInicio).toISOString() },
    end: { dateTime: new Date(turno.horaFin).toISOString() }
  };
}

async function crearEventoCalendar(turno, paciente, mascota, profesional, servicio) {
  try {
    const calendar = await getCalendar();
    const event = buildCalendarEvent(turno, paciente, mascota, profesional, servicio);
    const res = await calendar.events.insert({ calendarId: CALENDAR_ID, requestBody: event });
    return res.data.id;
  } catch (err) {
    console.error('⚠️  Google Calendar — no se pudo crear evento:', err.message);
    return null;
  }
}

async function actualizarEventoCalendar(googleEventId, turno, paciente, mascota, profesional, servicio) {
  if (!googleEventId) return;
  try {
    const calendar = await getCalendar();
    const event = buildCalendarEvent(turno, paciente, mascota, profesional, servicio);
    await calendar.events.update({ calendarId: CALENDAR_ID, eventId: googleEventId, requestBody: event });
  } catch (err) {
    console.error('⚠️  Google Calendar — no se pudo actualizar evento:', err.message);
  }
}

async function eliminarEventoCalendar(googleEventId) {
  if (!googleEventId) return;
  try {
    const calendar = await getCalendar();
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: googleEventId });
  } catch (err) {
    console.error('⚠️  Google Calendar — no se pudo eliminar evento:', err.message);
  }
}

const listarTurnos = async (req, res) => {
  try {
    const { 
      estado, 
      pacienteID, 
      profesionalID, 
      servicioID, 
      mascotaID,
      fechaInicio, 
      fechaFin 
    } = req.query;
    
    const where = {};

    if (estado) {
      where.estado = estado;
    } else {
      where.estado = { [Op.not]: 'BAJA' };
    }

    if (mascotaID !== undefined && mascotaID !== null && mascotaID !== '') {
      const mid = parseInt(mascotaID, 10);
      if (!Number.isNaN(mid)) where.mascotaID = mid;
    } else if (pacienteID !== undefined && pacienteID !== null && pacienteID !== '') {
      const pid = parseInt(pacienteID, 10);
      if (!Number.isNaN(pid)) where.pacienteID = pid;
    }

    if (profesionalID) {
      where.profesionalID = profesionalID;
    }

    if (servicioID) {
      where.servicioID = servicioID;
    }

    // Filtrado por rango de fechas
    if (fechaInicio || fechaFin) {
    const parseDateParam = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };

    const inicio = parseDateParam(fechaInicio);
    const fin = parseDateParam(fechaFin);

    if (fechaInicio && !inicio) {
      return res.status(400).json({ error: 'fechaInicio invรกlida' });
    }
    if (fechaFin && !fin) {
      return res.status(400).json({ error: 'fechaFin invรกlida' });
    }

    if (inicio && fin) {
      where.horaInicio = { [Op.between]: [inicio, fin] };
    } else if (inicio) {
      where.horaInicio = { [Op.gte]: inicio };
    } else if (fin) {
      where.horaInicio = { [Op.lte]: fin };
      }
    }

    const turnos = await Turnos.findAll({
      where,
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
          required: false
        },
        {
          model: Servicios,
          as: 'servicio',
          required: false
        },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
      ],
      order: [['horaInicio', 'ASC']]
    });

    res.json(turnos);
  } catch (error) {
    console.error('Error listando turnos:', error);
    res.status(500).json({ error: 'Error al listar turnos' });
  }
};

/**
 * Todos los turnos de una mascota (findAll, sin paginar). Solo filtra mascotaID y excluye BAJA.
 * GET /turnos/por-mascota/:mascotaId
 */
const listarTurnosTodosPorMascota = async (req, res) => {
  try {
    const mascotaId = parseInt(req.params.mascotaId, 10);
    if (Number.isNaN(mascotaId)) {
      return res.status(400).json({ error: 'mascotaId inválido' });
    }

    const turnos = await Turnos.findAll({
      where: {
        mascotaID: mascotaId,
        estado: { [Op.not]: 'BAJA' }
      },
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
          required: false
        },
        {
          model: Servicios,
          as: 'servicio',
          required: false
        },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
      ],
      order: [['horaInicio', 'ASC']]
    });

    res.json(turnos);
  } catch (error) {
    console.error('Error listando turnos por mascota:', error);
    res.status(500).json({ error: 'Error al listar turnos de la mascota' });
  }
};

const obtenerTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await Turnos.findByPk(id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
          required: false
        },
        {
          model: Servicios,
          as: 'servicio',
          required: false
        },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
      ]
    });

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.json(turno);
  } catch (error) {
    console.error('Error obteniendo turno:', error);
    res.status(500).json({ error: 'Error al obtener turno' });
  }
};

const crearTurno = async (req, res) => {
  try {
    const {
      pacienteID,
      mascotaID,
      profesionalID,
      servicioID,
      precio,
      horaInicio,
      horaFin,
      duracionMinutos,
      estado,
      notas,
      consultaID,
      tipo
    } = req.body;

    // Validaciones básicas
    if (!profesionalID || !servicioID || !horaInicio || !horaFin) {
      return res.status(400).json({ 
        error: 'Profesional, servicio, horaInicio y horaFin son requeridos' 
      });
    }

    // Validar que las entidades existan
    const [profesional, servicio] = await Promise.all([
      Profesionales.findByPk(profesionalID),
      Servicios.findByPk(servicioID)
    ]);

    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Validar paciente si se proporciona
    if (pacienteID) {
      const paciente = await Pacientes.findByPk(pacienteID);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }

    // Validar mascota si se proporciona
    if (mascotaID) {
      const mascota = await Mascotas.findByPk(mascotaID);
      if (!mascota) {
        return res.status(404).json({ error: 'Mascota no encontrada' });
      }
    }

    // Calcular duración si no se proporciona
    const fechaInicio = new Date(horaInicio);
    const fechaFin = new Date(horaFin);
    let duracion = duracionMinutos;
    
    if (!duracion) {
      // Intentar calcular desde las fechas
      const duracionCalculada = Math.round((fechaFin - fechaInicio) / (1000 * 60));
      // Si la duraciรณn calculada es vรกlida, usarla; si no, usar 30 minutos por defecto
      duracion = duracionCalculada > 0 ? duracionCalculada : 30;
    }

    if (duracion <= 0) {
      return res.status(400).json({ error: 'La duraciรณn debe ser mayor a 0' });
    }

    // Determinar estado inicial
    const estadoInicial = estado || (pacienteID ? 'RESERVADO' : 'DISPONIBLE');

    if (consultaID) {
      const consulta = await Consultas.findByPk(consultaID);
      if (!consulta) {
        return res.status(404).json({ error: 'Consulta no encontrada' });
      }
    }

    const turno = await Turnos.create({
      pacienteID: pacienteID || null,
      mascotaID: mascotaID || null,
      profesionalID,
      servicioID,
      precio: precio || null,
      horaInicio: fechaInicio,
      horaFin: fechaFin,
      duracionMinutos: duracion,
      estado: estadoInicial,
      notas: notas || null,
      consultaID: consultaID || null,
      tipo: tipo || 'CONSULTORIO'
    });

    const turnoCompleto = await Turnos.findByPk(turno.id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
          required: false
        },
        {
          model: Servicios,
          as: 'servicio',
          required: false
        },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
      ]
    });

    res.status(201).json(turnoCompleto);

    // Crear evento en Google Calendar (no bloquea la respuesta)
    crearEventoCalendar(
      turnoCompleto,
      turnoCompleto.paciente,
      turnoCompleto.mascota,
      turnoCompleto.profesional,
      turnoCompleto.servicio
    ).then(async (googleEventId) => {
      if (googleEventId) {
        await Turnos.update({ googleEventId }, { where: { id: turnoCompleto.id } });
      }
    });
  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ error: 'Error al crear turno' });
  }
};

const actualizarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pacienteID,
      mascotaID,
      profesionalID,
      servicioID,
      precio,
      horaInicio,
      horaFin,
      duracionMinutos,
      estado,
      notas,
      consultaID,
      tipo
    } = req.body;

    const turno = await Turnos.findByPk(id);
    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (consultaID !== undefined && consultaID !== null) {
      const consulta = await Consultas.findByPk(consultaID);
      if (!consulta) {
        return res.status(404).json({ error: 'Consulta no encontrada' });
      }
    }

    // Validar entidades si se actualizan
    if (profesionalID) {
      const profesional = await Profesionales.findByPk(profesionalID);
      if (!profesional) {
        return res.status(404).json({ error: 'Profesional no encontrado' });
      }
    }

    if (servicioID) {
      const servicio = await Servicios.findByPk(servicioID);
      if (!servicio) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }
    }

    if (pacienteID !== undefined) {
      if (pacienteID !== null) {
    const paciente = await Pacientes.findByPk(pacienteID);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
      }
    }

    if (mascotaID !== undefined && mascotaID !== null) {
      const mascota = await Mascotas.findByPk(mascotaID);
      if (!mascota) {
        return res.status(404).json({ error: 'Mascota no encontrada' });
      }
    }

    // Calcular duración si se actualizan las fechas
    let duracion = duracionMinutos;
    if (horaInicio && horaFin && !duracionMinutos) {
      const fechaInicio = new Date(horaInicio);
      const fechaFin = new Date(horaFin);
      duracion = Math.round((fechaFin - fechaInicio) / (1000 * 60));
    }

    const updateData = {};
    if (pacienteID !== undefined) updateData.pacienteID = pacienteID;
    if (mascotaID !== undefined) updateData.mascotaID = mascotaID;
    if (profesionalID) updateData.profesionalID = profesionalID;
    if (servicioID) updateData.servicioID = servicioID;
    if (precio !== undefined) updateData.precio = precio;
    if (horaInicio) updateData.horaInicio = new Date(horaInicio);
    if (horaFin) updateData.horaFin = new Date(horaFin);
    if (duracion) updateData.duracionMinutos = duracion;
    if (estado) updateData.estado = estado;
    if (notas !== undefined) updateData.notas = notas;
    if (consultaID !== undefined) updateData.consultaID = consultaID;
    if (tipo) updateData.tipo = tipo;

    await turno.update(updateData);

    const turnoCompleto = await Turnos.findByPk(turno.id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
          required: false
        },
        {
          model: Servicios,
          as: 'servicio',
          required: false
        },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
      ]
    });

    res.json(turnoCompleto);

    // Sincronizar con Google Calendar
    const cancelado = turnoCompleto.estado === 'CANCELADO';
    if (cancelado) {
      eliminarEventoCalendar(turnoCompleto.googleEventId);
    } else if (turnoCompleto.googleEventId) {
      actualizarEventoCalendar(
        turnoCompleto.googleEventId,
        turnoCompleto,
        turnoCompleto.paciente,
        turnoCompleto.mascota,
        turnoCompleto.profesional,
        turnoCompleto.servicio
      );
    } else {
      crearEventoCalendar(
        turnoCompleto,
        turnoCompleto.paciente,
        turnoCompleto.mascota,
        turnoCompleto.profesional,
        turnoCompleto.servicio
      ).then(async (googleEventId) => {
        if (googleEventId) {
          await Turnos.update({ googleEventId }, { where: { id: turnoCompleto.id } });
        }
      });
    }
  } catch (error) {
    console.error('Error actualizando turno:', error);
    res.status(500).json({ error: 'Error al actualizar turno' });
  }
};

const eliminarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await Turnos.findByPk(id);

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    await turno.update({ estado: 'BAJA' });
    res.json({ message: 'Turno eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};

const cancelarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await Turnos.findByPk(id);

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (turno.estado === 'CANCELADO') {
      return res.status(400).json({ error: 'El turno ya estรก cancelado' });
    }

    if (turno.estado === 'COMPLETADO') {
      return res.status(400).json({ error: 'No se puede cancelar un turno completado' });
    }

      await turno.update({ estado: 'CANCELADO' });

    const turnoCompleto = await Turnos.findByPk(turno.id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
            required: false
        },
          {
            model: Servicios,
            as: 'servicio',
            required: false
          },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
        ]
    });

    res.json(turnoCompleto);

    eliminarEventoCalendar(turnoCompleto.googleEventId);
  } catch (error) {
    console.error('Error cancelando turno:', error);
    res.status(500).json({ error: 'Error al cancelar turno' });
  }
};

// GET /turnos/proximos - Turnos desde hoy en adelante con paginación
const listarTurnosProximos = async (req, res) => {
  try {
    const { 
      pacienteID,
      mascotaID,
      profesionalID,
      servicioID,
      estado,
      page = 1,
      pageSize = 10
    } = req.query;

    const where = {
      estado: { [Op.not]: 'BAJA' }
    };

    // Fecha desde hoy (inicio del día)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    where.horaInicio = { [Op.gte]: hoy };

    if (mascotaID) {
      where.mascotaID = mascotaID;
    } else if (pacienteID) {
      where.pacienteID = pacienteID;
    }

    if (profesionalID) {
      where.profesionalID = profesionalID;
    }

    if (servicioID) {
      where.servicioID = servicioID;
    }

    if (estado) {
      where.estado = estado;
    }

    const include = [
      {
        model: Pacientes,
        as: 'paciente',
        required: false
      },
      {
        model: Mascotas,
        as: 'mascota',
        required: false
      },
      {
        model: Profesionales,
        as: 'profesional',
        required: false
      },
      {
        model: Servicios,
        as: 'servicio',
        required: false
      },
      {
        model: Consultas,
        as: 'consulta',
        required: false
      }
    ];

    const result = await paginate(Turnos, {
      where,
      include,
      order: [['horaInicio', 'ASC']],
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      distinct: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error listando turnos próximos:', error);
    res.status(500).json({ error: 'Error al listar turnos prรณximos' });
  }
};

// GET /turnos/antiguos - Turnos hasta hoy con paginación
const listarTurnosAntiguos = async (req, res) => {
  try {
    const { 
      pacienteID,
      mascotaID,
      profesionalID,
      servicioID,
      estado,
      page = 1,
      pageSize = 10
    } = req.query;

    const where = {
      estado: { [Op.not]: 'BAJA' }
    };

    // Fecha hasta hoy (fin del día de ayer)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    where.horaInicio = { [Op.lt]: hoy };

    if (mascotaID) {
      where.mascotaID = mascotaID;
    } else if (pacienteID) {
      where.pacienteID = pacienteID;
    }

    if (profesionalID) {
      where.profesionalID = profesionalID;
    }

    if (servicioID) {
      where.servicioID = servicioID;
    }

    if (estado) {
      where.estado = estado;
    }

    const include = [
      {
        model: Pacientes,
        as: 'paciente',
        required: false
      },
      {
        model: Mascotas,
        as: 'mascota',
        required: false
      },
      {
        model: Profesionales,
        as: 'profesional',
        required: false
      },
      {
        model: Servicios,
        as: 'servicio',
        required: false
      },
      {
        model: Consultas,
        as: 'consulta',
        required: false
      }
    ];

    const result = await paginate(Turnos, {
      where,
      include,
      order: [['horaInicio', 'DESC']],
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      distinct: true
    });

    res.json(result);
  } catch (error) {
    console.error('Error listando turnos antiguos:', error);
    res.status(500).json({ error: 'Error al listar turnos antiguos' });
  }
};

module.exports = {
  listarTurnos,
  listarTurnosTodosPorMascota,
  obtenerTurno,
  crearTurno,
  actualizarTurno,
  eliminarTurno,
  cancelarTurno,
  listarTurnosProximos,
  listarTurnosAntiguos
};

// PATCH /turnos/:id/notas - Actualizar solamente las notas del turno
const actualizarNotasTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const turno = await Turnos.findByPk(id);

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    await turno.update({ notas: notas !== undefined ? notas : null });

    const turnoActualizado = await Turnos.findByPk(turno.id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
          required: false
        },
        {
          model: Mascotas,
          as: 'mascota',
          required: false
        },
        {
          model: Profesionales,
          as: 'profesional',
          required: false
        },
        {
          model: Servicios,
          as: 'servicio',
          required: false
        },
        {
          model: Consultas,
          as: 'consulta',
          required: false
        }
      ]
    });

    res.json(turnoActualizado);
  } catch (error) {
    console.error('Error actualizando notas del turno:', error);
    res.status(500).json({ error: 'Error al actualizar notas del turno' });
  }
};

module.exports.actualizarNotasTurno = actualizarNotasTurno;
