const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mascotas = sequelize.define('Mascotas', {
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
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  especie: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  raza: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'mascotas',
  timestamps: true
});

module.exports = Mascotas;
