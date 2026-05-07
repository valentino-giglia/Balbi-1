const { CustomFields } = require('../models');
const { Op } = require('sequelize');

const listarCustomFields = async (req, res) => {
  try {
    const { scope, page = 1, pageSize = 100 } = req.query;
    const where = {};

    if (scope) {
      const validScopes = ['consulta', 'ficha'];
      if (!validScopes.includes(scope)) {
        return res.status(400).json({ error: 'scope debe ser consulta o ficha' });
      }
      where.scope = scope;
    }

    const limit = Math.max(1, Math.min(500, parseInt(pageSize, 10) || 100));
    const offset = (Math.max(1, parseInt(page, 10) || 1) - 1) * limit;

    const { count, rows } = await CustomFields.findAndCountAll({
      where,
      order: [['orden', 'ASC'], ['id', 'ASC']],
      limit,
      offset
    });

    res.json({
      data: rows,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: offset + rows.length < count,
        hasPreviousPage: offset > 0
      }
    });
  } catch (error) {
    console.error('Error listando custom fields:', error);
    res.status(500).json({ error: 'Error al listar campos personalizados' });
  }
};

const listarTodos = async (req, res) => {
  try {
    const { scope } = req.query;
    const where = {};
    if (scope) {
      const validScopes = ['consulta', 'ficha'];
      if (!validScopes.includes(scope)) {
        return res.status(400).json({ error: 'scope debe ser consulta o ficha' });
      }
      where.scope = scope;
    }
    const rows = await CustomFields.findAll({
      where,
      order: [['orden', 'ASC'], ['id', 'ASC']]
    });
    res.json(rows);
  } catch (error) {
    console.error('Error listando custom fields:', error);
    res.status(500).json({ error: 'Error al listar campos personalizados' });
  }
};

const obtenerCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const customField = await CustomFields.findByPk(id);

    if (!customField) {
      return res.status(404).json({ error: 'Campo personalizado no encontrado' });
    }

    res.json(customField);
  } catch (error) {
    console.error('Error obteniendo custom field:', error);
    res.status(500).json({ error: 'Error al obtener campo personalizado' });
  }
};

const validScopes = ['consulta', 'ficha'];
const validTypes = ['text', 'number', 'date', 'textarea', 'link'];

const crearCustomField = async (req, res) => {
  try {
    const { key, label, type, scope, orden } = req.body;

    if (!key || !label) {
      return res.status(400).json({ error: 'Clave y etiqueta son requeridos' });
    }

    const keyNormalized = String(key)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const scopeValue = scope || 'consulta';
    if (!validScopes.includes(scopeValue)) {
      return res.status(400).json({ error: 'scope debe ser consulta o ficha' });
    }

    const typeValue = type || 'text';
    if (!validTypes.includes(typeValue)) {
      return res.status(400).json({ error: 'type debe ser uno de: text, number, date, textarea, link' });
    }

    const customField = await CustomFields.create({
      key: keyNormalized || key,
      label: String(label).trim(),
      type: typeValue,
      scope: scopeValue,
      orden: orden != null ? parseInt(orden, 10) : 0
    });

    res.status(201).json(customField);
  } catch (error) {
    console.error('Error creando custom field:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un campo con esa clave' });
    }
    res.status(500).json({ error: 'Error al crear campo personalizado' });
  }
};

const actualizarCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, label, type, scope, orden } = req.body;

    const customField = await CustomFields.findByPk(id);
    if (!customField) {
      return res.status(404).json({ error: 'Campo personalizado no encontrado' });
    }

    const updateData = {};
    if (key !== undefined) {
      const keyNormalized = String(key)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      updateData.key = keyNormalized || key;
    }
    if (label !== undefined) updateData.label = String(label).trim();
    if (type !== undefined) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'type debe ser uno de: text, number, date, textarea, link' });
      }
      updateData.type = type;
    }
    if (scope !== undefined) {
      if (!validScopes.includes(scope)) {
        return res.status(400).json({ error: 'scope debe ser consulta o ficha' });
      }
      updateData.scope = scope;
    }
    if (orden !== undefined) updateData.orden = parseInt(orden, 10);

    await customField.update(updateData);

    res.json(customField);
  } catch (error) {
    console.error('Error actualizando custom field:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un campo con esa clave' });
    }
    res.status(500).json({ error: 'Error al actualizar campo personalizado' });
  }
};

const eliminarCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const customField = await CustomFields.findByPk(id);

    if (!customField) {
      return res.status(404).json({ error: 'Campo personalizado no encontrado' });
    }

    await customField.destroy();
    res.json({ message: 'Campo personalizado eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando custom field:', error);
    res.status(500).json({ error: 'Error al eliminar campo personalizado' });
  }
};

module.exports = {
  listarCustomFields,
  listarTodos,
  obtenerCustomField,
  crearCustomField,
  actualizarCustomField,
  eliminarCustomField
};

