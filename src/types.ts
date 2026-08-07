

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export type RoomStatus = 'disponible' | 'no disponible';

export interface Room {
  id: number;
  number: string;
  price: number;
  status: RoomStatus;
}

export interface SaleItem {
  id: number;
  name: string;
  price: number;
  type: 'product' | 'room';
  plateNumber?: string;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  total: number;
  date: Date;
  user_name?: string;
}

export type Plan = 'free' | 'professional' | 'business' | 'corporate';
export type PlanStatus = 'active' | 'trial' | 'expired';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Organization {
  id: number;
  name: string;
  plan: Plan;
  corporate_user_limit?: number | null;
  plan_upgrade_status: PlanStatus;
  plan_trial_cooldown_until?: string | null;
}

export type UserRole = 'ADMINISTRADOR' | 'VENDEDOR' | 'LIMPIADOR' | 'COORDINADOR';

export type UserSchedule = 'Completo' | 'Mañana' | 'Tarde' | 'Noche' | 'Fuera de la empresa';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string; // In a real app, this would be a hash
  role: UserRole;
  schedule: UserSchedule;
  is_active: boolean;
  is_confirmed?: boolean;
  active_session_id?: string;
  organization: Organization;
  has_completed_onboarding: boolean;
  isSuperAdmin?: boolean;
}

export interface Settings {
  [key: string]: string | undefined;
  logo_text: string;
  address: string;
  rnc: string;
  shift_rotation_user_ids?: string; // JSON array of user IDs
  shift_rotation_start_date?: string; // YYYY-MM-DD
  cleaner_shift_rotation_user_ids?: string; // JSON array of user IDs
  cleaner_shift_rotation_start_date?: string; // YYYY-MM-DD
}

export type ExpenseType = 'Servicios' | 'Compra de Artículos' | 'Pago a Empleados';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  type: ExpenseType;
  date: Date;
}


export type View = 'DASHBOARD' | 'SALES' | 'INVENTORY' | 'ROOMS' | 'ANALYTICS' | 'USERS' | 'BILLING' | 'SETTINGS' | 'SHIFTS' | 'AUDIT' | 'SUPER_ADMIN' | 'SUPER_ADMIN_REQUESTS';

export type RoomClearingStatus = 'LISTA' | 'ARTICULO_OLVIDADO' | 'REPORTE_ROBO';

export interface RoomLog {
  id: number;
  roomId: number;
  roomNumber: string;
  soldAt: Date;
  soldByUserName?: string;
  clearedAt: Date;
  clearedByUserName: string;
  clearingStatus: RoomClearingStatus;
}

export type Shift = 'Mañana' | 'Tarde' | 'Noche';

export interface ShiftException {
  id: number;
  exceptionDate: Date;
  shiftType: Shift;
  originalUserId: number;
  substituteUserId: number;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  user_id: number;
  user_name: string;
  user_role: UserRole;
  action: string;
  details: Record<string, any>;
}

export interface SuperAdminOrganization {
  id: number;
  name: string;
  plan: Plan;
  created_at: string;
  user_count: number;
  corporate_user_limit?: number | null;
  creator_id: number;
  creator_name: string;
  creator_email: string;
  last_login: string | null;
}

export interface PlanUpgradeRequest {
  requested_plan: Plan;
  contact_email: string;
  contact_phone: string;
}

export interface SuperAdminPlanUpgradeRequest {
    id: number;
    requested_at: string;
    requested_plan: Plan;
    contact_email: string;
    contact_phone: string;
    status: RequestStatus;
    organization_id: number;
    organization_name: string;
}