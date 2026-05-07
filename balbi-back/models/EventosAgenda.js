const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventosAgenda = sequelize.define('EventosAgenda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('TRASLADO', 'ENVIO_MUESTRAS', 'CADETERIA'),
    allowNull: false
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
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'eventos_agenda',
  timestamps: true
});

module.exports = EventosAgenda;
