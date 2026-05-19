const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LibretaItem = sequelize.define('LibretaItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  mascotaID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'mascotas', key: 'id' }
  },
  categoria: {
    type: DataTypes.ENUM('vacunas', 'antiparasitarios', 'cirugias', 'estudios', 'medicacion', 'alergias'),
    allowNull: false
  },
  nombre: { type: DataTypes.STRING(255), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: true },
  proxima: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'vigente' },
  notas: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'libreta_items',
  timestamps: true
});

module.exports = LibretaItem;
