const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Horarios = sequelize.define('Horarios', {
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
  diaSemana: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  horaInicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  horaFin: {
    type: DataTypes.TIME,
    allowNull: false
  }
}, {
  tableName: 'horarios',
  timestamps: true
});

module.exports = Horarios;
