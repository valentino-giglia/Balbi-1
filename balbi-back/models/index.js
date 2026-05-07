const Rol = require('./Rol');
const Usuario = require('./Usuario');
const UsuarioRol = require('./UsuarioRol');
const Profesionales = require('./Profesionales');
const Pacientes = require('./Pacientes');
const Mascotas = require('./Mascotas');
const MascotaPaciente = require('./MascotaPaciente');
const Servicios = require('./Servicios');
const Turnos = require('./Turnos');
const Consultas = require('./Consultas');
const Fichas = require('./Fichas');
const ProfesionalesServicios = require('./ProfesionalesServicios');
const Horarios = require('./Horarios');
const Files = require('./Files');
const BloqueosAgenda = require('./BloqueosAgenda');
const EventosAgenda = require('./EventosAgenda');
const Vacunas = require('./Vacunas');
const CustomFields = require('./CustomFields');

// Definir relaciones

// Usuario - Roles (N:M)
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: 'usuarioID', as: 'roles' });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: 'rolID', as: 'usuarios' });

// Profesionales - Servicios (N:M)
Profesionales.belongsToMany(Servicios, { 
  through: ProfesionalesServicios, 
  foreignKey: 'profesionalID', 
  as: 'servicios' 
});
Servicios.belongsToMany(Profesionales, { 
  through: ProfesionalesServicios, 
  foreignKey: 'servicioID', 
  as: 'profesionales' 
});

// Turnos - Relaciones
Turnos.belongsTo(Pacientes, { foreignKey: 'pacienteID', as: 'paciente' });
Turnos.belongsTo(Mascotas, { foreignKey: 'mascotaID', as: 'mascota' });
Turnos.belongsTo(Profesionales, { foreignKey: 'profesionalID', as: 'profesional' });
Turnos.belongsTo(Servicios, { foreignKey: 'servicioID', as: 'servicio' });
Turnos.belongsTo(Consultas, { foreignKey: 'consultaID', as: 'consulta' });
Consultas.hasOne(Turnos, { foreignKey: 'consultaID', as: 'turno' });

// Pacientes - Mascotas (1:N) tutor principal
Pacientes.hasMany(Mascotas, { foreignKey: 'pacienteID', as: 'mascotas' });
Mascotas.belongsTo(Pacientes, { foreignKey: 'pacienteID', as: 'paciente' });

// Mascotas - Pacientes co-tutores (N:M vía mascota_pacientes; no incluye al titular)
Mascotas.belongsToMany(Pacientes, {
  through: MascotaPaciente,
  foreignKey: 'mascotaID',
  otherKey: 'pacienteID',
  as: 'coTutores'
});
Pacientes.belongsToMany(Mascotas, {
  through: MascotaPaciente,
  foreignKey: 'pacienteID',
  otherKey: 'mascotaID',
  as: 'mascotasCompartidas'
});

// Mascotas - Vacunas (1:N)
Mascotas.hasMany(Vacunas, { foreignKey: 'mascotaID', as: 'vacunas' });
Vacunas.belongsTo(Mascotas, { foreignKey: 'mascotaID', as: 'mascota' });

// Mascotas - Turnos, Fichas, Files
Mascotas.hasMany(Turnos, { foreignKey: 'mascotaID', as: 'turnos' });
Mascotas.hasMany(Fichas, { foreignKey: 'mascotaID', as: 'fichas' });
Mascotas.hasMany(Files, { foreignKey: 'mascotaID', as: 'files' });

// Fichas - Pacientes (N:1) y Mascotas (N:1)
Fichas.belongsTo(Pacientes, { foreignKey: 'pacienteID', as: 'paciente' });
Fichas.belongsTo(Mascotas, { foreignKey: 'mascotaID', as: 'mascota' });
Pacientes.hasMany(Fichas, { foreignKey: 'pacienteID', as: 'fichas' });

Profesionales.hasMany(ProfesionalesServicios, { foreignKey: 'profesionalID', as: 'profesionalesServicios' });
ProfesionalesServicios.belongsTo(Profesionales, { foreignKey: 'profesionalID', as: 'profesional' });
ProfesionalesServicios.belongsTo(Servicios, { foreignKey: 'servicioID', as: 'servicio' });

// Profesionales - Horarios (1:N)
Profesionales.hasMany(Horarios, { foreignKey: 'profesionalID', as: 'horarios' });
Horarios.belongsTo(Profesionales, { foreignKey: 'profesionalID', as: 'profesional' });

// Profesionales - BloqueosAgenda y EventosAgenda (1:N)
Profesionales.hasMany(BloqueosAgenda, { foreignKey: 'profesionalID', as: 'bloqueosAgenda' });
BloqueosAgenda.belongsTo(Profesionales, { foreignKey: 'profesionalID', as: 'profesional' });
Profesionales.hasMany(EventosAgenda, { foreignKey: 'profesionalID', as: 'eventosAgenda' });
EventosAgenda.belongsTo(Profesionales, { foreignKey: 'profesionalID', as: 'profesional' });

// Files - Pacientes (N:1) y Mascotas (N:1)
Pacientes.hasMany(Files, { foreignKey: 'pacienteID', as: 'files' });
Files.belongsTo(Pacientes, { foreignKey: 'pacienteID', as: 'paciente' });
Files.belongsTo(Mascotas, { foreignKey: 'mascotaID', as: 'mascota' });
Files.belongsTo(Turnos, { foreignKey: 'turnoID', as: 'turno' });
Turnos.hasMany(Files, { foreignKey: 'turnoID', as: 'files' });

module.exports = {
  Rol,
  Usuario,
  UsuarioRol,
  Profesionales,
  Pacientes,
  Mascotas,
  MascotaPaciente,
  Servicios,
  Turnos,
  Consultas,
  Fichas,
  ProfesionalesServicios,
  Horarios,
  Files,
  BloqueosAgenda,
  EventosAgenda,
  Vacunas,
  CustomFields
};
