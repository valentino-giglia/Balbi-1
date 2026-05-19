/**
 * Script de seed — crea roles y usuarios iniciales.
 * Ejecutar con: node seed.js
 */
require('dotenv').config();
const { sequelize } = require('./config/database');

// Cargar todos los modelos para establecer relaciones
require('./models');
const { Rol, Usuario, UsuarioRol } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas');

    // ── Roles ───────────────────────────────────────────────
    const rolesData = [
      { nombre: 'admin' },
      { nombre: 'veterinario' },
      { nombre: 'recepcion' },
    ];

    const roles = {};
    for (const r of rolesData) {
      const [rol] = await Rol.findOrCreate({ where: { nombre: r.nombre }, defaults: r });
      roles[r.nombre] = rol;
      console.log(`  Rol '${r.nombre}' listo (id=${rol.id})`);
    }

    // ── Usuarios ─────────────────────────────────────────────
    const usuariosData = [
      {
        nombre:     'Admin',
        email:      'admin@drbalbi.vet',
        contrasena: 'Balbi2026!',
        telefono:   '341 555-0001',
        rol:        'admin',
      },
      {
        nombre:     'Veterinario',
        email:      'mendez@drbalbi.vet',
        contrasena: 'Vet2026!',
        telefono:   '341 555-0002',
        rol:        'veterinario',
      },
      {
        nombre:     'Recepción',
        email:      'recepcion@drbalbi.vet',
        contrasena: 'Recep2026!',
        telefono:   '341 555-0003',
        rol:        'recepcion',
      },
    ];

    for (const u of usuariosData) {
      const existing = await Usuario.findOne({ where: { email: u.email } });
      if (existing) {
        console.log(`  Usuario '${u.email}' ya existe — omitido`);
        continue;
      }

      // El hook beforeCreate del modelo hashea la contraseña automáticamente
      const usuario = await Usuario.create({
        nombre:     u.nombre,
        email:      u.email,
        contrasena: u.contrasena,
        telefono:   u.telefono,
        estado:     'ACTIVO',
      });

      await UsuarioRol.create({ usuarioID: usuario.id, rolID: roles[u.rol].id });
      console.log(`  Usuario '${u.email}' creado con rol '${u.rol}'`);
    }

    console.log('\n✅ Seed completado');
    console.log('\nCredenciales de acceso:');
    console.log('  Admin:       admin@drbalbi.vet      / Balbi2026!');
    console.log('  Veterinario: mendez@drbalbi.vet     / Vet2026!');
    console.log('  Recepción:   recepcion@drbalbi.vet  / Recep2026!');

  } catch (err) {
    console.error('❌ Error en seed:', err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seed();
