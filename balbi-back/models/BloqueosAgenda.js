const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BloqueosAgenda = sequelize.define('BloqueosAgenda', {
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
  horaInicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  horaFin: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'bloqueos_agenda',
  timestamps: true
});

module.exports = BloqueosAgenda;
