const { Sequelize } = require('sequelize');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL ||
  `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Configuración de la base de datos
const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Función para conectar
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente');
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB
};
