const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UsuarioRol = sequelize.define('UsuarioRol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rolID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    },
    field: 'rolID'
  },
  usuarioID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    field: 'usuarioID'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'usuario_roles',
  timestamps: true
});

module.exports = UsuarioRol;
