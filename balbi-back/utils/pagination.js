/**
 * Helper para paginación de resultados
 * @param {Object} Model - Modelo de Sequelize
 * @param {Object} options - Opciones de consulta
 * @param {Object} options.where - Condiciones WHERE
 * @param {Object} options.include - Includes de Sequelize
 * @param {Array} options.order - Ordenamiento
 * @param {Number} options.page - Página actual (default: 1)
 * @param {Number} options.pageSize - Tamaño de página (default: 10)
 * @returns {Promise<Object>} - Objeto con data y paginación
 */
const paginate = async (Model, options = {}) => {
  const {
    where = {},
    include = null,
    order = null,
    page = 1,
    pageSize = 10,
    attributes = null,
    distinct = false
  } = options;

  // Validar y convertir parámetros de paginación
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10)); // Máximo 100 por página
  const offset = (currentPage - 1) * limit;

  // Construir opciones de consulta
  const findOptions = {
    where,
    limit,
    offset,
    distinct: distinct || false
  };

  if (include) {
    findOptions.include = include;
  }

  if (order) {
    findOptions.order = order;
  }

  if (attributes) {
    findOptions.attributes = attributes;
  }

  // Ejecutar consultas en paralelo
  // Para count con includes, necesitamos usar distinct: true y col: 'id'
  const countOptions = { where };
  if (include && distinct) {
    countOptions.distinct = true;
    countOptions.col = 'id';
  }

  const [data, total] = await Promise.all([
    Model.findAll(findOptions),
    Model.count(countOptions)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: currentPage,
      pageSize: limit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  };
};

module.exports = {
  paginate
};
