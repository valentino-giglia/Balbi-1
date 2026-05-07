const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MascotaPaciente = sequelize.define('MascotaPaciente', {
  mascotaID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'mascotas',
      key: 'id'
    }
  },
  pacienteID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'pacientes',
      key: 'id'
    }
  }
}, {
  tableName: 'mascota_pacientes',
  timestamps: true
});

module.exports = MascotaPaciente;
