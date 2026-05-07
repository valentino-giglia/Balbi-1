const { Profesionales, Servicios, ProfesionalesServicios } = require('../models');
const { Op } = require('sequelize');
const { paginate } = require('../utils/pagination');

const listarProfesionales = async (req, res) => {
  try {
    const { estado, nombre, codigo, page = 1, pageSize = 10 } = req.query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }
    if (nombre) {
      where.nombre = { [Op.like]: `%${nombre}%` };
    }
    if (codigo) {
      where.codigo = { [Op.like]: `%${codigo}%` };
    }

    const result = await paginate(Profesionales, {
      where,
      order: [['nombre', 'ASC']],
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });

    res.json(result);
  } catch (error) {
    console.error('Error listando profesionales:', error);
    res.status(500).json({ error: 'Error al listar profesionales' });
  }
};

const obtenerProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const profesional = await Profesionales.findByPk(id, {
      include: [{
        model: Servicios,
        as: 'servicios',
        attributes: ['id', 'nombre', 'codigo', 'duracionMinutos', 'color'],
        where: { estado: 'ACTIVO' },
        required: false
      }]
    });

    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    res.json(profesional);
  } catch (error) {
    console.error('Error obteniendo profesional:', error);
    res.status(500).json({ error: 'Error al obtener profesional' });
  }
};

const crearProfesional = async (req, res) => {
  try {
    const { nombre, codigo, telefono, email, color, detalles } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const profesional = await Profesionales.create({
      nombre,
      codigo: codigo || null,
      telefono,
      email,
      color: color || '#1976d2',
      detalles,
      estado: 'ACTIVO'
    });

    res.status(201).json(profesional);
  } catch (error) {
    console.error('Error creando profesional:', error);
    res.status(500).json({ error: 'Error al crear profesional' });
  }
};

const actualizarProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, telefono, email, color, detalles, estado } = req.body;

    const profesional = await Profesionales.findByPk(id);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (codigo !== undefined) updateData.codigo = codigo || null;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (email !== undefined) updateData.email = email;
    if (color) updateData.color = color;
    if (detalles !== undefined) updateData.detalles = detalles;
    if (estado) updateData.estado = estado;

    await profesional.update(updateData);
    res.json(profesional);
  } catch (error) {
    console.error('Error actualizando profesional:', error);
    res.status(500).json({ error: 'Error al actualizar profesional' });
  }
};

const eliminarProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const profesional = await Profesionales.findByPk(id);

    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    await profesional.update({ estado: 'BAJA' });
    res.json({ message: 'Profesional eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando profesional:', error);
    res.status(500).json({ error: 'Error al eliminar profesional' });
  }
};

const listarProfesionalesYServicios = async (req, res) => {
  try {
    const profesionales = await Profesionales.findAll({
      attributes: ['id', 'nombre', 'codigo'],
      where: { estado: 'ACTIVO' },
      include: [{
        model: Servicios,
        as: 'servicios',
        attributes: ['id', 'nombre', 'duracionMinutos', 'codigo'],
        where: { estado: 'ACTIVO' },
        required: false
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({ profesionales });
  } catch (error) {
    console.error('Error listando profesionales y servicios:', error);
    res.status(500).json({ error: 'Error al listar profesionales y servicios' });
  }
};

const actualizarServiciosProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicios } = req.body;

    const profesional = await Profesionales.findByPk(id);
    if (!profesional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    if (!Array.isArray(servicios)) {
      return res.status(400).json({ error: 'servicios debe ser un array' });
    }

    // Eliminar servicios existentes del profesional
    await ProfesionalesServicios.destroy({
      where: { profesionalID: id }
    });

    // Crear nuevos servicios si hay alguno
    if (servicios.length > 0) {
      // Validar que los servicios existen
      const serviciosExistentes = await Servicios.findAll({
        where: {
          id: { [Op.in]: servicios },
          estado: 'ACTIVO'
        }
      });

      if (serviciosExistentes.length !== servicios.length) {
        return res.status(400).json({ error: 'Uno o más servicios no existen o no están activos' });
      }

      // Crear relaciones
      await ProfesionalesServicios.bulkCreate(
        servicios.map(servicioID => ({
          profesionalID: id,
          servicioID,
          estado: 'ACTIVO'
        }))
      );
    }

    // Obtener profesional con servicios actualizados
    const profesionalActualizado = await Profesionales.findByPk(id, {
      include: [{
        model: Servicios,
        as: 'servicios',
        attributes: ['id', 'nombre', 'codigo', 'duracionMinutos', 'color'],
        where: { estado: 'ACTIVO' },
        required: false
      }]
    });

    res.json(profesionalActualizado);
  } catch (error) {
    console.error('Error actualizando servicios del profesional:', error);
    res.status(500).json({ error: 'Error al actualizar servicios del profesional' });
  }
};

module.exports = {
  listarProfesionales,
  obtenerProfesional,
  crearProfesional,
  actualizarProfesional,
  eliminarProfesional,
  listarProfesionalesYServicios,
  actualizarServiciosProfesional
};

