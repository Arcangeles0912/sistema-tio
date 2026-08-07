const bcrypt = require('bcryptjs');
const { pool } = require('./db.js');

async function setPassword() {
  const hash = await bcrypt.hash('123', 10);
  await pool.query('UPDATE users SET password_hash = $1, is_active = TRUE, is_confirmed = TRUE, has_completed_onboarding = TRUE', [hash]);
  console.log('PASSWORDS SUCCESSFULLY SET TO 123');
  process.exit(0);
}

setPassword().catch(err => {
  console.error(err);
  process.exit(1);
});
