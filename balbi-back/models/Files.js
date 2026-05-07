const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Files = sequelize.define('Files', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  storagePath: {
    type: DataTypes.STRING(512),
    allowNull: false
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
  turnoID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'turnos',
      key: 'id'
    }
  },
  nombreArchivo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tipoArchivo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: 'IMAGEN, DOCUMENTO'
  }
}, {
  tableName: 'files',
  timestamps: true
});

module.exports = Files;
