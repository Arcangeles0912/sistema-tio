
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error('\n\x1b[31m%s\x1b[0m', 'ERROR: DATABASE_URL no definida.');
    process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async (client) => {
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE plan_type AS ENUM ('free', 'professional', 'business', 'corporate');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_status') THEN
        CREATE TYPE plan_status AS ENUM ('active', 'trial', 'expired');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMINISTRADOR', 'VENDEDOR', 'LIMPIADOR', 'COORDINADOR');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_schedule') THEN
        CREATE TYPE user_schedule AS ENUM ('Completo', 'Mañana', 'Tarde', 'Noche', 'Fuera de la empresa');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
        CREATE TYPE room_status AS ENUM ('disponible', 'no disponible');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_clearing_status') THEN
        CREATE TYPE room_clearing_status AS ENUM ('LISTA', 'ARTICULO_OLVIDADO', 'REPORTE_ROBO');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
      END IF;
    END $$;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      plan plan_type NOT NULL DEFAULT 'free',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      plan_upgrade_status plan_status DEFAULT 'active',
      corporate_user_limit INTEGER,
      plan_trial_cooldown_until TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role user_role NOT NULL,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT TRUE,
      is_confirmed BOOLEAN DEFAULT FALSE,
      schedule user_schedule NOT NULL DEFAULT 'Completo',
      active_session_id VARCHAR(255),
      has_completed_onboarding BOOLEAN DEFAULT FALSE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      setting_key VARCHAR(50) NOT NULL,
      setting_value TEXT NOT NULL,
      UNIQUE(organization_id, setting_key)
    );

    CREATE TABLE IF NOT EXISTS rooms ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, number VARCHAR(50), price NUMERIC, status room_status DEFAULT 'disponible');
    CREATE TABLE IF NOT EXISTS products ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, name VARCHAR(255), price NUMERIC, stock INTEGER);
    CREATE TABLE IF NOT EXISTS sales ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, user_id INTEGER, total NUMERIC, date TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS sale_items ( id SERIAL PRIMARY KEY, sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE, name VARCHAR(255), price NUMERIC, plate_number VARCHAR(50), item_type VARCHAR(20), item_id INTEGER);
    CREATE TABLE IF NOT EXISTS room_logs ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, room_id INTEGER, room_number VARCHAR(50), sold_at TIMESTAMPTZ, sold_by_user_name VARCHAR(100), cleared_at TIMESTAMPTZ DEFAULT NOW(), cleared_by_user_name VARCHAR(100), clearing_status room_clearing_status);
    CREATE TABLE IF NOT EXISTS shift_exceptions ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, exception_date DATE, shift_type VARCHAR(20), original_user_id INTEGER, substitute_user_id INTEGER);
    CREATE TABLE IF NOT EXISTS audit_logs ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, timestamp TIMESTAMPTZ DEFAULT NOW(), user_id INTEGER, user_name VARCHAR(100), user_role user_role, action VARCHAR(255), details JSONB);
    CREATE TABLE IF NOT EXISTS expenses ( id SERIAL PRIMARY KEY, organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE, description VARCHAR(255), amount NUMERIC, type VARCHAR(50), date TIMESTAMPTZ DEFAULT NOW());
    
    CREATE TABLE IF NOT EXISTS plan_upgrade_requests (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      requested_plan plan_type NOT NULL,
      contact_email VARCHAR(100),
      contact_phone VARCHAR(50),
      status request_status DEFAULT 'pending',
      requested_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

const addColumnIfNotExists = async (client, tableName, columnName, columnDefinition) => {
    const checkRes = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
    `, [tableName, columnName]);
    if (checkRes.rowCount === 0) {
        await client.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
        console.log(`  [MIGRACIÓN] Agregada columna '${columnName}' a la tabla '${tableName}'.`);
    }
};

const runMigrations = async (client) => {
    console.log('Ejecutando verificaciones de compatibilidad de base de datos...');
    
    // organizations columns
    await addColumnIfNotExists(client, 'organizations', 'plan', "plan_type NOT NULL DEFAULT 'free'");
    await addColumnIfNotExists(client, 'organizations', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
    await addColumnIfNotExists(client, 'organizations', 'plan_upgrade_status', "plan_status DEFAULT 'active'");
    await addColumnIfNotExists(client, 'organizations', 'corporate_user_limit', 'INTEGER');
    await addColumnIfNotExists(client, 'organizations', 'plan_trial_cooldown_until', 'TIMESTAMPTZ');

    // users columns
    await addColumnIfNotExists(client, 'users', 'is_active', 'BOOLEAN DEFAULT TRUE');
    await addColumnIfNotExists(client, 'users', 'is_confirmed', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfNotExists(client, 'users', 'schedule', "user_schedule NOT NULL DEFAULT 'Completo'");
    await addColumnIfNotExists(client, 'users', 'active_session_id', 'VARCHAR(255)');
    await addColumnIfNotExists(client, 'users', 'has_completed_onboarding', 'BOOLEAN DEFAULT FALSE NOT NULL');

    // sale_items columns
    await addColumnIfNotExists(client, 'sale_items', 'plate_number', 'VARCHAR(50)');
    await addColumnIfNotExists(client, 'sale_items', 'item_type', 'VARCHAR(20)');
    await addColumnIfNotExists(client, 'sale_items', 'item_id', 'INTEGER');

    // expenses columns
    await addColumnIfNotExists(client, 'expenses', 'type', 'VARCHAR(50)');
    await addColumnIfNotExists(client, 'expenses', 'date', 'TIMESTAMPTZ DEFAULT NOW()');

    // Ensure default organization exists before inserting settings
    await client.query(`
        INSERT INTO organizations (id, name, plan)
        VALUES (1, 'LevelBlack Principal', 'corporate')
        ON CONFLICT (id) DO NOTHING
    `);

    // Track the current schema version in settings
    await client.query(`
        INSERT INTO settings (organization_id, setting_key, setting_value)
        VALUES (1, 'schema_version', '2.1.0')
        ON CONFLICT (organization_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
    `);
};

const ensureAdminAccess = async (client) => {
    console.log('Sincronizando Sistema y Super Usuario...');
    try {
        const adminEmail = 'ruddy.felix@leveledups.com';
        const masterPassword = '123'; 

        await client.query(`
            INSERT INTO organizations (id, name, plan) 
            VALUES (1, 'LevelBlack Principal', 'corporate') 
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `);
        
        await client.query("SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations))");

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(masterPassword, salt);

        const userRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [adminEmail]);
        
        if (userRes.rowCount > 0) {
            await client.query(`
                UPDATE users 
                SET password_hash = $1, 
                    is_confirmed = TRUE, 
                    is_active = TRUE, 
                    role = 'ADMINISTRADOR',
                    organization_id = 1,
                    has_completed_onboarding = TRUE
                WHERE LOWER(email) = LOWER($2)`, 
                [password_hash, adminEmail]
            );
            console.log(`  [MASTER ACCESS] Credenciales validadas y onboarding completado para: ${adminEmail}`);
        } else {
            await client.query(`
                INSERT INTO users (name, email, password_hash, role, schedule, organization_id, is_confirmed, is_active, has_completed_onboarding) 
                VALUES ('Ruddy Felix', $1, $2, 'ADMINISTRADOR', 'Completo', 1, TRUE, TRUE, TRUE)`,
                [adminEmail, password_hash]
            );
            console.log(`  [MASTER ACCESS] Super Usuario creado con éxito y onboarding completado.`);
        }

        // Seed default rooms if they don't exist
        const roomsCheck = await client.query('SELECT id FROM rooms WHERE organization_id = 1 LIMIT 1');
        if (roomsCheck.rowCount === 0) {
            await client.query(`
                INSERT INTO rooms (organization_id, number, price, status) VALUES
                (1, 'H-101', 1200, 'disponible'),
                (1, 'H-102', 1500, 'disponible'),
                (1, 'H-103', 1200, 'disponible')
            `);
            console.log('  [SEED] Habitaciones iniciales creadas.');
        }

        // Seed default products if they don't exist
        const productsCheck = await client.query('SELECT id FROM products WHERE organization_id = 1 LIMIT 1');
        if (productsCheck.rowCount === 0) {
            await client.query(`
                INSERT INTO products (organization_id, name, price, stock) VALUES
                (1, 'Agua Mineral', 50, 100),
                (1, 'Gaseosa Cola', 80, 50),
                (1, 'Snack de Papas', 60, 40)
            `);
            console.log('  [SEED] Productos iniciales creados.');
        }
    } catch (err) {
        console.error('  [ERROR] Fallo en sincronización:', err.message);
    }
};

const initializeDatabase = async () => {
  let client;
  let retries = 8;
  while (retries > 0) {
      try {
          client = await pool.connect();
          break;
      } catch (err) {
          retries--;
          console.warn(`[DB] No se pudo conectar a la base de datos. Reintentando en 3 segundos... (${retries} intentos restantes)`);
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 3000));
      }
  }

  try {
      await client.query('BEGIN');
      await createTables(client);
      await runMigrations(client);
      await ensureAdminAccess(client);
      await client.query('COMMIT');
      console.log('Base de Datos preparada, migrada y blindada.');
  } catch (err) {
      if (client) await client.query('ROLLBACK');
      throw err;
  } finally {
      if (client) client.release();
  }
};

module.exports = { pool, initializeDatabase };
