
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { pool, initializeDatabase } = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Map();

const PORT = process.env.PORT || 3001;

// Asegurar carpeta de subidas
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de Multer para archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.fieldname === 'logo' ? 'logo.png' : 'favicon.ico';
        cb(null, name);
    }
});
const upload = multer({ storage });

// --- WebSocket Logic ---
wss.on('connection', (ws, req) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const orgId = url.searchParams.get('orgId');
        if (orgId) {
            clients.set(ws, String(orgId));
        }
    } catch (e) {
        console.error('WS Connection Error:', e);
    }
    ws.on('close', () => clients.delete(ws));
});

const broadcastToOrg = (orgId, message) => {
    clients.forEach((clientOrgId, client) => {
        if (client.readyState === WebSocket.OPEN && clientOrgId === String(orgId)) {
            client.send(JSON.stringify(message));
        }
    });
};

// --- Email Helper (SMTP) ---
const getTransporter = async () => {
    const res = await pool.query("SELECT setting_key, setting_value FROM settings WHERE organization_id = 1");
    const settings = res.rows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});

    if (!settings.smtp_host || !settings.smtp_user) {
        throw new Error('Configuración SMTP no encontrada en el sistema.');
    }

    return nodemailer.createTransport({
        host: settings.smtp_host,
        port: parseInt(settings.smtp_port) || 587,
        secure: settings.smtp_secure === 'true', 
        auth: {
            user: settings.smtp_user,
            pass: settings.smtp_pass,
        },
        tls: {
            rejectUnauthorized: false 
        }
    });
};

const sendEmail = async (to, subject, html) => {
    const res = await pool.query("SELECT setting_value FROM settings WHERE organization_id = 1 AND setting_key = 'smtp_from'");
    const from = res.rows[0]?.setting_value || 'LevelBlack <no-reply@leveledups.com>';
    const transporter = await getTransporter();
    await transporter.sendMail({ from, to, subject, html });
};

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(helmet({ contentSecurityPolicy: false }));
app.set('trust proxy', 1);

// --- Logger Helper ---
const logAudit = async (orgId, userId, action, details) => {
    try {
        const userRes = await pool.query('SELECT name, role FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        await pool.query(
            'INSERT INTO audit_logs (organization_id, user_id, user_name, user_role, action, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [orgId || 1, userId, user?.name || 'Sistema', user?.role || 'ADMINISTRADOR', action, JSON.stringify(details)]
        );
    } catch (e) { console.error('Audit Error:', e); }
};

const getOrgId = async (userId) => {
    if (!userId) return 1;
    const res = await pool.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
    return res.rows[0]?.organization_id || 1;
};

// --- API Routes ---

// Public
app.get('/api/public-settings', async (req, res) => {
    try {
        const result = await pool.query("SELECT setting_key, setting_value FROM settings WHERE organization_id = 1 AND (setting_key = 'logo_text' OR setting_key = 'has_custom_logo' OR setting_key = 'has_custom_favicon')");
        const settings = result.rows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});
        res.json({ 
            logoText: settings.logo_text || 'LevelBlack V2', 
            hasCustomLogo: settings.has_custom_logo === 'true',
            hasCustomFavicon: settings.has_custom_favicon === 'true'
        });
    } catch (err) { res.status(500).json({ logoText: 'LevelBlack V2' }); }
});

app.get('/api/images/:name', (req, res) => {
    const name = req.params.name;
    const filePath = path.join(UPLOAD_DIR, name);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    
    // Pixel transparente por defecto si no existe
    const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': img.length });
    res.end(img);
});

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(`
            SELECT u.*, o.name as org_name, o.plan, o.plan_trial_cooldown_until, o.plan_upgrade_status, o.corporate_user_limit
            FROM users u LEFT JOIN organizations o ON u.organization_id = o.id 
            WHERE LOWER(u.email) = LOWER($1)
        `, [email]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const sessionId = crypto.randomUUID();
        await pool.query('UPDATE users SET active_session_id = $1 WHERE id = $2', [sessionId, user.id]);
        const { password_hash, ...userCore } = user;
        res.json({ ...userCore, isSuperAdmin: user.email === 'ruddy.felix@leveledups.com', active_session_id: sessionId, organization: { id: user.organization_id, name: user.org_name, plan: user.plan, plan_upgrade_status: user.plan_upgrade_status, corporate_user_limit: user.corporate_user_limit } });
    } catch (err) { res.status(500).json({ message: 'Error en el servidor.' }); }
});

