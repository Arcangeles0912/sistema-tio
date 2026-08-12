
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import type { Product, Room, Sale, SaleItem, User, Settings, Expense, RoomLog, RoomClearingStatus, ShiftException, AuditLog, SuperAdminOrganization, Plan, PlanUpgradeRequest, SuperAdminPlanUpgradeRequest } from '../types';
import { localDatabase } from '../utils/localDatabase';

// Helper for API calls
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const useRemote = localStorage.getItem('levelblack_use_remote') === 'true';
  if (!useRemote) {
    return localDatabase.handleRequest(url, options);
  }

  const isFormData = options.body instanceof FormData;
  const headersInit = { ...options.headers };

  if (!isFormData && !(headersInit as any)['Content-Type']) {
    (headersInit as any)['Content-Type'] = 'application/json';
  } else if (isFormData) {
    delete (headersInit as any)['Content-Type'];
  }

  const fetchOptions: RequestInit = { ...options, headers: headersInit };
  const response = await fetch(`/api${url}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error en la petición' }));
    throw new Error(errorData.message || 'Error del servidor');
  }
  if (response.status === 204) return null;
  return response.json();
};

interface RegisterData {
    organizationName: string;
    name: string;
    email: string;
    password: string;
}

interface AppContextType {
  products: Product[];
  rooms: Room[];
  sales: Sale[];
  expenses: Expense[];
  users: User[];
  settings: Settings;
  currentUser: User | null;
  isLoading: boolean;
  toast: string | null;
  roomLogs: RoomLog[];
  shiftExceptions: ShiftException[];
  auditLogs: AuditLog[];
  superAdminOrganizations: SuperAdminOrganization[];
  superAdminUpgradeRequests: SuperAdminPlanUpgradeRequest[];
  onboardingStatus: 'inactive' | 'pending' | 'complete';
  checkUserSession: () => Promise<void>;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; email?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean, message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean, message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  addSale: (items: SaleItem[]) => Promise<Sale>;
  addProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addRoom: (roomData: Omit<Room, 'id' | 'status'>) => Promise<void>;
  updateRoom: (room: Omit<Room, 'status'>) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
  clearRoom: (roomId: number, clearingStatus: RoomClearingStatus) => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'active_session_id' | 'organization' | 'is_active' | 'is_confirmed' | 'has_completed_onboarding'>) => Promise<void>;
  updateUser: (user: Omit<User, 'active_session_id' | 'organization' | 'is_active' | 'is_confirmed' | 'has_completed_onboarding'>) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  updateSettings: (settingsData: Record<string, any> | FormData, options?: { noReload?: boolean; message?: string }) => Promise<void>;
  deleteSale: (saleId: number) => Promise<void>;
  addExpense: (expenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  deleteExpense: (expenseId: number) => Promise<void>;
  addShiftException: (exceptionData: Omit<ShiftException, 'id' | 'exceptionDate'> & { exceptionDate: string }) => Promise<void>;
  deleteShiftException: (exceptionId: number) => Promise<void>;
  requestPlanUpgrade: (requestData: PlanUpgradeRequest) => Promise<void>;
  fetchSuperAdminData: () => Promise<void>;
  fetchSuperAdminUpgradeRequests: () => Promise<void>;
  approveUpgradeRequest: (requestId: number) => Promise<void>;
  updateOrganizationPlan: (orgId: number, plan: Plan, corporateUserLimit?: number) => Promise<void>;
  deleteOrganization: (orgId: number) => Promise<void>;
  superAdminResetUserPassword: (userId: number) => Promise<string>;
  seedSampleData: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  testEmail: (email: string) => Promise<{ success: boolean, message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Settings>({ logo_text: 'LevelBlack V2', address: '', rnc: '' });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [roomLogs, setRoomLogs] = useState<RoomLog[]>([]);
  const [shiftExceptions, setShiftExceptions] = useState<ShiftException[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [superAdminOrganizations, setSuperAdminOrganizations] = useState<SuperAdminOrganization[]>([]);
  const [superAdminUpgradeRequests, setSuperAdminUpgradeRequests] = useState<SuperAdminPlanUpgradeRequest[]>([]);
  const [onboardingStatus, setOnboardingStatus] = useState<'inactive' | 'pending' | 'complete'>('inactive');
  const sessionCheckInterval = useRef<number | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const fetchAllData = useCallback(async (user: User | null) => {
    if (!user || !user.id) return;
    const userIdParam = `?userId=${user.id}`;
    try {
        const fetchPromises = [
            apiFetch(`/products${userIdParam}`),
            apiFetch(`/rooms${userIdParam}`),
            apiFetch(`/users${userIdParam}`),
            apiFetch(`/sales${userIdParam}`),
            apiFetch(`/settings${userIdParam}`),
            apiFetch(`/expenses${userIdParam}`),
            apiFetch(`/shifts/exceptions${userIdParam}`),
            apiFetch(`/room-logs${userIdParam}`),
        ];
        
        if (user.role === 'ADMINISTRADOR' && user.active_session_id) {
            fetchPromises.push(apiFetch(`/audit-logs${userIdParam}&sessionId=${user.active_session_id}`));
        }

        const results = await Promise.all(fetchPromises);
        
        setProducts(results[0].map((p: Product) => ({ ...p, price: Number(p.price) })));
        setRooms(results[1].map((r: Room) => ({ ...r, price: Number(r.price) })));
        setUsers(results[2]);
        setSales(results[3].map((s: Sale) => ({
            ...s,
            total: Number(s.total),
            date: new Date(s.date),
            items: s.items?.map((item: any) => ({
                ...item,
                id: item.item_id || item.id,
                type: item.item_type || item.type,
                price: Number(item.price)
            })) || []
        })));
        setSettings(results[4]);
        setExpenses(results[5].map((e: Expense) => ({ ...e, amount: Number(e.amount), date: new Date(e.date) })));
        setShiftExceptions(results[6].map((e: ShiftException) => ({...e, exceptionDate: new Date(e.exceptionDate)})));
        setRoomLogs(results[7].map((log: RoomLog) => ({
            ...log,
            soldAt: new Date(log.soldAt),
            clearedAt: new Date(log.clearedAt),
        })));

        if (user.role === 'ADMINISTRADOR') {
            setAuditLogs(results[8]?.map((log: AuditLog) => ({...log, timestamp: new Date(log.timestamp)})) || []);
        }

    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    }
  }, []);
  
  const logout = useCallback(() => {
    if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current);
    if (ws.current) ws.current.close();
    sessionCheckInterval.current = null;
    ws.current = null;
    
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setProducts([]);
    setRooms([]);
    setUsers([]);
    setSales([]);
    setExpenses([]);
    setRoomLogs([]);
    setShiftExceptions([]);
    setAuditLogs([]);
    setSuperAdminOrganizations([]);
    setSuperAdminUpgradeRequests([]);
    setSettings({ logo_text: 'LevelBlack V2', address: '', rnc: '' });
  }, []);

  const checkUserSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id && user.role) {
          if (user.has_completed_onboarding === false) {
              setOnboardingStatus('pending');
          }
          setCurrentUser(user);
          await fetchAllData(user);
        } else {
          logout();
        }
      }
    } catch (error) {
      logout();
    } finally {
        setIsLoading(false);
    }
  }, [fetchAllData, logout]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const user = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      if (user.has_completed_onboarding === false) {
        setOnboardingStatus('pending');
      }
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      await fetchAllData(user);
      return { success: true };
    } catch (error: any) {
      logout();
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllData, logout]);

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message?: string; email?: string }> => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, message: response.message, email: response.email };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<{ success: boolean, message?: string }> => {
      try {
          const response = await apiFetch('/auth/resend-confirmation', {
              method: 'POST',
              body: JSON.stringify({ email })
          });
          return { success: true, message: response.message };
      } catch (error: any) {
          return { success: false, message: error.message };
      }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true, message: response.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      return { success: true, message: response.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, []);
  
  useEffect(() => {
    if (!currentUser?.active_session_id) {
        if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current);
        if (ws.current) ws.current.close();
        return;
    }

    // --- Session Check ---
    const checkSession = async () => {
      try {
        const { isValid } = await apiFetch('/auth/session-check', {
          method: 'POST',
          body: JSON.stringify({ userId: currentUser.id, sessionId: currentUser.active_session_id }),
        });
        if (!isValid) {
          alert('Tu sesión ha sido cerrada porque se ha iniciado sesión desde otro dispositivo.');
          logout();
        }
      } catch (error) { console.error('Fallo al verificar la sesión:', error); }
    };
    
    if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current);
    
    const useRemote = localStorage.getItem('levelblack_use_remote') === 'true';
    if (!useRemote) {
      return; // Skip WebSocket connection in local/offline mode
    }

    sessionCheckInterval.current = window.setInterval(checkSession, 30000);

    // --- WebSocket Connection ---
    if (ws.current) ws.current.close();
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?orgId=${currentUser.organization.id}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onclose = () => console.log('WebSocket disconnected');
    ws.current.onerror = (error) => console.error('WebSocket error:', error);
    
    ws.current.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification' && data.payload?.message) {
                setToast(data.payload.message);
                setTimeout(() => setToast(null), 4000);
            }
            if (data.type === 'data_changed' && data.payload?.resources) {
                const resources = data.payload.resources as string[];
                const userIdParam = `?userId=${currentUser.id}`;

                if (resources.includes('rooms')) {
                    apiFetch(`/rooms${userIdParam}`).then(roomsData => setRooms(roomsData.map((r: Room) => ({ ...r, price: Number(r.price) })))).catch(e => console.error("WS failed to fetch rooms:", e));
                }
                if (resources.includes('sales')) {
                    apiFetch(`/sales${userIdParam}`).then(salesData => setSales(salesData.map((s: Sale) => ({
                        ...s,
                        total: Number(s.total),
                        date: new Date(s.date),
                        items: s.items?.map((item: any) => ({
                            ...item,
                            id: item.item_id || item.id,
                            type: item.item_type || item.type,
                            price: Number(item.price)
                        })) || []
                    })))).catch(e => console.error("WS failed to fetch sales:", e));
                }
                if (resources.includes('products')) {
                    apiFetch(`/products${userIdParam}`).then(productsData => setProducts(productsData.map((p: Product) => ({ ...p, price: Number(p.price) })))).catch(e => console.error("WS failed to fetch products:", e));
                }
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    };

    return () => {
      if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current);
      if (ws.current) ws.current.close();
    };
  }, [currentUser, logout]);


  const addSale = useCallback(async (items: SaleItem[]): Promise<Sale> => {
    const newSale = await apiFetch('/sales', {
      method: 'POST',
      body: JSON.stringify({ items, userId: currentUser?.id }),
    });
    // Data will be refreshed via WebSocket, but we can optimistically update for immediate UI feedback.
    await fetchAllData(currentUser); 
    return newSale;
  }, [fetchAllData, currentUser]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    await apiFetch('/products', { method: 'POST', body: JSON.stringify({ ...productData, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    await apiFetch(`/products/${updatedProduct.id}`, { method: 'PUT', body: JSON.stringify({ ...updatedProduct, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);
  
  const addRoom = useCallback(async (roomData: Omit<Room, 'id' | 'status'>) => {
    await apiFetch('/rooms', { method: 'POST', body: JSON.stringify({ ...roomData, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);
  
  const updateRoom = useCallback(async (updatedRoom: Omit<Room, 'status'>) => {
    await apiFetch(`/rooms/${updatedRoom.id}`, { method: 'PUT', body: JSON.stringify({ ...updatedRoom, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);
  
  const deleteRoom = useCallback(async (roomId: number) => {
    await apiFetch(`/rooms/${roomId}`, { method: 'DELETE', body: JSON.stringify({ auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const clearRoom = useCallback(async (roomId: number, clearingStatus: RoomClearingStatus) => {
    try {
      await apiFetch(`/rooms/${roomId}/clear`, {
        method: 'POST',
        body: JSON.stringify({ clearingStatus, userId: currentUser?.id }),
      });
      await fetchAllData(currentUser);
    } catch (error: any) {
      alert(`Hubo un error al actualizar el estado de la habitación: ${error.message}`);
    }
  }, [fetchAllData, currentUser]);

  const addUser = useCallback(async (userData: Omit<User, 'id'| 'active_session_id' | 'organization' | 'is_active' | 'is_confirmed' | 'has_completed_onboarding'>) => {
    try {
        await apiFetch('/users', { method: 'POST', body: JSON.stringify({ ...userData, auditedBy: currentUser?.id }) });
        await fetchAllData(currentUser);
    } catch (error: any) {
        alert(error.message);
        throw error; // Re-throw to indicate failure
    }
  }, [fetchAllData, currentUser]);
  
  const updateUser = useCallback(async (updatedUser: Omit<User, 'active_session_id'|'organization' | 'is_active' | 'is_confirmed' | 'has_completed_onboarding'>) => {
    await apiFetch(`/users/${updatedUser.id}`, { method: 'PUT', body: JSON.stringify({ ...updatedUser, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const deleteUser = useCallback(async (userId: number) => {
    await apiFetch(`/users/${userId}`, { method: 'DELETE', body: JSON.stringify({ auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const updateSettings = useCallback(async (settingsData: Record<string, any> | FormData, options: { noReload?: boolean; message?: string } = {}) => {
      if (settingsData instanceof FormData) {
          settingsData.append('auditedBy', String(currentUser?.id));
          await apiFetch('/settings', { 
              method: 'PUT', 
              body: settingsData 
          });
      } else {
          const payload = { ...settingsData, auditedBy: currentUser?.id };
          await apiFetch('/settings', {
              method: 'PUT',
              body: JSON.stringify(payload)
          });
      }

      if (options.noReload) {
          alert(options.message || 'Configuración guardada.');
          await fetchAllData(currentUser);
      } else {
          alert('Configuración guardada. La página se recargará para aplicar los cambios.');
          window.location.reload();
      }
  }, [currentUser, fetchAllData]);

  const deleteSale = useCallback(async (saleId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción revertirá el stock y el estado de las habitaciones. No se puede deshacer.')) {
        await apiFetch(`/sales/${saleId}`, { method: 'DELETE', body: JSON.stringify({ auditedBy: currentUser?.id }) });
        // Data will be refreshed via WebSocket
    }
  }, [currentUser]);
  
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'date'>) => {
    await apiFetch('/expenses', { method: 'POST', body: JSON.stringify({ ...expenseData, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const deleteExpense = useCallback(async (expenseId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        await apiFetch(`/expenses/${expenseId}`, { method: 'DELETE', body: JSON.stringify({ auditedBy: currentUser?.id }) });
        await fetchAllData(currentUser);
    }
  }, [fetchAllData, currentUser]);

  const addShiftException = useCallback(async (exceptionData: Omit<ShiftException, 'id' | 'exceptionDate'> & { exceptionDate: string }) => {
    await apiFetch('/shifts/exceptions', { method: 'POST', body: JSON.stringify({ ...exceptionData, auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const deleteShiftException = useCallback(async (exceptionId: number) => {
    await apiFetch(`/shifts/exceptions/${exceptionId}`, { method: 'DELETE', body: JSON.stringify({ auditedBy: currentUser?.id }) });
    await fetchAllData(currentUser);
  }, [fetchAllData, currentUser]);

  const requestPlanUpgrade = useCallback(async (requestData: PlanUpgradeRequest) => {
    if (!currentUser) throw new Error("User not authenticated");
    await apiFetch('/organizations/upgrade-request', {
        method: 'POST',
        body: JSON.stringify({ ...requestData, userId: currentUser.id }),
    });
    // Refresh user to get new plan status
    await checkUserSession();
  }, [currentUser, checkUserSession]);

  // Super Admin Functions
  const fetchSuperAdminData = useCallback(async () => {
    if (currentUser?.isSuperAdmin) {
      try {
        const orgs = await apiFetch(`/super-admin/organizations?userId=${currentUser.id}`);
        setSuperAdminOrganizations(orgs);
      } catch (error) {
        console.error("Failed to fetch super admin data:", error);
      }
    }
  }, [currentUser]);

  const fetchSuperAdminUpgradeRequests = useCallback(async () => {
    if (currentUser?.isSuperAdmin) {
        try {
            const requests = await apiFetch(`/super-admin/upgrade-requests?userId=${currentUser.id}`);
            setSuperAdminUpgradeRequests(requests);
        } catch (error) {
            console.error("Failed to fetch upgrade requests:", error);
        }
    }
  }, [currentUser]);

  const approveUpgradeRequest = useCallback(async (requestId: number) => {
      if (currentUser?.isSuperAdmin) {
        try {
            await apiFetch(`/super-admin/upgrade-requests/${requestId}/approve`, {
                method: 'POST',
                body: JSON.stringify({ auditedBy: currentUser.id }),
            });
            await fetchSuperAdminUpgradeRequests();
            alert('Solicitud aprobada.');
        } catch (error: any) {
            alert(`Error al aprobar: ${error.message}`);
        }
      }
  }, [currentUser, fetchSuperAdminUpgradeRequests]);

  const updateOrganizationPlan = useCallback(async (orgId: number, plan: Plan, corporateUserLimit?: number) => {
    if (currentUser?.isSuperAdmin) {
        try {
            await apiFetch(`/super-admin/organizations/${orgId}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    plan, 
                    corporateUserLimit: corporateUserLimit,
                    auditedBy: currentUser.id 
                }),
            });
            await fetchSuperAdminData();
            alert('Plan actualizado correctamente.');
        } catch (error: any) {
            console.error("Failed to update organization plan:", error);
            alert(`Error: ${error.message}`);
        }
    }
  }, [currentUser, fetchSuperAdminData]);

  const deleteOrganization = useCallback(async (orgId: number) => {
    if (!currentUser?.isSuperAdmin) throw new Error("Not authorized");
    try {
        await apiFetch(`/super-admin/organizations/${orgId}`, {
            method: 'DELETE',
            body: JSON.stringify({ auditedBy: currentUser.id }),
        });
        await fetchSuperAdminData();
        alert('Organización eliminada exitosamente.');
    } catch (error: any) {
        console.error("Failed to delete organization:", error);
        alert(`Error al eliminar la organización: ${error.message}`);
    }
  }, [currentUser, fetchSuperAdminData]);

  const superAdminResetUserPassword = useCallback(async (userId: number): Promise<string> => {
    if (currentUser?.isSuperAdmin) {
        try {
            const response = await apiFetch(`/super-admin/users/${userId}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ auditedBy: currentUser.id }),
            });
            return response.newPassword;
        } catch (error: any) {
            console.error("Failed to reset password:", error);
            alert(`Error al reiniciar la contraseña: ${error.message}`);
            throw error;
        }
    }
    throw new Error('Not authorized');
  }, [currentUser]);

  const seedSampleData = useCallback(async () => {
    if (!currentUser) return;
    try {
      await apiFetch('/onboarding/seed-data', {
          method: 'POST',
          body: JSON.stringify({ auditedBy: currentUser.id }),
      });
      await fetchAllData(currentUser); // Refresh data
    } catch (error: any) {
      alert(`Error al agregar datos de prueba: ${error.message}`);
    }
  }, [currentUser, fetchAllData]);

  const completeOnboarding = useCallback(async () => {
      if (!currentUser) return;
      try {
        await apiFetch('/onboarding/complete', {
            method: 'POST',
            body: JSON.stringify({ auditedBy: currentUser.id }),
        });
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = { ...prevUser, has_completed_onboarding: true };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            return updatedUser;
        });
        setOnboardingStatus('complete');
      } catch (error: any) {
        alert(`Error al finalizar la introducción: ${error.message}`);
      }
  }, [currentUser]);

  const testEmail = useCallback(async (email: string): Promise<{ success: boolean, message: string }> => {
      if (!currentUser?.isSuperAdmin) throw new Error('Acción no permitida.');
      try {
          const response = await apiFetch('/super-admin/test-email', {
              method: 'POST',
              body: JSON.stringify({ email, auditedBy: currentUser.id })
          });
          return { success: true, message: response.message };
      } catch (error: any) {
          return { success: false, message: error.message };
      }
  }, [currentUser]);


  const value = { products, rooms, sales, expenses, users, settings, currentUser, isLoading, toast, roomLogs, shiftExceptions, auditLogs, superAdminOrganizations, superAdminUpgradeRequests, onboardingStatus, checkUserSession, login, register, resendConfirmation, logout, addSale, addProduct, updateProduct, addRoom, updateRoom, deleteRoom, clearRoom, addUser, updateUser, deleteUser, updateSettings, deleteSale, addExpense, deleteExpense, addShiftException, deleteShiftException, requestPlanUpgrade, fetchSuperAdminData, fetchSuperAdminUpgradeRequests, approveUpgradeRequest, updateOrganizationPlan, deleteOrganization, superAdminResetUserPassword, forgotPassword, resetPassword, seedSampleData, completeOnboarding, testEmail };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext debe ser usado dentro de un AppProvider');
  }
  return context;
};
