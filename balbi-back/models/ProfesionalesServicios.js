const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProfesionalesServicios = sequelize.define('ProfesionalesServicios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  profesionalID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profesionales',
      key: 'id'
    }
  },
  servicioID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'profesionales_servicios',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['profesionalID', 'servicioID'],
      name: 'unique_profesional_servicio'
    }
  ]
});

module.exports = ProfesionalesServicios;
