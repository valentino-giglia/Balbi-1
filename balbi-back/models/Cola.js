const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cola = sequelize.define('Cola', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  petName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  species: {
    type: DataTypes.STRING,
    defaultValue: 'Canino'
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  triage: {
    type: DataTypes.STRING(20),
    defaultValue: 'verde'
  },
  espera: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  primera: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  llegada: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('ESPERANDO', 'ATENDIDO', 'BAJA'),
    defaultValue: 'ESPERANDO'
  }
}, {
  tableName: 'cola_atencion',
  timestamps: true
});

module.exports = Cola;
