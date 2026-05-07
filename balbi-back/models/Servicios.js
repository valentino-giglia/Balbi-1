const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Servicios = sequelize.define('Servicios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  duracionMinutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#1976d2'
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Precio del servicio'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'servicios',
  timestamps: true
});

module.exports = Servicios;
