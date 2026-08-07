import React from 'react';
import { SalesIcon, InventoryIcon, RoomsIcon, AnalyticsIcon, LogoutIcon, UsersIcon, SettingsIcon, CloseIcon, HomeIcon, ShiftsIcon, AuditIcon, BillingIcon, SuperAdminIcon, RequestsIcon } from './icons';
import type { View, User } from '../types';

interface SidebarProps {
  user: User;
  currentView: View;
  setCurrentView: (view: View) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const ALL_NAV_ITEMS: { view: View; label: string; icon: React.ReactNode; roles: User['role'][] }[] = [
    { view: 'DASHBOARD', label: 'Resumen', icon: <HomeIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR'] },
    { view: 'SALES', label: 'Ventas', icon: <SalesIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'COORDINADOR'] },
    { view: 'INVENTORY', label: 'Inventario', icon: <InventoryIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'COORDINADOR'] },
    { view: 'ROOMS', label: 'Habitaciones', icon: <RoomsIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR', 'LIMPIADOR', 'VENDEDOR', 'COORDINADOR'] },
    { view: 'SHIFTS', label: 'Horarios', icon: <ShiftsIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR', 'VENDEDOR', 'LIMPIADOR', 'COORDINADOR'] },
    { view: 'ANALYTICS', label: 'Métricas', icon: <AnalyticsIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR'] },
    { view: 'USERS', label: 'Usuarios', icon: <UsersIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR'] },
    { view: 'BILLING', label: 'Planes', icon: <BillingIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR'] },
    { view: 'AUDIT', label: 'Auditoría', icon: <AuditIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR'] },
    { view: 'SETTINGS', label: 'Configuración', icon: <SettingsIcon className="h-5 w-5" />, roles: ['ADMINISTRADOR'] },
];

export default function Sidebar({ user, currentView, setCurrentView, onLogout, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.roles.includes(user.role)) return false;
    if (user.organization.plan === 'free' && (item.view === 'ANALYTICS' || item.view === 'AUDIT')) return false;
    return true;
  });

  const baseClass = "relative w-full flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 group";
  
  // Elegant style: Dark text base, Gold hover text, Gradient background for active
  const inactiveClass = "text-slate-400 hover:text-amber-400 hover:bg-slate-800/50";
  const activeClass = "text-white bg-gradient-to-r from-sky-600 to-blue-700 shadow-md";

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-30 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <div
        className={`flex flex-col w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-out md:relative md:translate-x-0 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 border-r border-slate-800 shadow-2xl ${isSidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        <div className="flex flex-col items-center justify-center h-24 border-b border-slate-800 px-6 relative">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                LevelBlack <span className="font-light opacity-70">V2</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest text-[10px]">Hotel Management</p>
             <button
                className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Cerrar menú"
            >
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-1">
          {user.isSuperAdmin && (
            <div className="mb-6 px-4">
                <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Super Admin</p>
                <button
                    key="SUPER_ADMIN"
                    onClick={() => handleNavClick('SUPER_ADMIN')}
                    className={`rounded-lg ${baseClass} ${currentView === 'SUPER_ADMIN' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : inactiveClass}`}
                >
                    <SuperAdminIcon className="h-5 w-5 mr-3" />
                    Organizaciones
                </button>
                <button
                    key="SUPER_ADMIN_REQUESTS"
                    onClick={() => handleNavClick('SUPER_ADMIN_REQUESTS')}
                    className={`rounded-lg mt-1 ${baseClass} ${currentView === 'SUPER_ADMIN_REQUESTS' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : inactiveClass}`}
                >
                    <RequestsIcon className="h-5 w-5 mr-3" />
                    Solicitudes
                </button>
            </div>
          )}

          <div className="px-4">
             <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Menú Principal</p>
             {navItems.map(item => (
                <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                data-tour-id={`sidebar-${item.view.toLowerCase()}`}
                className={`rounded-lg mb-1 ${baseClass} ${currentView === item.view ? activeClass : inactiveClass}`}
                >
                {/* Active Indicator Line */}
                {currentView === item.view && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-6 w-1 bg-amber-400 rounded-r-md"></div>}
                <span className={`mr-3 ${currentView === item.view ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">{user.role.toLowerCase()}</p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md transition-colors border border-slate-700"
            >
                <LogoutIcon className="h-4 w-4 mr-2" />
                Cerrar Sesión
            </button>
            <div className="text-center mt-3 text-xs text-slate-400 font-mono font-bold bg-slate-950/60 py-1.5 rounded border border-slate-800 shadow-inner">
                v{process.env.REACT_APP_VERSION}
            </div>
        </div>
      </div>
    </>
  );
};