const { Servicios, Turnos, Profesionales, Pacientes, ProfesionalesServicios, Horarios } = require('../models');
const { Op } = require('sequelize');

// Función auxiliar para formatear fecha con ajuste de zona horaria UTC-3
const formatearFechaArgentina = (fecha) => {
  const fechaAjustada = new Date(fecha.getTime() - 3 * 60 * 60 * 1000); // Restar 3 horas
  return fechaAjustada.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

// GET /servicios/text - Devuelve servicios en formato texto
const getServiciosText = async (req, res) => {
  try {
    const servicios = await Servicios.findAll({
      where: { estado: 'ACTIVO' },
      order: [['nombre', 'ASC']],
      attributes: ['nombre', 'codigo', 'duracionMinutos']
    });

    let text = 'SERVICIOS DISPONIBLES:\n\n';
    
    servicios.forEach((servicio, index) => {
      text += `${index + 1}. Nombre: ${servicio.nombre}\n`;
      text += `   Código: ${servicio.codigo}\n`;
      text += `   Duración: ${servicio.duracionMinutos} minutos\n\n`;
    });

    res.json({ text });
  } catch (error) {
    console.error('Error obteniendo servicios en formato texto:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

// POST /turnos - Crea un turno usando códigos
const crearTurnoPorCodigos = async (req, res) => {
  try {
    const {
      fechaInicio,
      codigoServicio,
      codigoProfesional,
      pacienteID,
      estado
    } = req.body;

    // Validaciones básicas
    if (!fechaInicio || !codigoServicio) {
      return res.status(400).json({ 
        error: 'fechaInicio y codigoServicio son requeridos' 
      });
    }

    // Buscar servicio por código
    const servicio = await Servicios.findOne({
      where: { codigo: codigoServicio, estado: 'ACTIVO' }
    });

    if (!servicio) {
      return res.status(404).json({ error: `Servicio con código ${codigoServicio} no encontrado` });
    }

    // Validar paciente si se proporciona
    if (pacienteID) {
      const paciente = await Pacientes.findByPk(pacienteID);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }

    // Parsear fecha de inicio
    const fechaInicioDate = new Date(fechaInicio);
    if (isNaN(fechaInicioDate.getTime())) {
      return res.status(400).json({ error: 'fechaInicio no es una fecha válida' });
    }

    // Calcular fecha de fin basada en la duración
    const fechaFinDate = new Date(fechaInicioDate.getTime() + servicio.duracionMinutos * 60000);

    // Validar estado si se proporciona
    const estadosValidos = ['RESERVADO', 'PENDIENTE', 'CANCELADO', 'COMPLETADO', 'BAJA'];
    if (estado && !estadosValidos.includes(estado.toUpperCase())) {
      return res.status(400).json({ 
        error: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}` 
      });
    }

    let profesional;

    // Si codigoProfesional es null, buscar el primer profesional que atiende el servicio
    if (!codigoProfesional) {
      const profesionalServicio = await ProfesionalesServicios.findOne({
        where: { 
          servicioID: servicio.id,
          estado: 'ACTIVO'
        },
        include: [{
          model: Profesionales,
          as: 'profesional',
          where: { estado: 'ACTIVO' },
          required: true
        }]
      });

      if (!profesionalServicio) {
        return res.status(404).json({ 
          error: `No se encontraron profesionales activos que atiendan el servicio ${codigoServicio}` 
        });
      }

      profesional = profesionalServicio.profesional;
    } else {
      // Buscar profesional específico por código
      profesional = await Profesionales.findOne({
        where: { 
          codigo: codigoProfesional,
          estado: 'ACTIVO' 
        }
      });

      if (!profesional) {
        return res.status(404).json({ error: `Profesional con código ${codigoProfesional} no encontrado` });
      }

      // Verificar que el profesional atiende el servicio
      const profesionalServicio = await ProfesionalesServicios.findOne({
        where: {
          profesionalID: profesional.id,
          servicioID: servicio.id,
          estado: 'ACTIVO'
        }
      });

      if (!profesionalServicio) {
        return res.status(400).json({ 
          error: `El profesional ${codigoProfesional} no atiende el servicio ${codigoServicio}` 
        });
      }
    }

    // Crear el turno
    const turno = await Turnos.create({
      pacienteID: pacienteID || null,
      profesionalID: profesional.id,
      servicioID: servicio.id,
      horaInicio: fechaInicioDate,
      horaFin: fechaFinDate,
      duracionMinutos: servicio.duracionMinutos,
      estado: estado || 'RESERVADO'
    });

    // Obtener el turno completo con relaciones
    const turnoCompleto = await Turnos.findByPk(turno.id, {
      include: [
        {
          model: Pacientes,
          as: 'paciente',
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
        }
      ]
    });

    // Construir mensaje en formato texto
    const fechaInicioFormateada = formatearFechaArgentina(fechaInicioDate);
    const fechaFinFormateada = formatearFechaArgentina(fechaFinDate);

    let text = 'TURNO CREADO EXITOSAMENTE\n\n';
    text += `ID Turno: ${turnoCompleto.id}\n`;
    text += `Profesional: ${turnoCompleto.profesional.nombre}\n`;
    text += `Servicio: ${turnoCompleto.servicio.nombre}\n`;
    text += `Fecha y Hora Inicio: ${fechaInicioFormateada}\n`;
    text += `Fecha y Hora Fin: ${fechaFinFormateada}\n`;
    text += `Duración: ${turnoCompleto.servicio.duracionMinutos} minutos\n`;
    
    if (turnoCompleto.paciente) {
      text += `Paciente: ${turnoCompleto.paciente.nombre}\n`;
    } else {
      text += `Paciente: No asignado\n`;
    }
    
    text += `Estado: ${turnoCompleto.estado}\n`;

    res.status(201).json({ text });
  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ error: 'Error al crear turno' });
  }
};

// GET /turnos/pacientes/:pacienteID/text - Devuelve turnos del paciente en formato texto
const getTurnosPacienteText = async (req, res) => {
  try {
    const { pacienteID } = req.params;

    // Validar que el paciente existe
    const paciente = await Pacientes.findByPk(pacienteID);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Obtener fecha/hora actual (inicio del día de hoy)
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);

    // Obtener turnos del paciente desde hoy en adelante
    const turnos = await Turnos.findAll({
      where: {
        pacienteID: pacienteID,
        estado: { [Op.not]: 'BAJA' },
        horaInicio: { [Op.gte]: ahora }
      },
      include: [
        {
          model: Pacientes,
          as: 'paciente',
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
      ],
      order: [['horaInicio', 'ASC']]
    });

    // Formatear en texto
    let text = `TURNOS DEL PACIENTE: ${paciente.nombre}\n`;
    text += `DNI: ${paciente.dni}\n\n`;

    if (turnos.length === 0) {
      text += 'No tiene turnos registrados desde hoy en adelante.\n';
    } else {
      text += `Total de turnos (desde hoy): ${turnos.length}\n\n`;

      turnos.forEach((turno, index) => {
        const fechaInicio = formatearFechaArgentina(new Date(turno.horaInicio));
        const fechaFin = formatearFechaArgentina(new Date(turno.horaFin));

        text += `${index + 1}. TURNO #${turno.id}\n`;
        text += `   Fecha y Hora Inicio: ${fechaInicio}\n`;
        text += `   Fecha y Hora Fin: ${fechaFin}\n`;
        text += `   Duración: ${turno.duracionMinutos} minutos\n`;
        
        if (turno.profesional) {
          text += `   Profesional: ${turno.profesional.nombre}\n`;
        }
        
        if (turno.servicio) {
          text += `   Servicio: ${turno.servicio.nombre}\n`;
        }
        
        if (turno.precio) {
          text += `   Precio: $${turno.precio}\n`;
        }
        
        text += `   Estado: ${turno.estado}\n`;
        
        if (turno.notas) {
          text += `   Notas: ${turno.notas}\n`;
        }
        
        text += '\n';
      });
    }

    res.json({ text });
  } catch (error) {
    console.error('Error obteniendo turnos del paciente en formato texto:', error);
    res.status(500).json({ error: 'Error al obtener turnos del paciente' });
  }
};

// DELETE /turnos - Cancela un turno
const cancelarTurno = async (req, res) => {
  try {
    const {
      codigoServicio,
      fechaInicio,
      pacienteID
    } = req.body;

    // Validaciones básicas
    if (!codigoServicio || !fechaInicio || !pacienteID) {
      return res.status(400).json({ 
        error: 'codigoServicio, fechaInicio y pacienteID son requeridos' 
      });
    }

    // Validar que el paciente existe
    const paciente = await Pacientes.findByPk(pacienteID);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Buscar servicio por código
    const servicio = await Servicios.findOne({
      where: { codigo: codigoServicio, estado: 'ACTIVO' }
    });

    if (!servicio) {
      return res.status(404).json({ error: `Servicio con código ${codigoServicio} no encontrado` });
    }

    // Parsear fecha de inicio
    const fechaInicioDate = new Date(fechaInicio);
    if (isNaN(fechaInicioDate.getTime())) {
      return res.status(400).json({ error: 'fechaInicio no es una fecha válida' });
    }

    // Buscar turno que coincida con los parámetros
    // Permite un margen de tolerancia de 1 minuto para la fecha
    const fechaInicioMin = new Date(fechaInicioDate.getTime() - 60000);
    const fechaInicioMax = new Date(fechaInicioDate.getTime() + 60000);

    const turno = await Turnos.findOne({
      where: {
        pacienteID: pacienteID,
        servicioID: servicio.id,
        horaInicio: {
          [Op.between]: [fechaInicioMin, fechaInicioMax]
        },
        estado: { [Op.notIn]: ['CANCELADO', 'BAJA'] }
      },
      include: [
        {
          model: Pacientes,
          as: 'paciente',
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
        }
      ]
    });

    if (!turno) {
      return res.status(404).json({ 
        error: 'Turno no encontrado con los parámetros proporcionados' 
      });
    }

    // Cancelar el turno
    await turno.update({ estado: 'CANCELADO' });

    // Construir mensaje en formato texto
    const fechaInicioFormateada = formatearFechaArgentina(new Date(turno.horaInicio));
    const fechaFinFormateada = formatearFechaArgentina(new Date(turno.horaFin));

    let text = 'TURNO CANCELADO EXITOSAMENTE\n\n';
    text += `ID Turno: ${turno.id}\n`;
    text += `Profesional: ${turno.profesional?.nombre || 'N/A'}\n`;
    text += `Servicio: ${turno.servicio?.nombre || 'N/A'}\n`;
    text += `Paciente: ${turno.paciente?.nombre || 'N/A'}\n`;
    text += `Fecha y Hora Inicio: ${fechaInicioFormateada}\n`;
    text += `Fecha y Hora Fin: ${fechaFinFormateada}\n`;
    text += `Estado: CANCELADO\n`;

    res.json({ text });
  } catch (error) {
    console.error('Error cancelando turno:', error);
    res.status(500).json({ error: 'Error al cancelar turno' });
  }
};

// GET /profesionales/text - Devuelve profesionales en formato texto
const getProfesionalesText = async (req, res) => {
  try {
    const profesionales = await Profesionales.findAll({
      where: { estado: 'ACTIVO' },
      order: [['nombre', 'ASC']],
      include: [
        {
          model: Servicios,
          as: 'servicios',
          through: {
            attributes: [],
            where: { estado: 'ACTIVO' }
          },
          where: { estado: 'ACTIVO' },
          required: false,
          attributes: ['nombre', 'codigo']
        },
        {
          model: Horarios,
          as: 'horarios',
          required: false,
          attributes: ['diaSemana', 'horaInicio', 'horaFin']
        }
      ]
    });

    let text = 'PROFESIONALES DISPONIBLES:\n\n';
    
    profesionales.forEach((profesional, index) => {
      text += `${index + 1}. PROFESIONAL: ${profesional.nombre}\n`;
      text += `   Código: ${profesional.codigo || 'N/A'}\n`;
      
      // Servicios
      if (profesional.servicios && profesional.servicios.length > 0) {
        text += `   Servicios:\n`;
        profesional.servicios.forEach((servicio) => {
          text += `     - ${servicio.nombre} (Código: ${servicio.codigo})\n`;
        });
      } else {
        text += `   Servicios: No tiene servicios asignados\n`;
      }
      
      // Horarios
      if (profesional.horarios && profesional.horarios.length > 0) {
        // Ordenar horarios por día y hora
        const horariosOrdenados = profesional.horarios.sort((a, b) => {
          const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          const diaA = diasSemana.indexOf(a.diaSemana);
          const diaB = diasSemana.indexOf(b.diaSemana);
          if (diaA !== diaB) return diaA - diaB;
          return a.horaInicio.localeCompare(b.horaInicio);
        });
        
        text += `   Disponibilidad Horaria:\n`;
        horariosOrdenados.forEach((horario) => {
          text += `     - ${horario.diaSemana}: ${horario.horaInicio} - ${horario.horaFin}\n`;
        });
      } else {
        text += `   Disponibilidad Horaria: No tiene horarios definidos\n`;
      }
      
      text += '\n';
    });

    res.json({ text });
  } catch (error) {
    console.error('Error obteniendo profesionales en formato texto:', error);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
};

// Función auxiliar para obtener nombre del día de la semana en español
const obtenerDiaSemana = (fecha) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[fecha.getDay()];
};

// Función auxiliar para convertir hora TIME a minutos del día
const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

// Función auxiliar para verificar si un slot está ocupado
const estaOcupado = (slotInicio, slotFin, turnosOcupados) => {
  return turnosOcupados.some(turno => {
    const turnoInicio = new Date(turno.horaInicio).getTime();
    const turnoFin = new Date(turno.horaFin).getTime();
    const slotInicioTime = slotInicio.getTime();
    const slotFinTime = slotFin.getTime();
    
    // Verificar solapamiento
    return (slotInicioTime < turnoFin && slotFinTime > turnoInicio);
  });
};

// GET /turnos/disponibles/text - Verifica turnos disponibles
const getTurnosDisponiblesText = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, codigoServicio } = req.query;

    // Validación de codigoServicio
    if (!codigoServicio) {
      return res.status(400).json({ 
        error: 'codigoServicio es requerido' 
      });
    }

    // Buscar servicio
    const servicio = await Servicios.findOne({
      where: { codigo: codigoServicio, estado: 'ACTIVO' }
    });

    if (!servicio) {
      return res.status(404).json({ error: `Servicio con código ${codigoServicio} no encontrado` });
    }

    // Filtro por rango de fechas con valores por defecto (7 días)
    let fechaInicioDate;
    let fechaFinDate;

    // Caso 1: No vienen fechas - desde hoy hasta los próximos 7 días
    if (!fechaInicio && !fechaFin) {
      fechaInicioDate = new Date();
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date();
      fechaFinDate.setDate(fechaFinDate.getDate() + 7);
      fechaFinDate.setHours(23, 59, 59, 999);
    }
    // Caso 2: Solo viene fechaInicio - desde esa fecha hasta 7 días después
    else if (fechaInicio && !fechaFin) {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({ error: 'fechaInicio no es una fecha válida' });
      }
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date(fechaInicioDate);
      fechaFinDate.setDate(fechaFinDate.getDate() + 10);
      fechaFinDate.setHours(23, 59, 59, 999);
    }
    // Caso 3: Solo viene fechaFin - desde hoy hasta esa fecha
    else if (!fechaInicio && fechaFin) {
      fechaInicioDate = new Date();
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({ error: 'fechaFin no es una fecha válida' });
      }
      fechaFinDate.setHours(23, 59, 59, 999);
    }
    // Caso 4: Vienen ambas fechas - usar las proporcionadas
    else {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({ error: 'fechaInicio no es una fecha válida' });
      }
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({ error: 'fechaFin no es una fecha válida' });
      }
      fechaFinDate.setHours(23, 59, 59, 999);
    }

    // Buscar profesionales que atienden el servicio
    const profesionalesServicios = await ProfesionalesServicios.findAll({
      where: {
        servicioID: servicio.id,
        estado: 'ACTIVO'
      },
      include: [{
        model: Profesionales,
        as: 'profesional',
        where: { estado: 'ACTIVO' },
        required: true,
        include: [{
          model: Horarios,
          as: 'horarios',
          required: false
        }]
      }]
    });

    if (profesionalesServicios.length === 0) {
      return res.status(404).json({ 
        error: `No se encontraron profesionales activos que atiendan el servicio ${codigoServicio}` 
      });
    }

    // Obtener todos los turnos ocupados en el rango de fechas
    const turnosOcupados = await Turnos.findAll({
      where: {
        horaInicio: {
          [Op.between]: [fechaInicioDate, fechaFinDate]
        },
        estado: { [Op.notIn]: ['CANCELADO', 'BAJA'] }
      },
      attributes: ['profesionalID', 'horaInicio', 'horaFin']
    });

    // Estructura para almacenar turnos disponibles
    const turnosDisponibles = {};
    const resumenProfesionales = {};

    // Procesar cada profesional
    for (const ps of profesionalesServicios) {
      const profesional = ps.profesional;
      const profesionalId = profesional.id;
      const profesionalNombre = profesional.nombre;
      const profesionalCodigo = profesional.codigo || 'N/A';

      if (!resumenProfesionales[profesionalId]) {
        resumenProfesionales[profesionalId] = {
          nombre: profesionalNombre,
          codigo: profesionalCodigo,
          porDia: {}
        };
      }

      // Procesar cada día en el rango
      const fechaActual = new Date(fechaInicioDate);
      while (fechaActual <= fechaFinDate) {
        const diaSemana = obtenerDiaSemana(fechaActual);
        const fechaStr = fechaActual.toISOString().split('T')[0];

        // Buscar horarios del profesional para este día
        const horariosDelDia = profesional.horarios.filter(h => h.diaSemana === diaSemana);

        for (const horario of horariosDelDia) {
          const horaInicioHorario = horaAMinutos(horario.horaInicio);
          const horaFinHorario = horaAMinutos(horario.horaFin);
          const duracionServicio = servicio.duracionMinutos;

          // Generar slots de tiempo
          let slotMinutos = horaInicioHorario;
          while (slotMinutos + duracionServicio <= horaFinHorario) {
            const slotInicio = new Date(fechaActual);
            slotInicio.setHours(Math.floor(slotMinutos / 60), slotMinutos % 60, 0, 0);
            
            const slotFin = new Date(slotInicio);
            slotFin.setMinutes(slotFin.getMinutes() + duracionServicio);

            // Verificar si el profesional tiene turnos ocupados en este slot
            const turnosOcupadosProfesional = turnosOcupados.filter(
              t => t.profesionalID === profesionalId
            );

            if (!estaOcupado(slotInicio, slotFin, turnosOcupadosProfesional)) {
              // Slot disponible
              if (!turnosDisponibles[fechaStr]) {
                turnosDisponibles[fechaStr] = {};
              }
              if (!turnosDisponibles[fechaStr][diaSemana]) {
                turnosDisponibles[fechaStr][diaSemana] = [];
              }

              const horaFormateada = slotInicio.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit'
              });

              turnosDisponibles[fechaStr][diaSemana].push({
                hora: horaFormateada,
                profesional: profesionalNombre,
                codigo: profesionalCodigo,
                profesionalId: profesionalId
              });

              // Contar por día
              if (!resumenProfesionales[profesionalId].porDia[fechaStr]) {
                resumenProfesionales[profesionalId].porDia[fechaStr] = 0;
              }
              resumenProfesionales[profesionalId].porDia[fechaStr]++;
            }

            slotMinutos += duracionServicio;
          }
        }

        // Avanzar al siguiente día
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    }

    // Formatear respuesta en texto
    let text = 'TURNOS DISPONIBLES\n\n';
    text += `Servicio: ${servicio.nombre}\n`;
    text += `Duración: ${servicio.duracionMinutos} minutos\n`;
    text += `Rango de fechas: ${formatearFechaArgentina(fechaInicioDate)} - ${formatearFechaArgentina(fechaFinDate)}\n\n`;

    // Ordenar fechas
    const fechasOrdenadas = Object.keys(turnosDisponibles).sort();

    if (fechasOrdenadas.length === 0) {
      text += 'No se encontraron turnos disponibles en el rango de fechas especificado.\n';
    } else {
      text += 'HORARIOS DISPONIBLES:\n\n';

      for (const fechaStr of fechasOrdenadas) {
        const fecha = new Date(fechaStr + 'T00:00:00');
        const diaSemana = obtenerDiaSemana(fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        text += `${fechaFormateada} (${diaSemana}):\n`;

        const diasSemana = Object.keys(turnosDisponibles[fechaStr]).sort((a, b) => {
          const orden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          return orden.indexOf(a) - orden.indexOf(b);
        });

        for (const dia of diasSemana) {
          const slots = turnosDisponibles[fechaStr][dia];
          slots.sort((a, b) => a.hora.localeCompare(b.hora));

          for (const slot of slots) {
            text += `   ${slot.hora} - ${slot.profesional})\n`;
          }
        }

        text += '\n';
      }

      // Resumen por profesional separado por días
      text += 'RESUMEN POR PROFESIONAL:\n\n';
      const profesionalesOrdenados = Object.values(resumenProfesionales).sort((a, b) => {
        const totalA = Object.values(a.porDia).reduce((sum, count) => sum + count, 0);
        const totalB = Object.values(b.porDia).reduce((sum, count) => sum + count, 0);
        return totalB - totalA;
      });

      for (const prof of profesionalesOrdenados) {
        const totalTurnos = Object.values(prof.porDia).reduce((sum, count) => sum + count, 0);
        text += `${prof.nombre} (Código: ${prof.codigo}): ${totalTurnos} turnos disponibles en total\n`;
        
        // Mostrar por día
        const fechasProf = Object.keys(prof.porDia).sort();
        for (const fechaProf of fechasProf) {
          const fechaObj = new Date(fechaProf + 'T00:00:00');
          const diaSemanaProf = obtenerDiaSemana(fechaObj);
          const fechaFormateadaProf = fechaObj.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          text += `   ${fechaFormateadaProf} (${diaSemanaProf}): ${prof.porDia[fechaProf]} turnos\n`;
        }
        text += '\n';
      }
    }

    res.json({ text });
  } catch (error) {
    console.error('Error obteniendo turnos disponibles:', error);
    res.status(500).json({ error: 'Error al obtener turnos disponibles' });
  }
};

