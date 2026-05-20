const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Internados = sequelize.define('Internados', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mascotaID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'mascotas',
      key: 'id'
    }
  },
  profesionalID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'profesionales',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.STRING(30),
    defaultValue: 'estable'
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ingreso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  plan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dieta: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  controles: {
    type: DataTypes.JSON,
    allowNull: true
  },
  estadoPaciente: {
    type: DataTypes.ENUM('ACTIVO', 'ALTA', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'internados',
  timestamps: true
});

module.exports = Internados;
