const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fichas = sequelize.define('Fichas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pacientes',
      key: 'id'
    }
  },
  mascotaID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'mascotas',
      key: 'id'
    }
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  extra: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos extra de la ficha (estructura configurable desde el servicio)'
  }
}, {
  tableName: 'fichas',
  timestamps: true
});

module.exports = Fichas;
