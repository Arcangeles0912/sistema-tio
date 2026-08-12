import bcrypt from 'bcryptjs';

// Namespace wrapper for localStorage database tables
const DB_PREFIX = 'levelblack_db_';

const getTable = <T>(tableName: string, defaultVal: T[] = []): T[] => {
  const data = localStorage.getItem(DB_PREFIX + tableName);
  if (!data) {
    localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultVal;
  }
};

const saveTable = <T>(tableName: string, data: T[]): void => {
  localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data));
};

const getSingleSetting = (key: string, defaultVal: string = ''): string => {
  const settings = getTable<any>('settings', [
    { setting_key: 'logo_text', setting_value: 'LevelBlack V2' },
    { setting_key: 'address', setting_value: '' },
    { setting_key: 'rnc', setting_value: '' }
  ]);
  const found = settings.find(s => s.setting_key === key);
  return found ? found.setting_value : defaultVal;
};

// Seed default structures
const initializeLocalStorageDb = () => {
  // Organizations
  getTable('organizations', [
    { id: 1, name: 'LevelBlack Principal', plan: 'corporate', plan_upgrade_status: 'active' }
  ]);

  // Default Admin User
  getTable('users', [
    {
      id: 1,
      name: 'Ruddy Felix',
      email: 'ruddy.felix@leveledups.com',
      password_hash: bcrypt.hashSync('123', 10),
      role: 'ADMINISTRADOR',
      schedule: 'Completo',
      is_active: true,
      is_confirmed: true,
      organization_id: 1,
      has_completed_onboarding: true
    }
  ]);

  // Default Settings
  getTable('settings', [
    { setting_key: 'logo_text', setting_value: 'LevelBlack V2' },
    { setting_key: 'address', setting_value: '' },
    { setting_key: 'rnc', setting_value: '' }
  ]);
};

initializeLocalStorageDb();

// Log audit events locally
const logLocalAudit = (userId: number, action: string, details: any) => {
  const users = getTable<any>('users');
  const user = users.find(u => u.id === userId);
  const auditLogs = getTable<any>('audit_logs');
  auditLogs.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    organization_id: 1,
    timestamp: new Date().toISOString(),
    user_id: userId,
    user_name: user?.name || 'Sistema',
    user_role: user?.role || 'ADMINISTRADOR',
    action,
    details
  });
  saveTable('audit_logs', auditLogs.slice(0, 200)); // Cap logs at 200
};

