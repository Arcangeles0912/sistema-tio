import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SalesView from '../views/SalesView';
import InventoryView from '../views/InventoryView';
import RoomsView from '../views/RoomsView';
import AnalyticsView from '../views/AnalyticsView';
import UsersView from '../views/UsersView';
import ConfigurationView from '../views/ConfigurationView';
import DashboardView from '../views/DashboardView'; // New import
import ShiftsView from '../views/ShiftsView'; // New import
import AuditView from '../views/AuditView'; // New import
import BillingView from '../views/BillingView'; // New import
import SuperAdminView from '../views/SuperAdminView'; // New import
import SuperAdminRequestsView from '../views/SuperAdminRequestsView'; // New import
import type { View, User } from '../types';
import { MenuIcon } from './icons';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const getDefaultViewForRole = (role: User['role']): View => {
  switch (role) {
    case 'ADMINISTRADOR':
      return 'DASHBOARD';
    case 'VENDEDOR':
      return 'SALES';
    case 'COORDINADOR':
      return 'SALES';
    case 'LIMPIADOR':
      return 'ROOMS';
    default:
      return 'DASHBOARD'; // Default for safety
  }
};

const viewTitles: Record<View, string> = {
    DASHBOARD: 'Resumen',
    SALES: 'Ventas',
    INVENTORY: 'Inventario',
    ROOMS: 'Habitaciones',
    SHIFTS: 'Gestión de Horarios',
    ANALYTICS: 'Métricas',
    USERS: 'Usuarios',
    BILLING: 'Facturación y Plan',
    SETTINGS: 'Configuración',
    AUDIT: 'Auditoría',
    SUPER_ADMIN: 'Organizaciones',
    SUPER_ADMIN_REQUESTS: 'Solicitudes de Plan',
};


const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // Hooks must be called at the top level, before any conditional returns.
  const [currentView, setCurrentView] = useState<View>(() =>
    // Initialize safely, in case the user prop is incomplete.
    user?.role ? getDefaultViewForRole(user.role) : 'SALES'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    // Also guard the effect for safety.
    if (user?.role) {
      setCurrentView(getDefaultViewForRole(user.role));
    }
  }, [user?.role]);

  // The safety guard now comes AFTER the hooks.
  if (!user || !user.role) {
    return null; // Or a loading spinner, or an error message
  }

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <DashboardView setCurrentView={setCurrentView} />;
      case 'SALES':
        return <SalesView />;
      case 'INVENTORY':
        return <InventoryView />;
      case 'ROOMS':
        return <RoomsView />;
      case 'SHIFTS':
        return <ShiftsView />;
      case 'ANALYTICS':
        return <AnalyticsView />;
      case 'USERS':
        return <UsersView setCurrentView={setCurrentView} />;
      case 'BILLING':
        return <BillingView />;
      case 'SETTINGS':
        return <ConfigurationView />;
      case 'AUDIT':
        return <AuditView />;
      case 'SUPER_ADMIN':
        return <SuperAdminView />;
      case 'SUPER_ADMIN_REQUESTS':
        return <SuperAdminRequestsView />;
      default:
        return <DashboardView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="relative min-h-screen md:flex bg-slate-100">
      <Sidebar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center bg-white p-4 border-b sticky top-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900"
            aria-label="Abrir menú"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">{viewTitles[currentView]}</h1>
          <div className="w-6"></div> {/* Spacer to balance the title */}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 md:px-6 py-8">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;