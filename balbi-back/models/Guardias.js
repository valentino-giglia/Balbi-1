const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Guardias = sequelize.define('Guardias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  profesionalID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'profesionales',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.STRING(50),
    defaultValue: 'Guardia 24hs'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  desde: {
    type: DataTypes.STRING(5)
  },
  hasta: {
    type: DataTypes.STRING(5)
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'guardias',
  timestamps: true
});

module.exports = Guardias;