// GET /turnos/text - Devuelve turnos agendados en formato texto
const getTurnosText = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, codigoServicio } = req.query;

    // Construir condiciones de filtro
    const whereConditions = {
      estado: { [Op.notIn]: ['CANCELADO', 'BAJA'] }
    };

    // Filtro por rango de fechas con valores por defecto
    let fechaInicioDate;
    let fechaFinDate;

    // Caso 1: No vienen fechas - desde hoy hasta los próximos 10 días
    if (!fechaInicio && !fechaFin) {
      fechaInicioDate = new Date();
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date();
      fechaFinDate.setDate(fechaFinDate.getDate() + 10);
      fechaFinDate.setHours(23, 59, 59, 999);
    }
    // Caso 2: Solo viene fechaInicio - desde esa fecha hasta 10 días después
    else if (fechaInicio && !fechaFin) {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({ error: 'fechaInicio no es una fecha válida' });
      }
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date(fechaInicioDate);
      fechaFinDate.setDate(fechaFinDate.getDate() + 10);
      fechaFinDate.setHours(23, 59, 59, 999);
    }
    // Caso 3: Solo viene fechaFin - desde hoy hasta esa fecha
    else if (!fechaInicio && fechaFin) {
      fechaInicioDate = new Date();
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({ error: 'fechaFin no es una fecha válida' });
      }
      fechaFinDate.setHours(23, 59, 59, 999);
    }
    // Caso 4: Vienen ambas fechas - usar las proporcionadas
    else {
      fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({ error: 'fechaInicio no es una fecha válida' });
      }
      fechaInicioDate.setHours(0, 0, 0, 0);
      
      fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({ error: 'fechaFin no es una fecha válida' });
      }
      fechaFinDate.setHours(23, 59, 59, 999);
    }

    // Aplicar filtros de fecha
    whereConditions.horaInicio = {
      [Op.gte]: fechaInicioDate,
      [Op.lte]: fechaFinDate
    };

    // Filtro por código de servicio
    let servicioFilter = null;
    if (codigoServicio) {
      servicioFilter = await Servicios.findOne({
        where: { codigo: codigoServicio, estado: 'ACTIVO' }
      });
      
      if (!servicioFilter) {
        return res.status(404).json({ error: `Servicio con código ${codigoServicio} no encontrado` });
      }
      
      whereConditions.servicioID = servicioFilter.id;
    }

    // Obtener turnos
    const turnos = await Turnos.findAll({
      where: whereConditions,
      include: [
        {
          model: Profesionales,
          as: 'profesional',
          required: true,
          attributes: ['nombre', 'codigo']
        },
        {
          model: Servicios,
          as: 'servicio',
          required: true,
          attributes: ['nombre', 'codigo']
        }
      ],
      order: [['horaInicio', 'ASC']]
    });

    // Formatear en texto
    let text = 'TURNOS AGENDADOS:\n\n';
    
    if (turnos.length === 0) {
      text += 'No se encontraron turnos con los filtros proporcionados.\n';
    } else {
      text += `Total de turnos: ${turnos.length}\n\n`;
      
      turnos.forEach((turno, index) => {
        const fechaInicioFormateada = formatearFechaArgentina(new Date(turno.horaInicio));
        const fechaFinFormateada = formatearFechaArgentina(new Date(turno.horaFin));
        
        text += `${index + 1}. TURNO #${turno.id}\n`;
        text += `   Fecha y Hora Inicio: ${fechaInicioFormateada}\n`;
        text += `   Fecha y Hora Fin: ${fechaFinFormateada}\n`;
        text += `   Profesional: ${turno.profesional.nombre} (Código: ${turno.profesional.codigo || 'N/A'})\n`;
        text += `   Servicio: ${turno.servicio.nombre} (Código: ${turno.servicio.codigo})\n`;
        text += '\n';
      });
    }

    res.json({ text });
  } catch (error) {
    console.error('Error obteniendo turnos en formato texto:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
};

module.exports = {
  getServiciosText,
  crearTurnoPorCodigos,
  getTurnosPacienteText,
  cancelarTurno,
  getProfesionalesText,
  getTurnosText,
  getTurnosDisponiblesText
};
