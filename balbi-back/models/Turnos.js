const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Turnos = sequelize.define('Turnos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pacientes',
      key: 'id'
    }
  },
  profesionalID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profesionales',
      key: 'id'
    }
  },
  servicioID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios',
      key: 'id'
    }
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  horaInicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  horaFin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duracionMinutos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('RESERVADO', 'PENDIENTE', 'CANCELADO', 'COMPLETADO', 'BAJA'),
    defaultValue: 'RESERVADO'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consultaID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'consultas',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('CONSULTORIO', 'DOMICILIO', 'INTERNACION'),
    allowNull: false,
    defaultValue: 'CONSULTORIO'
  },
  mascotaID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'mascotas',
      key: 'id'
    }
  },
  googleEventId: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'turnos',
  timestamps: true
});

module.exports = Turnos;
