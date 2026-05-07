const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pacientes = sequelize.define('Pacientes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidEmail(value) {
        if (value === null || value === undefined || value === '') return;
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        if (!ok) throw new Error('Email inválido');
      }
    }
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  sn_derivado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  kapso_phone_number_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  kapso_conversation_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  kapso_agent_status: {
    type: DataTypes.ENUM('ON', 'OFF'),
    defaultValue: 'ON'
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'pacientes',
  timestamps: true
});

module.exports = Pacientes;
