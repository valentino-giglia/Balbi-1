const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Productos = sequelize.define('Productos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  costo: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  venta: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  unidad: {
    type: DataTypes.STRING,
    defaultValue: 'unidad'
  },
  proveedor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'productos',
  timestamps: true
});

module.exports = Productos;
