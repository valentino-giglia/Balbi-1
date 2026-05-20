const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alertas = sequelize.define('Alertas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.STRING(30),
    defaultValue: 'info'
  },
  petName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  msg: {
    type: DataTypes.STRING,
    allowNull: true
  },
  detalle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  minutos: {
    type: DataTypes.INTEGER,
    defaultValue: 15
  },
  severity: {
    type: DataTypes.STRING(20),
    defaultValue: 'info'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVA', 'RESUELTA', 'BAJA'),
    defaultValue: 'ACTIVA'
  }
}, {
  tableName: 'alertas',
  timestamps: true
});

module.exports = Alertas;