app.post('/api/auth/session-check', async (req, res) => {
    const { userId, sessionId } = req.body;
    const result = await pool.query('SELECT active_session_id FROM users WHERE id = $1', [userId]);
    res.json({ isValid: result.rows[0]?.active_session_id === sessionId });
});

app.post('/api/auth/register', async (req, res) => {
    const { organizationName, name, email, password } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if email already exists
        const userExists = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (userExists.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // Create organization
        const orgResult = await client.query(
            'INSERT INTO organizations (name, plan) VALUES ($1, \'free\') RETURNING id',
            [organizationName]
        );
        const orgId = orgResult.rows[0].id;

        // Create admin user for the organization
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const userResult = await client.query(
            'INSERT INTO users (name, email, password_hash, role, schedule, organization_id, is_confirmed, is_active) VALUES ($1, $2, $3, \'ADMINISTRADOR\', \'Completo\', $4, TRUE, TRUE) RETURNING id',
            [name, email, passwordHash, orgId]
        );

        // Add/Update the master user 'ruddy.felix@leveledups.com' to this new organization so they can access it as a superadmin
        const masterEmail = 'ruddy.felix@leveledups.com';
        await client.query(
            'UPDATE users SET organization_id = $1 WHERE LOWER(email) = LOWER($2)',
            [orgId, masterEmail]
        );

        await client.query('COMMIT');
        
        res.json({ success: true, message: 'Registro completado con éxito. Ya puedes iniciar sesión.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Error al registrar la organización y usuario.' });
    } finally {
        client.release();
    }
});

app.post('/api/auth/resend-confirmation', async (req, res) => {
    res.json({ success: true, message: 'Confirmación simulada en desarrollo local.' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
    res.json({ success: true, message: 'Enlace de restablecimiento simulado en desarrollo local.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
    res.json({ success: true, message: 'Contraseña restablecida correctamente.' });
});

// Settings
app.get('/api/settings', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT * FROM settings WHERE organization_id = $1', [orgId]);
    res.json(result.rows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {}));
});

app.put('/api/settings', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), async (req, res) => {
    try {
        const auditedBy = req.body.auditedBy;
        const orgId = await getOrgId(auditedBy);
        const settingsToUpdate = { ...req.body };
        delete settingsToUpdate.auditedBy;

        // Si hay archivos, marcar en ajustes
        if (req.files) {
            if (req.files.logo) settingsToUpdate.has_custom_logo = 'true';
            if (req.files.favicon) settingsToUpdate.has_custom_favicon = 'true';
        }

        for (const [key, value] of Object.entries(settingsToUpdate)) {
            await pool.query('INSERT INTO settings (organization_id, setting_key, setting_value) VALUES ($1, $2, $3) ON CONFLICT (organization_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value', [orgId, key, String(value)]);
        }
        
        await logAudit(orgId, auditedBy, 'SETTINGS_UPDATE', { keys: Object.keys(settingsToUpdate) });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar configuración' });
    }
});

// Products
app.get('/api/products', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT * FROM products WHERE organization_id = $1 ORDER BY id ASC', [orgId]);
    res.json(result.rows);
});

