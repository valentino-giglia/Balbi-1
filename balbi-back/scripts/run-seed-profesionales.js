const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const envPath = path.join(__dirname, "..", ".env");
const env = fs.readFileSync(envPath, "utf8");
function get(k) {
  const m = env.match(new RegExp("^" + k + "=(.+)$", "m"));
  return m ? m[1].trim() : "";
}

const host = get("DB_HOST");
const port = parseInt(get("DB_PORT"), 10);
const user = get("DB_USER");
const password = get("DB_PASSWORD");
const database = get("DB_NAME");

(async () => {
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  try {
    await conn.query("SELECT 1 FROM profesionales LIMIT 1");
  } catch (e) {
    if (e.code !== "ER_NO_SUCH_TABLE") throw e;
    const setupPath = path.join(__dirname, "setup-database.sql");
    const setupSql = fs.readFileSync(setupPath, "utf8");
    await conn.query(setupSql);
    console.log("Esquema aplicado (setup-database.sql).");
  }

  await conn.query(
    `INSERT INTO profesionales (id, nombre, codigo, estado) VALUES (1, 'Carlos Balbi', 'CARLOS_BALBI', 'ACTIVO')
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), codigo = VALUES(codigo), estado = VALUES(estado)`
  );

  const sqlPath = path.join(__dirname, "seed-profesionales-servicios-horarios.sql");
  let seedSql = fs.readFileSync(sqlPath, "utf8");
  seedSql = seedSql.replace(/^USE balbi;/m, "USE `" + database.replace(/`/g, "") + "`;");
  await conn.query(seedSql);
  console.log("Seed profesionales/servicios/horarios ejecutado en", database);

  await conn.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
