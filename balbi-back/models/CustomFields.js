const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomFields = sequelize.define('CustomFields', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Clave interna (ej: peso, altura). Usada en extras JSON de consulta o ficha'
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Etiqueta visible en la UI'
  },
  type: {
    type: DataTypes.ENUM('text', 'number', 'date', 'textarea', 'link'),
    allowNull: true,
    defaultValue: 'text',
    comment: 'Tipo de dato: text, number, date, textarea, link'
  },
  scope: {
    type: DataTypes.ENUM('consulta', 'ficha'),
    allowNull: false,
    defaultValue: 'consulta',
    comment: 'Dónde se usa: consulta o ficha'
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Orden de aparición en formularios'
  }
}, {
  tableName: 'custom_fields',
  timestamps: true
});

module.exports = CustomFields;