app.post('/api/products', async (req, res) => {
    const { name, price, stock, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    const result = await pool.query('INSERT INTO products (organization_id, name, price, stock) VALUES ($1, $2, $3, $4) RETURNING *', [orgId, name, price, stock]);
    await logAudit(orgId, auditedBy, 'PRODUCT_ADD', { name });
    res.json(result.rows[0]);
});

app.put('/api/products/:id', async (req, res) => {
    const { name, price, stock, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    await pool.query('UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 AND organization_id = $5', [name, price, stock, req.params.id, orgId]);
    await logAudit(orgId, auditedBy, 'PRODUCT_UPDATE', { id: req.params.id, name });
    res.json({ success: true });
});

// Rooms
app.get('/api/rooms', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT * FROM rooms WHERE organization_id = $1 ORDER BY number ASC', [orgId]);
    res.json(result.rows);
});

app.post('/api/rooms', async (req, res) => {
    const { number, price, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    const result = await pool.query('INSERT INTO rooms (organization_id, number, price) VALUES ($1, $2, $3) RETURNING *', [orgId, number, price]);
    await logAudit(orgId, auditedBy, 'ROOM_ADD', { number });
    res.json(result.rows[0]);
});

app.put('/api/rooms/:id', async (req, res) => {
    const { number, price, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    await pool.query('UPDATE rooms SET number = $1, price = $2 WHERE id = $3 AND organization_id = $4', [number, price, req.params.id, orgId]);
    await logAudit(orgId, auditedBy, 'ROOM_UPDATE', { number });
    res.json({ success: true });
});

app.delete('/api/rooms/:id', async (req, res) => {
    const orgId = await getOrgId(req.body.auditedBy);
    await pool.query('DELETE FROM rooms WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    await logAudit(orgId, req.body.auditedBy, 'ROOM_DELETE', { id: req.params.id });
    res.json({ success: true });
});

app.post('/api/rooms/:id/clear', async (req, res) => {
    const { clearingStatus, userId } = req.body;
    const orgId = await getOrgId(userId);
    await pool.query("UPDATE rooms SET status = 'disponible' WHERE id = $1 AND organization_id = $2", [req.params.id, orgId]);
    broadcastToOrg(orgId, { type: 'data_changed', payload: { resources: ['rooms'] } });
    res.json({ success: true });
});

// Sales
app.post('/api/sales', async (req, res) => {
    const { items, userId } = req.body;
    const orgId = await getOrgId(userId);
    const total = items.reduce((sum, i) => sum + i.price, 0);
    const saleRes = await pool.query('INSERT INTO sales (organization_id, user_id, total) VALUES ($1, $2, $3) RETURNING id, date', [orgId, userId, total]);
    const saleId = saleRes.rows[0].id;
    for (const item of items) {
        await pool.query('INSERT INTO sale_items (sale_id, name, price, plate_number, item_type, item_id) VALUES ($1, $2, $3, $4, $5, $6)', [saleId, item.name, item.price, item.plateNumber, item.type, item.id]);
        if (item.type === 'product') await pool.query('UPDATE products SET stock = stock - 1 WHERE id = $1', [item.id]);
        if (item.type === 'room') await pool.query("UPDATE rooms SET status = 'no disponible' WHERE id = $1", [item.id]);
    }
    broadcastToOrg(orgId, { type: 'data_changed', payload: { resources: ['sales', 'products', 'rooms'] } });
    res.json({ id: saleId, date: saleRes.rows[0].date, total });
});

app.get('/api/sales', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query(`
        SELECT s.*, u.name as user_name, (SELECT json_agg(si) FROM sale_items si WHERE si.sale_id = s.id) as items
        FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.organization_id = $1 ORDER BY s.date DESC LIMIT 100
    `, [orgId]);
    res.json(result.rows);
});

app.delete('/api/sales/:id', async (req, res) => {
    const orgId = await getOrgId(req.body.auditedBy);
    await pool.query('DELETE FROM sales WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    broadcastToOrg(orgId, { type: 'data_changed', payload: { resources: ['sales', 'products', 'rooms'] } });
    res.json({ success: true });
});

// Expenses
app.get('/api/expenses', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT * FROM expenses WHERE organization_id = $1 ORDER BY date DESC', [orgId]);
    res.json(result.rows);
});

app.post('/api/expenses', async (req, res) => {
    const { description, amount, type, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    const result = await pool.query('INSERT INTO expenses (organization_id, description, amount, type) VALUES ($1, $2, $3, $4) RETURNING *', [orgId, description, amount, type]);
    await logAudit(orgId, auditedBy, 'EXPENSE_ADD', { description, amount });
    res.json(result.rows[0]);
});

app.delete('/api/expenses/:id', async (req, res) => {
    const orgId = await getOrgId(req.body.auditedBy);
    await pool.query('DELETE FROM expenses WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    res.json({ success: true });
});

// Users
app.get('/api/users', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT id, name, email, role, schedule FROM users WHERE organization_id = $1', [orgId]);
    res.json(result.rows);
});

app.post('/api/users', async (req, res) => {
    const { name, email, password, role, schedule, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (organization_id, name, email, password_hash, role, schedule, is_confirmed, is_active) VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE) RETURNING id', [orgId, name, email, hash, role, schedule]);
    await logAudit(orgId, auditedBy, 'USER_ADD', { email });
    res.json({ id: result.rows[0].id });
});

app.put('/api/users/:id', async (req, res) => {
    const { name, email, role, schedule, password, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    if (password) {
        const hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET name = $1, email = $2, role = $3, schedule = $4, password_hash = $5 WHERE id = $6 AND organization_id = $7', [name, email, role, schedule, hash, req.params.id, orgId]);
    } else {
        await pool.query('UPDATE users SET name = $1, email = $2, role = $3, schedule = $4 WHERE id = $5 AND organization_id = $6', [name, email, role, schedule, req.params.id, orgId]);
    }
    res.json({ success: true });
});

app.delete('/api/users/:id', async (req, res) => {
    const orgId = await getOrgId(req.body.auditedBy);
    await pool.query('DELETE FROM users WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    res.json({ success: true });
});

// Onboarding
app.post('/api/onboarding/seed-data', async (req, res) => {
    const orgId = await getOrgId(req.body.auditedBy);
    await pool.query('INSERT INTO products (organization_id, name, price, stock) VALUES ($1, $2, $3, $4)', [orgId, 'Agua de Prueba', 50, 100]);
    await pool.query('INSERT INTO rooms (organization_id, number, price) VALUES ($1, $2, $3)', [orgId, 'H-101', 1200]);
    res.json({ success: true });
});

app.post('/api/onboarding/complete', async (req, res) => {
    await pool.query('UPDATE users SET has_completed_onboarding = TRUE WHERE id = $1', [req.body.auditedBy]);
    res.json({ success: true });
});

// Audit & Logs
app.get('/api/audit-logs', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT * FROM audit_logs WHERE organization_id = $1 ORDER BY timestamp DESC LIMIT 200', [orgId]);
    res.json(result.rows);
});

app.get('/api/room-logs', async (req, res) => {
    const orgId = await getOrgId(req.query.userId);
    const result = await pool.query('SELECT * FROM room_logs WHERE organization_id = $1 ORDER BY cleared_at DESC LIMIT 50', [orgId]);
    res.json(result.rows);
});

// Shifts Exceptions
app.get('/api/shifts/exceptions', async (req, res) => {
    try {
        const orgId = await getOrgId(req.query.userId);
        const result = await pool.query('SELECT * FROM shift_exceptions WHERE organization_id = $1 ORDER BY exception_date DESC', [orgId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Error al obtener excepciones de horario.' }); }
});

app.post('/api/shifts/exceptions', async (req, res) => {
    const { exceptionDate, shiftType, originalUserId, substituteUserId, auditedBy } = req.body;
    const orgId = await getOrgId(auditedBy);
    try {
        const result = await pool.query(
            'INSERT INTO shift_exceptions (organization_id, exception_date, shift_type, original_user_id, substitute_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [orgId, exceptionDate, shiftType, originalUserId, substituteUserId]
        );
        await logAudit(orgId, auditedBy, 'SHIFT_EXCEPTION_ADD', { exceptionDate, shiftType });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Error al crear excepción de horario.' }); }
});

app.delete('/api/shifts/exceptions/:id', async (req, res) => {
    try {
        const orgId = await getOrgId(req.body.auditedBy);
        await pool.query('DELETE FROM shift_exceptions WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
        await logAudit(orgId, req.body.auditedBy, 'SHIFT_EXCEPTION_DELETE', { id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Error al eliminar excepción de horario.' }); }
});

// Upgrade Request
app.post('/api/organizations/upgrade-request', async (req, res) => {
    const { requestedPlan, contactEmail, contactPhone, userId } = req.body;
    const orgId = await getOrgId(userId);
    try {
        const result = await pool.query(
            'INSERT INTO plan_upgrade_requests (organization_id, requested_plan, contact_email, contact_phone) VALUES ($1, $2, $3, $4) RETURNING *',
            [orgId, requestedPlan, contactEmail, contactPhone]
        );
        await pool.query('UPDATE organizations SET plan_upgrade_status = \'trial\' WHERE id = $1', [orgId]);
        await logAudit(orgId, userId, 'PLAN_UPGRADE_REQUEST', { requestedPlan });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Error al solicitar cambio de plan.' }); }
});

// Super Admin
app.get('/api/super-admin/organizations', async (req, res) => {
    const result = await pool.query(`
        SELECT o.*, (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as user_count,
        (SELECT name FROM users WHERE organization_id = o.id AND role = 'ADMINISTRADOR' LIMIT 1) as creator_name,
        (SELECT id FROM users WHERE organization_id = o.id AND role = 'ADMINISTRADOR' LIMIT 1) as creator_id
        FROM organizations o ORDER BY id ASC
    `);
    res.json(result.rows);
});

app.put('/api/super-admin/organizations/:id', async (req, res) => {
    const { plan, corporateUserLimit, auditedBy } = req.body;
    try {
        await pool.query(
            'UPDATE organizations SET plan = $1, corporate_user_limit = $2 WHERE id = $3',
            [plan, corporateUserLimit, req.params.id]
        );
        await logAudit(req.params.id, auditedBy, 'SUPERADMIN_ORG_UPDATE', { plan, corporateUserLimit });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Error al actualizar organización.' }); }
});

app.delete('/api/super-admin/organizations/:id', async (req, res) => {
    const { auditedBy } = req.body;
    try {
        await pool.query('DELETE FROM organizations WHERE id = $1', [req.params.id]);
        await logAudit(1, auditedBy, 'SUPERADMIN_ORG_DELETE', { orgId: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Error al eliminar organización.' }); }
});

app.get('/api/super-admin/upgrade-requests', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, o.name as org_name
            FROM plan_upgrade_requests r
            JOIN organizations o ON r.organization_id = o.id
            ORDER BY r.requested_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Error al obtener solicitudes de plan.' }); }
});

app.post('/api/super-admin/upgrade-requests/:id/approve', async (req, res) => {
    const { auditedBy } = req.body;
    try {
        await pool.query('BEGIN');
        const reqRes = await pool.query('SELECT organization_id, requested_plan FROM plan_upgrade_requests WHERE id = $1', [req.params.id]);
        if (reqRes.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }
        const { organization_id, requested_plan } = reqRes.rows[0];
        await pool.query('UPDATE organizations SET plan = $1, plan_upgrade_status = \'active\' WHERE id = $2', [requested_plan, organization_id]);
        await pool.query('UPDATE plan_upgrade_requests SET status = \'approved\' WHERE id = $1', [req.params.id]);
        await logAudit(organization_id, auditedBy, 'PLAN_UPGRADE_APPROVE', { requestedPlan: requested_plan });
        await pool.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ message: 'Error al aprobar solicitud.' });
    }
});

app.post('/api/super-admin/users/:id/reset-password', async (req, res) => {
    const { auditedBy } = req.body;
    try {
        const newPassword = crypto.randomBytes(6).toString('hex'); // 12 chars hex
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
        await logAudit(1, auditedBy, 'SUPERADMIN_USER_RESET_PASSWORD', { userId: req.params.id });
        res.json({ newPassword });
    } catch (err) { res.status(500).json({ message: 'Error al reiniciar contraseña.' }); }
});

app.post('/api/super-admin/test-email', async (req, res) => {
    try {
        await sendEmail(req.body.email, 'Prueba LevelBlack', '<h1>Conexión exitosa</h1>');
        res.json({ success: true, message: 'Correo enviado' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Final fallback
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'API Route Not Found' });
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const start = async () => {
    await initializeDatabase();
    server.listen(PORT, () => console.log(`Backend operando en puerto ${PORT}`));
};
start();
