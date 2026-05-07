const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BAJA'),
    defaultValue: 'ACTIVO'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.contrasena) {
        usuario.contrasena = await bcrypt.hash(usuario.contrasena, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('contrasena')) {
        usuario.contrasena = await bcrypt.hash(usuario.contrasena, 10);
      }
    }
  }
});

Usuario.prototype.validarContrasena = async function(contrasena) {
  return await bcrypt.compare(contrasena, this.contrasena);
};

module.exports = Usuario;
