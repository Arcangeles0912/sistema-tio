require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const resetDatabase = async () => {
  const client = await pool.connect();
  console.log('Connecting to the database to reset it...');
  try {
    console.log('Dropping existing tables and types...');
    
    await client.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS room_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS shift_exceptions CASCADE;');
    await client.query('DROP TABLE IF EXISTS sale_items CASCADE;');
    await client.query('DROP TABLE IF EXISTS expenses CASCADE;');
    await client.query('DROP TABLE IF EXISTS sales CASCADE;');
    await client.query('DROP TABLE IF EXISTS products CASCADE;');
    await client.query('DROP TABLE IF EXISTS rooms CASCADE;');
    await client.query('DROP TABLE IF EXISTS plan_upgrade_requests CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    await client.query('DROP TABLE IF EXISTS settings CASCADE;');
    await client.query('DROP TABLE IF EXISTS organizations CASCADE;');
    
    await client.query('DROP TYPE IF EXISTS room_clearing_status;');
    await client.query('DROP TYPE IF EXISTS room_status;');
    await client.query('DROP TYPE IF EXISTS user_schedule;');
    await client.query('DROP TYPE IF EXISTS user_role;');
    await client.query('DROP TYPE IF EXISTS expense_type;');
    await client.query('DROP TYPE IF EXISTS shift_type_enum;');
    await client.query('DROP TYPE IF EXISTS request_status;');
    await client.query('DROP TYPE IF EXISTS plan_status;');
    await client.query('DROP TYPE IF EXISTS plan_type;');

    console.log('✅ Database cleaned successfully.');
    console.log('You can now restart the server to re-initialize the database.');

  } catch (err) {
    console.error('❌ Error while resetting the database:', err);
  } finally {
    await client.release();
    await pool.end();
  }
};

resetDatabase();