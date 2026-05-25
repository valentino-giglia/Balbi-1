/**
 * Seed de datos de prueba completo — node seed-demo.js
 * Cubre: profesionales, servicios, horarios, pacientes (4),
 * mascotas (2 por paciente), turnos, consultas, fichas, vacunas,
 * libreta sanitaria, internados, alertas, cola, guardias, productos
 */
require('dotenv').config();
const { sequelize } = require('./config/database');
require('./models');
const {
  Profesionales, Servicios, ProfesionalesServicios, Horarios,
  Pacientes, Mascotas, Turnos, Consultas, Fichas, Vacunas,
  LibretaItem, Internados, Alertas, Cola, Guardias, Productos
} = require('./models');

// ── Helpers ──────────────────────────────────────────────────────────────────
const daysFromNow = (d, h = 10, m = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, m, 0, 0);
  return dt;
};
const daysAgo = (d, h = 10, m = 0) => daysFromNow(-d, h, m);
const dateOnly = (daysOffset) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysOffset);
  return dt.toISOString().split('T')[0];
};
const fo = (Model, where, defaults) => Model.findOrCreate({ where, defaults: { ...where, ...defaults } });

async function seedDemo() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB conectada');
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas\n');

    // ════════════════════════════════════════════════════════════════
    // PROFESIONALES (4)
    // ════════════════════════════════════════════════════════════════
    console.log('── Profesionales ─────────────────────────────');
    const [p1] = await fo(Profesionales, { codigo: 'VET-BALBI' }, {
      nombre: 'Dr. Pablo Balbi', telefono: '351 555-0101', email: 'pablo@drbalbi.vet',
      color: '#A3007B', detalles: 'Clínica general y cirugía de pequeños animales', estado: 'ACTIVO'
    });
    const [p2] = await fo(Profesionales, { codigo: 'VET-MENDEZ' }, {
      nombre: 'Dra. Laura Méndez', telefono: '351 555-0202', email: 'laura@drbalbi.vet',
      color: '#1F8A5B', detalles: 'Especialista en dermatología veterinaria', estado: 'ACTIVO'
    });
    const [p3] = await fo(Profesionales, { codigo: 'VET-TORRES' }, {
      nombre: 'Dr. Marcos Torres', telefono: '351 555-0303', email: 'marcos@drbalbi.vet',
      color: '#D97706', detalles: 'Especialista en traumatología y ortopedia', estado: 'ACTIVO'
    });
    const [p4] = await fo(Profesionales, { codigo: 'VET-RIOS' }, {
      nombre: 'Dra. Sofía Ríos', telefono: '351 555-0404', email: 'sofia@drbalbi.vet',
      color: '#1976d2', detalles: 'Especialista en diagnóstico por imagen y ecografía', estado: 'ACTIVO'
    });
    [p1, p2, p3, p4].forEach(p => console.log(`  ${p.nombre} (id=${p.id})`));

    // ════════════════════════════════════════════════════════════════
    // SERVICIOS (5)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Servicios ─────────────────────────────────');
    const [s1] = await fo(Servicios, { codigo: 'CONS-GRAL' }, {
      nombre: 'Consulta General', duracionMinutos: 30, precio: 8500, color: '#A3007B', estado: 'ACTIVO'
    });
    const [s2] = await fo(Servicios, { codigo: 'VACUNA' }, {
      nombre: 'Vacunación', duracionMinutos: 15, precio: 4200, color: '#1976d2', estado: 'ACTIVO'
    });
    const [s3] = await fo(Servicios, { codigo: 'CIRUGIA' }, {
      nombre: 'Cirugía General', duracionMinutos: 120, precio: 45000, color: '#D97706', estado: 'ACTIVO'
    });
    const [s4] = await fo(Servicios, { codigo: 'ECO' }, {
      nombre: 'Ecografía Abdominal', duracionMinutos: 45, precio: 12000, color: '#1F8A5B', estado: 'ACTIVO'
    });
    const [s5] = await fo(Servicios, { codigo: 'DESPAR' }, {
      nombre: 'Desparasitación', duracionMinutos: 15, precio: 3500, color: '#7C3AED', estado: 'ACTIVO'
    });
    [s1, s2, s3, s4, s5].forEach(s => console.log(`  ${s.nombre} (id=${s.id})`));

    // ════════════════════════════════════════════════════════════════
    // PROFESIONALES ↔ SERVICIOS
    // ════════════════════════════════════════════════════════════════
    const links = [
      [p1.id, s1.id], [p1.id, s2.id], [p1.id, s3.id],
      [p2.id, s1.id], [p2.id, s2.id], [p2.id, s5.id],
      [p3.id, s1.id], [p3.id, s3.id],
      [p4.id, s1.id], [p4.id, s4.id],
    ];
    for (const [pid, sid] of links) {
      await fo(ProfesionalesServicios, { profesionalID: pid, servicioID: sid }, { estado: 'ACTIVO' });
    }
    console.log('\n  Profesionales ↔ Servicios: OK');

    // ════════════════════════════════════════════════════════════════
    // HORARIOS
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Horarios ──────────────────────────────────');
    const horariosData = [
      { pid: p1.id, dias: [{ d: 'lunes', hi: '09:00', hf: '13:00' }, { d: 'miercoles', hi: '09:00', hf: '13:00' }, { d: 'viernes', hi: '14:00', hf: '18:00' }] },
      { pid: p2.id, dias: [{ d: 'martes', hi: '10:00', hf: '14:00' }, { d: 'jueves', hi: '10:00', hf: '14:00' }, { d: 'sabado', hi: '09:00', hf: '12:00' }] },
      { pid: p3.id, dias: [{ d: 'lunes', hi: '14:00', hf: '18:00' }, { d: 'miercoles', hi: '14:00', hf: '18:00' }, { d: 'viernes', hi: '09:00', hf: '13:00' }] },
      { pid: p4.id, dias: [{ d: 'martes', hi: '08:00', hf: '12:00' }, { d: 'jueves', hi: '08:00', hf: '12:00' }] },
    ];
    for (const { pid, dias } of horariosData) {
      for (const { d, hi, hf } of dias) {
        await fo(Horarios, { profesionalID: pid, diaSemana: d }, { horaInicio: hi, horaFin: hf });
      }
    }
    console.log('  Horarios cargados');

    // ════════════════════════════════════════════════════════════════
    // PACIENTES (4)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Pacientes (clientes) ──────────────────────');
    const [c1] = await fo(Pacientes, { email: 'garcia.roberto@gmail.com' }, {
      nombre: 'Roberto García', telefono: '351 444-1111', dni: '28.345.678',
      domicilio: 'Av. Colón 1234, Córdoba', estado: 'ACTIVO'
    });
    const [c2] = await fo(Pacientes, { email: 'martinez.ana@outlook.com' }, {
      nombre: 'Ana Martínez', telefono: '351 444-2222', dni: '32.678.901',
      domicilio: 'Calle San Martín 456, Córdoba', estado: 'ACTIVO'
    });
    const [c3] = await fo(Pacientes, { email: 'fernandez.carlos@yahoo.com' }, {
      nombre: 'Carlos Fernández', telefono: '351 444-3333', dni: '25.123.456',
      domicilio: 'Bvd. Chacabuco 789, Córdoba', estado: 'ACTIVO'
    });
    const [c4] = await fo(Pacientes, { email: 'perez.valentina@gmail.com' }, {
      nombre: 'Valentina Pérez', telefono: '351 444-4444', dni: '38.901.234',
      domicilio: 'Av. Figueroa Alcorta 321, Córdoba', estado: 'ACTIVO'
    });
    [c1, c2, c3, c4].forEach(c => console.log(`  ${c.nombre} (id=${c.id})`));

    // ════════════════════════════════════════════════════════════════
    // MASCOTAS (2 por paciente = 8 total)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Mascotas ──────────────────────────────────');
    const crearMascota = async (pacienteID, nombre, defaults) => {
      let m = await Mascotas.findOne({ where: { nombre, pacienteID } });
      if (!m) m = await Mascotas.create({ pacienteID, nombre, ...defaults });
      return m;
    };

    // Roberto García
    const m1 = await crearMascota(c1.id, 'Max', {
      especie: 'Perro', raza: 'Labrador Retriever', fechaNacimiento: '2020-03-15',
      sexo: 'M', peso: 28.5, color: 'Dorado', chip: '982000123456789', estado: 'ACTIVO'
    });
    const m2 = await crearMascota(c1.id, 'Rocky', {
      especie: 'Perro', raza: 'Bulldog Francés', fechaNacimiento: '2021-11-20',
      sexo: 'M', peso: 12.3, color: 'Atigrado', chip: '982000987654321', estado: 'ACTIVO'
    });
    // Ana Martínez
    const m3 = await crearMascota(c2.id, 'Luna', {
      especie: 'Gato', raza: 'Siamés', fechaNacimiento: '2021-07-22',
      sexo: 'H', peso: 4.2, color: 'Crema con puntas oscuras', estado: 'ACTIVO'
    });
    const m4 = await crearMascota(c2.id, 'Mia', {
      especie: 'Gato', raza: 'Persa', fechaNacimiento: '2022-02-10',
      sexo: 'H', peso: 3.8, color: 'Blanco', chip: '982000111222333', estado: 'ACTIVO'
    });
    // Carlos Fernández
    const m5 = await crearMascota(c3.id, 'Thor', {
      especie: 'Perro', raza: 'Rottweiler', fechaNacimiento: '2019-06-05',
      sexo: 'M', peso: 45.0, color: 'Negro y fuego', chip: '982000444555666', estado: 'ACTIVO'
    });
    const m6 = await crearMascota(c3.id, 'Nala', {
      especie: 'Perro', raza: 'Beagle', fechaNacimiento: '2022-08-14',
      sexo: 'H', peso: 10.5, color: 'Tricolor', chip: '982000777888999', estado: 'ACTIVO'
    });
    // Valentina Pérez
    const m7 = await crearMascota(c4.id, 'Coco', {
      especie: 'Perro', raza: 'Yorkshire Terrier', fechaNacimiento: '2023-01-30',
      sexo: 'M', peso: 2.8, color: 'Marrón y negro', estado: 'ACTIVO'
    });
    const m8 = await crearMascota(c4.id, 'Bella', {
      especie: 'Gato', raza: 'Ragdoll', fechaNacimiento: '2022-05-18',
      sexo: 'H', peso: 5.1, color: 'Azul point', chip: '982000321654987', estado: 'ACTIVO'
    });
    [m1, m2, m3, m4, m5, m6, m7, m8].forEach(m => console.log(`  ${m.nombre} (id=${m.id}) — pacienteID=${m.pacienteID}`));

    // ════════════════════════════════════════════════════════════════
    // TURNOS (~12 en distintos estados)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Turnos ────────────────────────────────────');
    const crearTurno = async (data) => {
      const exists = await Turnos.findOne({
        where: { mascotaID: data.mascotaID, servicioID: data.servicioID, horaInicio: data.horaInicio }
      });
      if (exists) return exists;
      return Turnos.create(data);
    };

    const turnos = [
      // Pasados - completados
      { pacienteID: c1.id, mascotaID: m1.id, profesionalID: p1.id, servicioID: s1.id,
        horaInicio: daysAgo(30, 10, 0), horaFin: daysAgo(30, 10, 30),
        duracionMinutos: 30, precio: 8500, estado: 'COMPLETADO', tipo: 'CONSULTORIO', notas: 'Control anual' },
      { pacienteID: c1.id, mascotaID: m1.id, profesionalID: p1.id, servicioID: s2.id,
        horaInicio: daysAgo(60, 11, 0), horaFin: daysAgo(60, 11, 15),
        duracionMinutos: 15, precio: 4200, estado: 'COMPLETADO', tipo: 'CONSULTORIO', notas: 'Vacuna cuádruple' },
      { pacienteID: c2.id, mascotaID: m3.id, profesionalID: p2.id, servicioID: s1.id,
        horaInicio: daysAgo(15, 9, 30), horaFin: daysAgo(15, 10, 0),
        duracionMinutos: 30, precio: 8500, estado: 'COMPLETADO', tipo: 'CONSULTORIO', notas: 'Dermatitis' },
      { pacienteID: c3.id, mascotaID: m5.id, profesionalID: p3.id, servicioID: s3.id,
        horaInicio: daysAgo(7, 8, 0), horaFin: daysAgo(7, 10, 0),
        duracionMinutos: 120, precio: 45000, estado: 'COMPLETADO', tipo: 'CONSULTORIO', notas: 'Cirugía cadera' },
      { pacienteID: c3.id, mascotaID: m6.id, profesionalID: p1.id, servicioID: s2.id,
        horaInicio: daysAgo(10, 10, 0), horaFin: daysAgo(10, 10, 15),
        duracionMinutos: 15, precio: 4200, estado: 'COMPLETADO', tipo: 'CONSULTORIO', notas: 'Vacuna antirrábica' },
      { pacienteID: c4.id, mascotaID: m7.id, profesionalID: p1.id, servicioID: s1.id,
        horaInicio: daysAgo(5, 14, 0), horaFin: daysAgo(5, 14, 30),
        duracionMinutos: 30, precio: 8500, estado: 'COMPLETADO', tipo: 'CONSULTORIO', notas: 'Control de peso' },
      // Futuros - reservados
      { pacienteID: c1.id, mascotaID: m1.id, profesionalID: p1.id, servicioID: s1.id,
        horaInicio: daysFromNow(1, 10, 0), horaFin: daysFromNow(1, 10, 30),
        duracionMinutos: 30, precio: 8500, estado: 'RESERVADO', tipo: 'CONSULTORIO', notas: 'Control post-cirugía' },
      { pacienteID: c2.id, mascotaID: m4.id, profesionalID: p2.id, servicioID: s5.id,
        horaInicio: daysFromNow(2, 11, 0), horaFin: daysFromNow(2, 11, 15),
        duracionMinutos: 15, precio: 3500, estado: 'RESERVADO', tipo: 'CONSULTORIO', notas: 'Desparasitación trimestral' },
      { pacienteID: c3.id, mascotaID: m5.id, profesionalID: p4.id, servicioID: s4.id,
        horaInicio: daysFromNow(3, 9, 0), horaFin: daysFromNow(3, 9, 45),
        duracionMinutos: 45, precio: 12000, estado: 'RESERVADO', tipo: 'CONSULTORIO', notas: 'Ecografía de seguimiento post-op' },
      { pacienteID: c4.id, mascotaID: m8.id, profesionalID: p2.id, servicioID: s1.id,
        horaInicio: daysFromNow(4, 10, 30), horaFin: daysFromNow(4, 11, 0),
        duracionMinutos: 30, precio: 8500, estado: 'RESERVADO', tipo: 'CONSULTORIO', notas: 'Primera consulta' },
      { pacienteID: c1.id, mascotaID: m2.id, profesionalID: p1.id, servicioID: s2.id,
        horaInicio: daysFromNow(5, 15, 0), horaFin: daysFromNow(5, 15, 15),
        duracionMinutos: 15, precio: 4200, estado: 'RESERVADO', tipo: 'CONSULTORIO', notas: 'Vacuna cuádruple anual' },
      { pacienteID: c3.id, mascotaID: m6.id, profesionalID: p1.id, servicioID: s1.id,
        horaInicio: daysFromNow(7, 9, 0), horaFin: daysFromNow(7, 9, 30),
        duracionMinutos: 30, precio: 8500, estado: 'PENDIENTE', tipo: 'CONSULTORIO', notas: 'Revisión de piel' },
    ];
    for (const t of turnos) {
      const tr = await crearTurno(t);
      console.log(`  Turno: ${tr.estado} — mascotaID=${tr.mascotaID} (id=${tr.id})`);
    }

    // ════════════════════════════════════════════════════════════════
    // CONSULTAS (historial clínico, 2+ por mascota principal)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Consultas ─────────────────────────────────');
    const consultasData = [
      // Max (m1)
      { mascotaID: m1.id, vet: 'Dr. Pablo Balbi', pesoKg: 28.5,
        motivoConsulta: 'Control anual preventivo',
        examenClinico: 'Paciente en buen estado general. FC 80 lpm, FR 22 rpm, T° 38.4°C. Mucosas rosadas y húmedas. Ganglios normales. Auscultación cardio-pulmonar sin hallazgos.',
        diagnostico: 'Paciente sano. Sin hallazgos patológicos.',
        planTratamiento: 'Vacunación cuádruple + antirrábica. Control en 12 meses.',
        nota: 'Propietario consulta por posible alergia alimentaria. Se recomienda dieta hipoalergénica de prueba por 8 semanas.' },
      { mascotaID: m1.id, vet: 'Dr. Pablo Balbi', pesoKg: 29.1,
        motivoConsulta: 'Cojera en miembro posterior derecho',
        examenClinico: 'Se observa cojera grado III/IV en MPD. Dolor a la manipulación de articulación coxofemoral. Rx: signos compatibles con displasia de cadera bilateral.',
        diagnostico: 'Displasia de cadera bilateral, más pronunciada en lado derecho. Artrosis secundaria.',
        planTratamiento: 'Meloxicam 0.1 mg/kg/día por 15 días. Restricción de ejercicio. Derivación a especialista en ortopedia para evaluación quirúrgica.',
        nota: 'Se coordina cirugía de reemplazo articular con Dr. Torres.' },
      // Luna (m3)
      { mascotaID: m3.id, vet: 'Dra. Laura Méndez', pesoKg: 4.2,
        motivoConsulta: 'Pérdida de pelo y lesiones cutáneas',
        examenClinico: 'Alopecia multifocal en región dorso-lumbar y flancos. Eritema y descamación. Prueba de raspado positivo para ácaros.',
        diagnostico: 'Sarna demodéctica localizada.',
        planTratamiento: 'Amitraz al 0.025% tópico, aplicar semanalmente x 4 semanas. Champú con clorhexidina 2 veces/semana. Control a los 30 días.',
        nota: 'Prognosis favorable en formas localizadas.' },
      { mascotaID: m3.id, vet: 'Dra. Laura Méndez', pesoKg: 4.0,
        motivoConsulta: 'Control de tratamiento dermatológico',
        examenClinico: 'Mejora significativa de las lesiones previas. Reducción del 70% del área afectada. Nuevo pelo en crecimiento. Sin nuevas lesiones.',
        diagnostico: 'Sarna demodéctica en resolución.',
        planTratamiento: 'Continuar tratamiento 2 semanas adicionales. Control final en 30 días.',
        nota: '' },
      // Thor (m5)
      { mascotaID: m5.id, vet: 'Dr. Marcos Torres', pesoKg: 44.5,
        motivoConsulta: 'Evaluación pre-quirúrgica',
        examenClinico: 'Paciente masculino, 5 años. Cojera severa MPD desde hace 3 meses. Rx y TAC confirman fractura de cuello femoral. Análisis pre-anestésicos dentro de parámetros normales.',
        diagnostico: 'Fractura de cuello femoral MPD. Indicación quirúrgica.',
        planTratamiento: 'Cirugía de hemiartroplastia programada. Internación post-op mínima 48hs.',
        nota: 'Propietario informado de riesgos y firmó consentimiento.' },
      { mascotaID: m5.id, vet: 'Dr. Marcos Torres', pesoKg: 44.8,
        motivoConsulta: 'Control post-operatorio día 7',
        examenClinico: 'Herida quirúrgica en buen estado, sin signos de infección. Dolor moderado. Apoyo parcial del MPD. T° 38.7°C.',
        diagnostico: 'Evolución post-quirúrgica favorable.',
        planTratamiento: 'Continuar meloxicam 0.2 mg/kg/día. Tramadol 5 mg/kg c/8hs. Fisioterapia suave. Control en 7 días.',
        nota: 'Paciente internado para monitoreo.' },
      // Rocky (m2)
      { mascotaID: m2.id, vet: 'Dr. Pablo Balbi', pesoKg: 12.3,
        motivoConsulta: 'Tos seca crónica y dificultad respiratoria',
        examenClinico: 'Braquicéfalo con estenosis de narinas moderada. Paladar blando elongado grado II. Sin cianosis. Rx tórax: sin patología pulmonar.',
        diagnostico: 'Síndrome braquicéfalo. Estenosis de narinas + paladar blando elongado.',
        planTratamiento: 'Se recomienda corrección quirúrgica electiva. Evitar ejercicio intenso y calor. Mantener peso ideal.',
        nota: 'Propietario informado sobre síndrome braquicéfalo y sus complicaciones.' },
      // Nala (m6)
      { mascotaID: m6.id, vet: 'Dr. Pablo Balbi', pesoKg: 10.5,
        motivoConsulta: 'Otitis recurrente',
        examenClinico: 'Eritema y exudado marrón en ambos canales auriculares. Prurito intenso. Citología: Malassezia sp. abundante.',
        diagnostico: 'Otitis externa bilateral por Malassezia.',
        planTratamiento: 'Limpieza auricular con solución limpiadora. Otomax gotas 5 gotas c/12hs x 10 días. Control en 2 semanas.',
        nota: 'Raza predispuesta. Evaluar alergias alimentarias.' },
      // Coco (m7)
      { mascotaID: m7.id, vet: 'Dr. Pablo Balbi', pesoKg: 2.8,
        motivoConsulta: 'Primera consulta — chequeo general',
        examenClinico: 'Cachorro de 4 meses en excelente estado general. Dentición de leche completa. Sin soplos. Microchip verificado. Plan sanitario incompleto.',
        diagnostico: 'Paciente sano.',
        planTratamiento: 'Vacuna cuádruple. Desparasitación. Plan de vacunación completo. Castración electiva recomendada a los 6 meses.',
        nota: '' },
      // Bella (m8)
      { mascotaID: m8.id, vet: 'Dra. Laura Méndez', pesoKg: 5.1,
        motivoConsulta: 'Vómitos frecuentes y pérdida de peso',
        examenClinico: 'Gata 3 años. Condición corporal 2.5/5. Dolor abdominal leve. Ecografía: engrosamiento de pared intestinal. Bioquímica y hemograma dentro de rangos.',
        diagnostico: 'Probable enfermedad inflamatoria intestinal. Se solicita biopsia para confirmación.',
        planTratamiento: 'Dieta hidrolizada. Metronidazol 10 mg/kg c/12hs x 14 días. Control en 21 días.',
        nota: 'Derivar a internista si no mejora en 3 semanas.' },
    ];
    for (const c of consultasData) {
      await Consultas.create(c);
    }
    console.log(`  ${consultasData.length} consultas creadas`);

    // ════════════════════════════════════════════════════════════════
    // FICHAS (1 por mascota)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Fichas ────────────────────────────────────');
    const fichasData = [
      { pacienteID: c1.id, mascotaID: m1.id, notas: 'Paciente tranquilo. Propietario muy atento y comprometido con los cuidados. Alergia alimentaria en evaluación. No apto para anestesia halogenada (reacción previa leve).' },
      { pacienteID: c1.id, mascotaID: m2.id, notas: 'Paciente ansioso. Requiere sujeción firme. Síndrome braquicéfalo a monitorear. Temperatura extrema: alto riesgo de golpe de calor.' },
      { pacienteID: c2.id, mascotaID: m3.id, notas: 'Gata nerviosa. Manejar con guantes. Mejora progresiva con tratamiento dermatológico.' },
      { pacienteID: c2.id, mascotaID: m4.id, notas: 'Gata joven, dócil. Proceso digestivo en seguimiento. Dieta especial hidrolizada.' },
      { pacienteID: c3.id, mascotaID: m5.id, notas: 'Paciente en recuperación post-quirúrgica. Monitoreo cada 8hs. Fisioterapia iniciada.' },
      { pacienteID: c3.id, mascotaID: m6.id, notas: 'Otitis crónica. Revisar canal auricular en cada consulta. Predisposición racial.' },
      { pacienteID: c4.id, mascotaID: m7.id, notas: 'Cachorro. Plan sanitario en curso. Castración programada a los 6 meses.' },
      { pacienteID: c4.id, mascotaID: m8.id, notas: 'Sospecha de EII. Pendiente resultado de biopsia intestinal. Dieta controlada.' },
    ];
    for (const f of fichasData) {
      const exists = await Fichas.findOne({ where: { mascotaID: f.mascotaID } });
      if (!exists) await Fichas.create(f);
    }
    console.log(`  ${fichasData.length} fichas creadas`);

    // ════════════════════════════════════════════════════════════════
    // VACUNAS (2 por mascota)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Vacunas ───────────────────────────────────');
    const vacunasData = [
      { mascotaID: m1.id, nombre: 'Vacuna Cuádruple Canina', fechaAplicacion: dateOnly(-365), proximaDosis: dateOnly(0), notas: 'Lote Z-4521 / Zoetis' },
      { mascotaID: m1.id, nombre: 'Vacuna Antirrábica', fechaAplicacion: dateOnly(-180), proximaDosis: dateOnly(185), notas: 'Lote R-7823 / MSD' },
      { mascotaID: m2.id, nombre: 'Vacuna Cuádruple Canina', fechaAplicacion: dateOnly(-200), proximaDosis: dateOnly(165), notas: 'Lote Z-5001 / Zoetis' },
      { mascotaID: m2.id, nombre: 'Sextuple Canina', fechaAplicacion: dateOnly(-60), proximaDosis: dateOnly(305), notas: '' },
      { mascotaID: m3.id, nombre: 'Triple Felina (FHV, FCV, FPV)', fechaAplicacion: dateOnly(-300), proximaDosis: dateOnly(65), notas: 'Lote F-1234 / Merial' },
      { mascotaID: m3.id, nombre: 'Vacuna Antirrábica Felina', fechaAplicacion: dateOnly(-150), proximaDosis: dateOnly(215), notas: '' },
      { mascotaID: m4.id, nombre: 'Triple Felina (FHV, FCV, FPV)', fechaAplicacion: dateOnly(-120), proximaDosis: dateOnly(245), notas: '' },
      { mascotaID: m4.id, nombre: 'Leucemia Felina (FeLV)', fechaAplicacion: dateOnly(-90), proximaDosis: dateOnly(275), notas: '' },
      { mascotaID: m5.id, nombre: 'Vacuna Cuádruple Canina', fechaAplicacion: dateOnly(-370), proximaDosis: dateOnly(-5), notas: 'Vence pronto — reprogramar' },
      { mascotaID: m5.id, nombre: 'Vacuna Antirrábica', fechaAplicacion: dateOnly(-370), proximaDosis: dateOnly(-5), notas: 'Vence pronto — reprogramar' },
      { mascotaID: m6.id, nombre: 'Vacuna Cuádruple Canina', fechaAplicacion: dateOnly(-50), proximaDosis: dateOnly(315), notas: '' },
      { mascotaID: m6.id, nombre: 'Vacuna Antirrábica', fechaAplicacion: dateOnly(-50), proximaDosis: dateOnly(315), notas: '' },
      { mascotaID: m7.id, nombre: 'Vacuna Cuádruple (1ra dosis)', fechaAplicacion: dateOnly(-30), proximaDosis: dateOnly(0), notas: 'Cachorro: 2da dosis pendiente' },
      { mascotaID: m7.id, nombre: 'Vacuna Cuádruple (2da dosis)', fechaAplicacion: dateOnly(-10), proximaDosis: dateOnly(355), notas: 'Plan de cachorro completo' },
      { mascotaID: m8.id, nombre: 'Triple Felina (FHV, FCV, FPV)', fechaAplicacion: dateOnly(-180), proximaDosis: dateOnly(185), notas: '' },
      { mascotaID: m8.id, nombre: 'Leucemia Felina (FeLV)', fechaAplicacion: dateOnly(-180), proximaDosis: dateOnly(185), notas: '' },
    ];
    for (const v of vacunasData) await Vacunas.create(v);
    console.log(`  ${vacunasData.length} vacunas creadas`);

    // ════════════════════════════════════════════════════════════════
    // LIBRETA SANITARIA
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Libreta Sanitaria ─────────────────────────');
    const libretaData = [
      { mascotaID: m1.id, categoria: 'antiparasitarios', nombre: 'NexGard Spectra Grande', fecha: dateOnly(-30), proxima: dateOnly(0), status: 'vence hoy', notas: 'Antiparasitario interno + externo' },
      { mascotaID: m1.id, categoria: 'cirugias', nombre: 'Cirugía displasia cadera MPD', fecha: dateOnly(-7), status: 'vigente', notas: 'Hemiartroplastia. Sin complicaciones.' },
      { mascotaID: m1.id, categoria: 'alergias', nombre: 'Posible alergia alimentaria a proteína de pollo', status: 'vigente', notas: 'En evaluación con dieta de prueba' },
      { mascotaID: m2.id, categoria: 'antiparasitarios', nombre: 'Frontline Combo', fecha: dateOnly(-45), proxima: dateOnly(15), status: 'vigente', notas: '' },
      { mascotaID: m2.id, categoria: 'medicacion', nombre: 'Tratamiento síndrome braquicéfalo', status: 'vigente', notas: 'Monitoreo respiratorio permanente' },
      { mascotaID: m3.id, categoria: 'antiparasitarios', nombre: 'Stronghold Gatos', fecha: dateOnly(-28), proxima: dateOnly(2), status: 'vigente', notas: 'Pipeta antiparasitaria mensual' },
      { mascotaID: m3.id, categoria: 'medicacion', nombre: 'Amitraz tópico — sarna demodéctica', fecha: dateOnly(-15), proxima: dateOnly(7), status: 'vigente', notas: '4ta semana de tratamiento' },
      { mascotaID: m4.id, categoria: 'antiparasitarios', nombre: 'Stronghold Gatos', fecha: dateOnly(-25), proxima: dateOnly(5), status: 'vigente', notas: '' },
      { mascotaID: m4.id, categoria: 'estudios', nombre: 'Biopsia intestinal', fecha: dateOnly(-3), status: 'vigente', notas: 'Pendiente resultado de anatomía patológica' },
      { mascotaID: m5.id, categoria: 'cirugias', nombre: 'Hemiartroplastia cadera MPD', fecha: dateOnly(-7), status: 'vigente', notas: 'Sin complicaciones. Fisioterapia en curso.' },
      { mascotaID: m5.id, categoria: 'medicacion', nombre: 'Meloxicam + Tramadol post-op', fecha: dateOnly(-7), status: 'vigente', notas: 'Analgesia post-quirúrgica' },
      { mascotaID: m5.id, categoria: 'antiparasitarios', nombre: 'NexGard Spectra XL', fecha: dateOnly(-60), proxima: dateOnly(-30), status: 'vencido', notas: 'Pendiente reprogramar' },
      { mascotaID: m6.id, categoria: 'medicacion', nombre: 'Otomax gotas — otitis bilateral', fecha: dateOnly(-5), proxima: dateOnly(5), status: 'vigente', notas: '10 días de tratamiento' },
      { mascotaID: m6.id, categoria: 'antiparasitarios', nombre: 'Simparica', fecha: dateOnly(-20), proxima: dateOnly(10), status: 'vigente', notas: '' },
      { mascotaID: m7.id, categoria: 'antiparasitarios', nombre: 'Milbemáx Junior', fecha: dateOnly(-10), proxima: dateOnly(20), status: 'vigente', notas: 'Desparasitación de cachorro' },
      { mascotaID: m8.id, categoria: 'medicacion', nombre: 'Metronidazol — EII', fecha: dateOnly(-7), proxima: dateOnly(7), status: 'vigente', notas: '14 días de tratamiento' },
      { mascotaID: m8.id, categoria: 'estudios', nombre: 'Ecografía abdominal', fecha: dateOnly(-7), status: 'vigente', notas: 'Engrosamiento pared intestinal. Seguimiento.' },
    ];
    for (const l of libretaData) await LibretaItem.create(l);
    console.log(`  ${libretaData.length} items de libreta creados`);

    // ════════════════════════════════════════════════════════════════
    // INTERNADOS (2 activos)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Internados ────────────────────────────────');
    const internadosData = [
      { mascotaID: m1.id, profesionalID: p1.id, estado: 'estable',
        motivo: 'Post-operatorio: hemiartroplastia cadera derecha',
        ingreso: daysAgo(7, 8, 0), plan: 'Analgesia c/8hs. Fisioterapia suave 2 veces/día. Control de herida c/24hs. Apósito estéril.',
        dieta: 'Balanceado húmedo premium 3 veces/día — 300g total. Agua ad libitum.',
        ubicacion: 'Box 1 — Internación Clínica',
        controles: [
          { hora: '08:00', temp: 38.4, fc: 82, fr: 22, nota: 'Paciente tranquilo. Come bien.' },
          { hora: '16:00', temp: 38.6, fc: 78, fr: 20, nota: 'Fisioterapia realizada. Sin quejidos.' },
          { hora: '00:00', temp: 38.3, fc: 80, fr: 21, nota: 'Descansando.' },
        ], estadoPaciente: 'ACTIVO' },
      { mascotaID: m5.id, profesionalID: p3.id, estado: 'critico',
        motivo: 'Post-operatorio: cirugía de fractura de cuello femoral',
        ingreso: daysAgo(2, 14, 0), plan: 'Monitoreo intensivo c/4hs. Tramadol c/8hs. Meloxicam c/24hs. Sin apoyo del miembro por 72hs.',
        dieta: 'Dieta blanda de recuperación 4 veces/día. Restricción hídrica controlada.',
        ubicacion: 'Box 2 — UCI Veterinaria',
        controles: [
          { hora: '06:00', temp: 39.1, fc: 95, fr: 28, nota: 'Fiebre leve. Se administra dipirona. Control en 4hs.' },
          { hora: '10:00', temp: 38.7, fc: 88, fr: 24, nota: 'Temperatura bajó. Evolución favorable.' },
          { hora: '14:00', temp: 38.5, fc: 84, fr: 22, nota: 'Come un poco. Mejor ánimo.' },
        ], estadoPaciente: 'ACTIVO' },
    ];
    for (const i of internadosData) {
      const exists = await Internados.findOne({ where: { mascotaID: i.mascotaID, estadoPaciente: 'ACTIVO' } });
      if (!exists) await Internados.create(i);
    }
    console.log('  2 internados activos creados');

    // ════════════════════════════════════════════════════════════════
    // ALERTAS (4 activas)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Alertas ───────────────────────────────────');
    const alertCount = await Alertas.count({ where: { estado: 'ACTIVA' } });
    if (alertCount < 2) {
      const alertasData = [
        { tipo: 'urgente', petName: 'Thor', msg: 'Fiebre persistente — control en 2hs', detalle: 'Temperatura 39.1°C. Paciente en UCI Box 2. Monitoreo activo.', minutos: 120, severity: 'error', estado: 'ACTIVA' },
        { tipo: 'medicacion', petName: 'Max', msg: 'Analgesia programada', detalle: 'Meloxicam + Tramadol. Próxima dosis en 15 minutos. Box 1.', minutos: 15, severity: 'warning', estado: 'ACTIVA' },
        { tipo: 'vencimiento', petName: 'Thor', msg: 'Vacunas vencidas', detalle: 'Vacuna cuádruple y antirrábica vencidas hace 5 días. Reprogramar al dar el alta.', minutos: 0, severity: 'warning', estado: 'ACTIVA' },
        { tipo: 'info', petName: 'Mia', msg: 'Resultado biopsia pendiente', detalle: 'Biopsia intestinal enviada a anatomía patológica hace 3 días. Resultado esperado en 48hs.', minutos: 0, severity: 'info', estado: 'ACTIVA' },
      ];
      for (const a of alertasData) await Alertas.create(a);
      console.log(`  ${alertasData.length} alertas creadas`);
    } else {
      console.log('  Alertas ya existen — omitidas');
    }

    // ════════════════════════════════════════════════════════════════
    // COLA DE ATENCIÓN (5 en espera)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Cola de Atención ──────────────────────────');
    const colaCount = await Cola.count({ where: { estado: 'ESPERANDO' } });
    if (colaCount < 2) {
      const horaHoy = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const now = new Date();
      const colaData = [
        { petName: 'Tito', species: 'Canino', ownerName: 'Rodrigo Sosa', motivo: 'Vómitos y decaimiento', triage: 'amarillo', espera: 25, primera: false, llegada: horaHoy(now.getHours(), now.getMinutes() - 25), estado: 'ESPERANDO' },
        { petName: 'Cleo', species: 'Felino', ownerName: 'Mariana López', motivo: 'Control post-vacunación', triage: 'verde', espera: 10, primera: true, llegada: horaHoy(now.getHours(), now.getMinutes() - 10), estado: 'ESPERANDO' },
        { petName: 'Duke', species: 'Canino', ownerName: 'Hernán Vitale', motivo: 'Herida en pata — atropellado', triage: 'rojo', espera: 5, primera: false, llegada: horaHoy(now.getHours(), now.getMinutes() - 5), estado: 'ESPERANDO' },
        { petName: 'Pinta', species: 'Canino', ownerName: 'Lucía Romano', motivo: 'Desparasitación', triage: 'verde', espera: 40, primera: false, llegada: horaHoy(now.getHours(), now.getMinutes() - 40), estado: 'ESPERANDO' },
        { petName: 'Simba', species: 'Felino', ownerName: 'Diego Palma', motivo: 'No come hace 2 días', triage: 'amarillo', espera: 15, primera: true, llegada: horaHoy(now.getHours(), now.getMinutes() - 15), estado: 'ESPERANDO' },
      ];
      for (const col of colaData) await Cola.create(col);
      console.log(`  ${colaData.length} pacientes en cola`);
    } else {
      console.log('  Cola ya tiene datos — omitida');
    }

    // ════════════════════════════════════════════════════════════════
    // GUARDIAS
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Guardias ──────────────────────────────────');
    const guardiasGuard = [
      { profesionalID: p1.id, tipo: 'Guardia 24hs', fecha: dateOnly(0), desde: '08:00', hasta: '08:00', activa: true, estado: 'ACTIVO' },
      { profesionalID: p2.id, tipo: 'Guardia 24hs', fecha: dateOnly(1), desde: '08:00', hasta: '08:00', activa: false, estado: 'ACTIVO' },
      { profesionalID: p3.id, tipo: 'Guardia 24hs', fecha: dateOnly(2), desde: '08:00', hasta: '08:00', activa: false, estado: 'ACTIVO' },
      { profesionalID: p4.id, tipo: 'Guardia 24hs', fecha: dateOnly(3), desde: '08:00', hasta: '08:00', activa: false, estado: 'ACTIVO' },
      { profesionalID: p1.id, tipo: 'Guardia 24hs', fecha: dateOnly(4), desde: '08:00', hasta: '08:00', activa: false, estado: 'ACTIVO' },
      { profesionalID: p2.id, tipo: 'Guardia Nocturna', fecha: dateOnly(5), desde: '20:00', hasta: '08:00', activa: false, estado: 'ACTIVO' },
    ];
    for (const g of guardiasGuard) {
      const exists = await Guardias.findOne({ where: { profesionalID: g.profesionalID, fecha: g.fecha } });
      if (!exists) await Guardias.create(g);
    }
    console.log(`  ${guardiasGuard.length} guardias programadas`);

    // ════════════════════════════════════════════════════════════════
    // PRODUCTOS / PRECIOS (12 en 4 categorías)
    // ════════════════════════════════════════════════════════════════
    console.log('\n── Productos / Precios ───────────────────────');
    const productosData = [
      // Vacunas
      { nombre: 'Vacuna Antirrábica', categoria: 'Vacunas', costo: 1200, venta: 2500, stock: 15, unidad: 'dosis', proveedor: 'Zoetis' },
      { nombre: 'Vacuna Cuádruple Canina', categoria: 'Vacunas', costo: 1800, venta: 3500, stock: 10, unidad: 'dosis', proveedor: 'MSD Animal Health' },
      { nombre: 'Triple Felina (FHV+FCV+FPV)', categoria: 'Vacunas', costo: 2100, venta: 4000, stock: 8, unidad: 'dosis', proveedor: 'Boehringer Ingelheim' },
      // Antiparasitarios
      { nombre: 'NexGard Spectra Grande (20-40kg)', categoria: 'Antiparasitarios', costo: 2800, venta: 5500, stock: 20, unidad: 'comprimido', proveedor: 'Boehringer Ingelheim' },
      { nombre: 'Frontline Combo Perros M (10-20kg)', categoria: 'Antiparasitarios', costo: 1400, venta: 2800, stock: 30, unidad: 'pipeta', proveedor: 'Merial' },
      { nombre: 'Stronghold Gatos 15mg', categoria: 'Antiparasitarios', costo: 900, venta: 1800, stock: 25, unidad: 'pipeta', proveedor: 'Zoetis' },
      { nombre: 'Milbemáx Junior Cáninos', categoria: 'Antiparasitarios', costo: 600, venta: 1200, stock: 40, unidad: 'comprimido', proveedor: 'Elanco' },
      // Medicamentos
      { nombre: 'Meloxicam 1mg/ml Oral 30ml', categoria: 'Medicamentos', costo: 1100, venta: 2200, stock: 12, unidad: 'frasco', proveedor: 'Richmond' },
      { nombre: 'Metronidazol 250mg x 20 comp', categoria: 'Medicamentos', costo: 500, venta: 950, stock: 20, unidad: 'blíster', proveedor: 'Genfar' },
      { nombre: 'Amoxicilina 500mg x 12 comp', categoria: 'Medicamentos', costo: 700, venta: 1400, stock: 15, unidad: 'blíster', proveedor: 'ROUX-OCEFA' },
      { nombre: 'Otomax Solución Ótica 15ml', categoria: 'Medicamentos', costo: 1500, venta: 3000, stock: 10, unidad: 'frasco', proveedor: 'MSD Animal Health' },
      // Insumos
      { nombre: 'Jeringas descartables 3ml x50', categoria: 'Insumos', costo: 400, venta: 700, stock: 200, unidad: 'unidad', proveedor: 'BD Medical' },
      { nombre: 'Gasas estériles 10x10 x50', categoria: 'Insumos', costo: 350, venta: 600, stock: 100, unidad: 'pack', proveedor: 'Hartmann' },
      { nombre: 'Guantes látex talla M x100', categoria: 'Insumos', costo: 800, venta: 1400, stock: 50, unidad: 'caja', proveedor: 'Medisur' },
      { nombre: 'Cinta de monitoreo SpO2 adulto', categoria: 'Insumos', costo: 1200, venta: 2000, stock: 30, unidad: 'unidad', proveedor: 'Mindray' },
    ];
    for (const prod of productosData) {
      const exists = await Productos.findOne({ where: { nombre: prod.nombre } });
      if (!exists) {
        await Productos.create({ ...prod, estado: 'ACTIVO' });
        process.stdout.write('.');
      }
    }
    console.log(`\n  ${productosData.length} productos en 4 categorías`);

    // ════════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(55));
    console.log('✅ SEED COMPLETO');
    console.log('═'.repeat(55));
    console.log('Profesionales  : 4 (Balbi, Méndez, Torres, Ríos)');
    console.log('Servicios      : 5');
    console.log('Horarios       : configurados para los 4 vets');
    console.log('Pacientes      : 4 (García, Martínez, Fernández, Pérez)');
    console.log('Mascotas       : 8 (2 por paciente)');
    console.log('Turnos         : 12 (6 completados, 5 reservados, 1 pendiente)');
    console.log('Consultas      : 10 con historial clínico detallado');
    console.log('Fichas         : 8 (1 por mascota)');
    console.log('Vacunas        : 16 (2 por mascota)');
    console.log('Libreta        : 17 items');
    console.log('Internados     : 2 activos (Max Box 1, Thor Box 2)');
    console.log('Alertas        : 4 activas');
    console.log('Cola           : 5 pacientes en espera');
    console.log('Guardias       : 6 programadas');
    console.log('Productos      : 15 en 4 categorías (Vacunas, Antiparasitarios, Medicamentos, Insumos)');
    console.log('\nCredenciales:');
    console.log('  admin@drbalbi.vet      / Balbi2026!');
    console.log('  mendez@drbalbi.vet     / Vet2026!');
    console.log('  recepcion@drbalbi.vet  / Recep2026!');

  } catch (err) {
    console.error('\n❌ Error en seed-demo:', err.message);
    console.error(err.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedDemo();