export const localDatabase = {
  handleRequest: async (url: string, options: any = {}): Promise<any> => {
    const cleanUrl = url.split('?')[0];
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. Auth Login
    if (cleanUrl === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      const users = getTable<any>('users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        throw new Error('Credenciales inválidas.');
      }
      const sessionId = 'session_' + Math.random().toString(36).substring(2);
      user.active_session_id = sessionId;
      saveTable('users', users);

      const orgs = getTable<any>('organizations');
      const org = orgs.find(o => o.id === user.organization_id) || orgs[0];

      return {
        ...user,
        isSuperAdmin: user.email === 'ruddy.felix@leveledups.com',
        active_session_id: sessionId,
        organization: org
      };
    }

    // 2. Auth Session Check
    if (cleanUrl === '/auth/session-check' && method === 'POST') {
      const { userId, sessionId } = body;
      const users = getTable<any>('users');
      const user = users.find(u => u.id === Number(userId));
      return { isValid: user?.active_session_id === sessionId };
    }

    // 3. Products CRUD
    if (cleanUrl === '/products') {
      if (method === 'GET') {
        return getTable('products');
      }
      if (method === 'POST') {
        const { name, price, stock, auditedBy } = body;
        const products = getTable<any>('products');
        const newProduct = {
          id: Date.now(),
          organization_id: 1,
          name,
          price: Number(price),
          stock: Number(stock)
        };
        products.push(newProduct);
        saveTable('products', products);
        logLocalAudit(auditedBy, 'PRODUCT_ADD', { name });
        return newProduct;
      }
    }
    if (cleanUrl.startsWith('/products/') && method === 'PUT') {
      const id = Number(cleanUrl.split('/')[2]);
      const { name, price, stock, auditedBy } = body;
      const products = getTable<any>('products');
      const productIdx = products.findIndex(p => p.id === id);
      if (productIdx !== -1) {
        products[productIdx] = {
          ...products[productIdx],
          name,
          price: Number(price),
          stock: Number(stock)
        };
        saveTable('products', products);
        logLocalAudit(auditedBy, 'PRODUCT_UPDATE', { id, name });
      }
      return { success: true };
    }

    // 4. Rooms CRUD
    if (cleanUrl === '/rooms') {
      if (method === 'GET') {
        return getTable('rooms');
      }
      if (method === 'POST') {
        const { number, price, auditedBy } = body;
        const rooms = getTable<any>('rooms');
        const newRoom = {
          id: Date.now(),
          organization_id: 1,
          number,
          price: Number(price),
          status: 'disponible'
        };
        rooms.push(newRoom);
        saveTable('rooms', rooms);
        logLocalAudit(auditedBy, 'ROOM_ADD', { number });
        return newRoom;
      }
    }
    if (cleanUrl.startsWith('/rooms/')) {
      const parts = cleanUrl.split('/');
      const id = Number(parts[2]);

      if (parts[3] === 'clear' && method === 'POST') {
        const { clearingStatus, userId } = body;
        const rooms = getTable<any>('rooms');
        const roomIdx = rooms.findIndex(r => r.id === id);
        if (roomIdx !== -1) {
          const room = rooms[roomIdx];
          room.status = 'disponible';
          saveTable('rooms', rooms);

          // Find the last sales transaction that had this room log
          const roomLogs = getTable<any>('room_logs');
          roomLogs.unshift({
            id: Date.now(),
            organization_id: 1,
            room_id: id,
            room_number: room.number,
            sold_at: new Date(Date.now() - 3600000).toISOString(), // Estimated
            sold_by_user_name: 'Cajero',
            cleared_at: new Date().toISOString(),
            cleared_by_user_name: 'Limpiador',
            clearing_status: clearingStatus
          });
          saveTable('room_logs', roomLogs);
        }
        return { success: true };
      }

      if (method === 'PUT') {
        const { number, price, auditedBy } = body;
        const rooms = getTable<any>('rooms');
        const roomIdx = rooms.findIndex(r => r.id === id);
        if (roomIdx !== -1) {
          rooms[roomIdx] = {
            ...rooms[roomIdx],
            number,
            price: Number(price)
          };
          saveTable('rooms', rooms);
          logLocalAudit(auditedBy, 'ROOM_UPDATE', { number });
        }
        return { success: true };
      }

      if (method === 'DELETE') {
        const auditedBy = body.auditedBy;
        const rooms = getTable<any>('rooms');
        const roomIdx = rooms.findIndex(r => r.id === id);
        if (roomIdx !== -1) {
          const room = rooms[roomIdx];
          rooms.splice(roomIdx, 1);
          saveTable('rooms', rooms);
          logLocalAudit(auditedBy, 'ROOM_DELETE', { id });
        }
        return { success: true };
      }
    }

    // 5. Users CRUD
    if (cleanUrl === '/users') {
      if (method === 'GET') {
        return getTable('users').map((u: any) => {
          const { password_hash, ...rest } = u;
          return rest;
        });
      }
      if (method === 'POST') {
        const { name, email, password, role, schedule, auditedBy } = body;
        const users = getTable<any>('users');
        const newUser = {
          id: Date.now(),
          organization_id: 1,
          name,
          email,
          password_hash: bcrypt.hashSync(password, 10),
          role,
          schedule,
          is_active: true,
          is_confirmed: true,
          has_completed_onboarding: true
        };
        users.push(newUser);
        saveTable('users', users);
        logLocalAudit(auditedBy, 'USER_ADD', { email });
        return { id: newUser.id };
      }
    }
    if (cleanUrl.startsWith('/users/') && method === 'PUT') {
      const id = Number(cleanUrl.split('/')[2]);
      const { name, email, role, schedule, password } = body;
      const users = getTable<any>('users');
      const userIdx = users.findIndex(u => u.id === id);
      if (userIdx !== -1) {
        users[userIdx] = {
          ...users[userIdx],
          name,
          email,
          role,
          schedule
        };
        if (password) {
          users[userIdx].password_hash = bcrypt.hashSync(password, 10);
        }
        saveTable('users', users);
      }
      return { success: true };
    }
    if (cleanUrl.startsWith('/users/') && method === 'DELETE') {
      const id = Number(cleanUrl.split('/')[2]);
      const users = getTable<any>('users');
      const userIdx = users.findIndex(u => u.id === id);
      if (userIdx !== -1) {
        users.splice(userIdx, 1);
        saveTable('users', users);
      }
      return { success: true };
    }

    // 6. Sales & Invoicing
    if (cleanUrl === '/sales') {
      if (method === 'GET') {
        const sales = getTable<any>('sales');
        const users = getTable<any>('users');
        return sales.map(s => {
          const user = users.find(u => u.id === s.user_id);
          return {
            ...s,
            user_name: user?.name || 'N/A'
          };
        });
      }
      if (method === 'POST') {
        const { items, userId } = body;
        const sales = getTable<any>('sales');
        const products = getTable<any>('products');
        const rooms = getTable<any>('rooms');

        const total = items.reduce((sum: number, i: any) => sum + Number(i.price), 0);
        const saleId = Date.now();
        const saleDate = new Date().toISOString();

        // Map items with table columns
        const saleItems = items.map((item: any) => {
          // Decrement stock or update status
          if (item.type === 'product') {
            const pIdx = products.findIndex(p => p.id === item.id);
            if (pIdx !== -1) {
              products[pIdx].stock = Math.max(0, products[pIdx].stock - 1);
            }
          }
          if (item.type === 'room') {
            const rIdx = rooms.findIndex(r => r.id === item.id);
            if (rIdx !== -1) {
              rooms[rIdx].status = 'no disponible';
            }
          }

          return {
            id: Date.now() + Math.floor(Math.random() * 1000),
            sale_id: saleId,
            name: item.name,
            price: Number(item.price),
            plate_number: item.plateNumber || null,
            item_type: item.type,
            item_id: item.id
          };
        });

        const newSale = {
          id: saleId,
          organization_id: 1,
          user_id: userId,
          total,
          date: saleDate,
          items: saleItems
        };

        sales.unshift(newSale);
        saveTable('sales', sales);
        saveTable('products', products);
        saveTable('rooms', rooms);

        return { id: saleId, date: saleDate, total };
      }
    }
    if (cleanUrl.startsWith('/sales/') && method === 'DELETE') {
      const id = Number(cleanUrl.split('/')[2]);
      const sales = getTable<any>('sales');
      const products = getTable<any>('products');
      const rooms = getTable<any>('rooms');

      const saleIdx = sales.findIndex(s => s.id === id);
      if (saleIdx !== -1) {
        const sale = sales[saleIdx];
        // Revert room status & stock
        (sale.items || []).forEach((item: any) => {
          const type = item.item_type || item.type;
          const itemId = item.item_id || item.id;
          if (type === 'product') {
            const pIdx = products.findIndex(p => p.id === itemId);
            if (pIdx !== -1) {
              products[pIdx].stock += 1;
            }
          }
          if (type === 'room') {
            const rIdx = rooms.findIndex(r => r.id === itemId);
            if (rIdx !== -1) {
              rooms[rIdx].status = 'disponible';
            }
          }
        });

        sales.splice(saleIdx, 1);
        saveTable('sales', sales);
        saveTable('products', products);
        saveTable('rooms', rooms);
      }
      return { success: true };
    }

    // 7. Expenses CRUD
    if (cleanUrl === '/expenses') {
      if (method === 'GET') {
        return getTable('expenses');
      }
      if (method === 'POST') {
        const { description, amount, type, auditedBy } = body;
        const expenses = getTable<any>('expenses');
        const newExpense = {
          id: Date.now(),
          organization_id: 1,
          description,
          amount: Number(amount),
          type,
          date: new Date().toISOString()
        };
        expenses.unshift(newExpense);
        saveTable('expenses', expenses);
        logLocalAudit(auditedBy, 'EXPENSE_ADD', { description, amount });
        return newExpense;
      }
    }
    if (cleanUrl.startsWith('/expenses/') && method === 'DELETE') {
      const id = Number(cleanUrl.split('/')[2]);
      const expenses = getTable<any>('expenses');
      const idx = expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        expenses.splice(idx, 1);
        saveTable('expenses', expenses);
      }
      return { success: true };
    }

    // 8. Settings CRUD
    if (cleanUrl === '/settings') {
      if (method === 'GET') {
        const settings = getTable<any>('settings');
        return settings.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});
      }
      if (method === 'PUT') {
        const auditedBy = body.auditedBy;
        const settingsToUpdate = { ...body };
        delete settingsToUpdate.auditedBy;

        const settings = getTable<any>('settings');
        for (const [key, value] of Object.entries(settingsToUpdate)) {
          const idx = settings.findIndex(s => s.setting_key === key);
          if (idx !== -1) {
            settings[idx].setting_value = String(value);
          } else {
            settings.push({ setting_key: key, setting_value: String(value) });
          }
        }
        saveTable('settings', settings);
        logLocalAudit(auditedBy, 'SETTINGS_UPDATE', { keys: Object.keys(settingsToUpdate) });
        return { success: true };
      }
    }

    // 9. Shifts Exceptions CRUD
    if (cleanUrl === '/shifts/exceptions') {
      if (method === 'GET') {
        return getTable('shift_exceptions');
      }
      if (method === 'POST') {
        const { exceptionDate, shiftType, originalUserId, substituteUserId, auditedBy } = body;
        const exceptions = getTable<any>('shift_exceptions');
        const newEx = {
          id: Date.now(),
          organization_id: 1,
          exception_date: exceptionDate,
          shift_type: shiftType,
          original_user_id: originalUserId,
          substitute_user_id: substituteUserId
        };
        exceptions.unshift(newEx);
        saveTable('shift_exceptions', exceptions);
        logLocalAudit(auditedBy, 'SHIFT_EXCEPTION_ADD', { exceptionDate, shiftType });
        return newEx;
      }
    }
    if (cleanUrl.startsWith('/shifts/exceptions/') && method === 'DELETE') {
      const id = Number(cleanUrl.split('/')[2]);
      const exceptions = getTable<any>('shift_exceptions');
      const idx = exceptions.findIndex(e => e.id === id);
      if (idx !== -1) {
        exceptions.splice(idx, 1);
        saveTable('shift_exceptions', exceptions);
      }
      return { success: true };
    }

    // 10. Room Logs, Audit Logs
    if (cleanUrl === '/room-logs' && method === 'GET') {
      return getTable('room_logs');
    }
    if (cleanUrl === '/audit-logs' && method === 'GET') {
      return getTable('audit_logs');
    }

    // 11. Onboarding
    if (cleanUrl === '/onboarding/seed-data' && method === 'POST') {
      const products = getTable<any>('products');
      const rooms = getTable<any>('rooms');
      
      products.push({ id: Date.now() + 1, organization_id: 1, name: 'Agua de Prueba', price: 50, stock: 100 });
      rooms.push({ id: Date.now() + 2, organization_id: 1, number: 'H-101', price: 1200, status: 'disponible' });
      
      saveTable('products', products);
      saveTable('rooms', rooms);
      return { success: true };
    }
    if (cleanUrl === '/onboarding/complete' && method === 'POST') {
      const users = getTable<any>('users');
      if (users[0]) {
        users[0].has_completed_onboarding = true;
        saveTable('users', users);
      }
      return { success: true };
    }

    throw new Error('Local Route Not Found: ' + cleanUrl);
  }
};
