const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rol = sequelize.define('Rol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'roles',
  timestamps: true
});

module.exports = Rol;
