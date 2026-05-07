const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vacunas = sequelize.define('Vacunas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mascotaID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'mascotas',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre de la vacuna'
  },
  fechaAplicacion: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  proximaDosis: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'vacunas',
  timestamps: true
});

module.exports = Vacunas;
