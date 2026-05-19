const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consultas = sequelize.define('Consultas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nota: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  extra: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos extra de la consulta (estructura configurable desde el servicio)'
  },
  motivoConsulta: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  examenClinico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  planTratamiento: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pesoKg: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  mascotaID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'mascotas', key: 'id' }
  },
  vet: {
    type: DataTypes.STRING(150),
    allowNull: true
  }
}, {
  tableName: 'consultas',
  timestamps: true
});

module.exports = Consultas;
