#!/usr/bin/env python3
"""
Ejecuta todos los scripts SQL de migración en orden, usando credenciales de .env.
Uso: python run-migrations.py [--dry-run]

Intenta primero con el cliente 'mysql' (si está en PATH). Si no está, usa
mysql.connector (pip install mysql-connector-python).
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path


def load_env(env_path: Path) -> dict:
    env = {}
    if not env_path.exists():
        return env
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                env[k.strip()] = v
    return env


def run_with_mysql_client(script_dir: Path, migration_files: list, env: dict) -> tuple[int, list]:
    """Ejecuta con subprocess mysql. Retorna (ok_count, errors)."""
    db_host = env.get("DB_HOST", "localhost")
    db_user = env.get("DB_USER", "root")
    db_password = env.get("DB_PASSWORD", "")
    db_name = env.get("DB_NAME", "balbi")
    db_port = env.get("DB_PORT", "3306")
    run_env = os.environ.copy()
    if db_password:
        run_env["MYSQL_PWD"] = db_password
    ok = 0
    errors = []
    for name in migration_files:
        path = script_dir / name
        if not path.exists():
            continue
        print(f"[RUN] {name} ...", end=" ", flush=True)
        cmd = [
            "mysql",
            "-h", db_host,
            "-P", str(db_port),
            "-u", db_user,
            db_name,
            "-e", path.read_text(encoding="utf-8"),
        ]
        try:
            result = subprocess.run(cmd, env=run_env, capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                err = (result.stderr or result.stdout or "Error desconocido").strip()
                errors.append((name, err))
                print("ERROR")
                if err:
                    print(err, file=sys.stderr)
            else:
                print("OK")
                ok += 1
        except FileNotFoundError:
            raise
        except subprocess.TimeoutExpired:
            errors.append((name, "Timeout"))
            print("TIMEOUT")
    return ok, errors


def run_with_connector(script_dir: Path, migration_files: list, env: dict) -> tuple[int, list]:
    """Ejecuta con mysql.connector. Retorna (ok_count, errors)."""
    import mysql.connector
    import re
    db_host = env.get("DB_HOST", "localhost")
    db_user = env.get("DB_USER", "root")
    db_password = env.get("DB_PASSWORD", "")
    db_name = env.get("DB_NAME", "balbi")
    db_port = int(env.get("DB_PORT", "3306"))
    conn = mysql.connector.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        password=db_password,
        database=db_name,
        autocommit=True,
    )
    ok = 0
    errors = []
    try:
        for name in migration_files:
            path = script_dir / name
            if not path.exists():
                continue
            print(f"[RUN] {name} ...", end=" ", flush=True)
            sql = path.read_text(encoding="utf-8")
            # Quitar comentarios de línea y dividir por ; (cada sentencia)
            statements = [
                s.strip() for s in re.split(r";\s*\n", sql)
                if s.strip() and not s.strip().startswith("--")
            ]
            cursor = conn.cursor()
            try:
                for stmt in statements:
                    if stmt:
                        cursor.execute(stmt)
                cursor.close()
                print("OK")
                ok += 1
            except Exception as e:
                cursor.close()
                errors.append((name, str(e)))
                print("ERROR")
                print(str(e), file=sys.stderr)
    finally:
        conn.close()
    return ok, errors


def main():
    parser = argparse.ArgumentParser(description="Ejecutar scripts SQL de migración")
    parser.add_argument("--dry-run", action="store_true", help="Solo listar scripts, no ejecutar")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    backend_root = script_dir.parent
    env_path = backend_root / ".env"

    env = load_env(env_path)
    try:
        import dotenv
        dotenv.load_dotenv(env_path)
        for k, v in os.environ.items():
            if k.startswith("DB_") and k not in env:
                env[k] = v
    except ImportError:
        pass

    migration_files = [
        "migrate-bloqueos-agenda.sql",
        "migrate-eventos-agenda.sql",
        "migrate-turnos-tipo.sql",
        "migrate-mascotas.sql",
        "migrate-vacunas.sql",
        "migrate-mascota-relations.sql",
        "migrate-files-turno-tipo.sql",
        "migrate-historia-clinica-consultas.sql",
    ]

    if args.dry_run:
        for name in migration_files:
            path = script_dir / name
            status = path.name if path.exists() else f"{name} (no existe)"
            print(f"  {status}")
        print("Dry-run: no se ejecutó ningún script.")
        return 0

    # Intentar con cliente mysql
    try:
        ok, errors = run_with_mysql_client(script_dir, migration_files, env)
    except FileNotFoundError:
        print("Cliente 'mysql' no encontrado. Usando mysql.connector (Python)...")
        try:
            ok, errors = run_with_connector(script_dir, migration_files, env)
        except ImportError:
            print(
                "Error: Necesitas instalar mysql.connector: pip install mysql-connector-python",
                file=sys.stderr,
            )
            sys.exit(1)

    if errors:
        print(f"\nFallaron {len(errors)} script(s).", file=sys.stderr)
        for name, err in errors:
            print(f"  - {name}: {err}", file=sys.stderr)
        sys.exit(1)
    print(f"\nListo. Se ejecutaron {ok} script(s) correctamente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
