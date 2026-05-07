const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profesionales = sequelize.define('Profesionales', {
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
    allowNull: true,
    unique: true
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#1976d2'
  },
  detalles: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'profesionales',
  timestamps: true
});

module.exports = Profesionales;
