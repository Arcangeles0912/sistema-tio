import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { View } from '../types';
import { SalesIcon, InventoryIcon, RoomsIcon } from '../components/icons';
import { formatCurrency } from '../utils';

interface DashboardViewProps {
  setCurrentView: (view: View) => void;
}

const DashboardHero = ({ userName }: { userName: string }) => (
  <div className="relative w-full h-48 md:h-64 bg-slate-900 rounded-2xl overflow-hidden mb-8 shadow-2xl flex items-center pl-6 md:pl-12">
    {/* Decorative Background - City Skyline */}
    <svg className="absolute bottom-0 right-0 w-3/4 h-full pointer-events-none opacity-40" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet">
        {/* Clouds */}
        <path d="M50 30 Q70 10 90 30 T130 30" stroke="white" strokeWidth="1" fill="none" className="animate-cloud" style={{ opacity: 0.2 }} />
        <path d="M280 20 Q300 0 320 20 T360 20" stroke="white" strokeWidth="1" fill="none" className="animate-cloud" style={{ animationDelay: '2s', opacity: 0.2 }} />

        {/* Buildings Back Layer */}
        <rect x="20" y="80" width="40" height="70" fill="#1e293b" />
        <rect x="80" y="60" width="50" height="90" fill="#1e293b" />
        <rect x="300" y="70" width="60" height="80" fill="#1e293b" />

        {/* Hotel Main Building */}
        <rect x="150" y="40" width="100" height="110" fill="#334155" stroke="#475569" strokeWidth="1" />
        {/* Roof */}
        <rect x="145" y="35" width="110" height="5" fill="#fbbf24" /> 
        
        {/* Windows (Animated) */}
        <rect x="160" y="50" width="10" height="15" className="animate-window-1" fill="#1e293b" />
        <rect x="180" y="50" width="10" height="15" className="animate-window-3" fill="#fbbf24" />
        <rect x="200" y="50" width="10" height="15" fill="#1e293b" />
        <rect x="220" y="50" width="10" height="15" className="animate-window-2" fill="#1e293b" />

        <rect x="160" y="75" width="10" height="15" fill="#1e293b" />
        <rect x="180" y="75" width="10" height="15" className="animate-window-4" fill="#fbbf24" />
        <rect x="200" y="75" width="10" height="15" className="animate-window-5" fill="#1e293b" />
        <rect x="220" y="75" width="10" height="15" fill="#fbbf24" />

        <rect x="160" y="100" width="10" height="15" className="animate-window-2" fill="#fbbf24" />
        <rect x="180" y="100" width="10" height="15" fill="#1e293b" />
        <rect x="200" y="100" width="10" height="15" className="animate-window-1" fill="#fbbf24" />
        <rect x="220" y="100" width="10" height="15" fill="#1e293b" />

        {/* Entrance Area */}
        <rect x="180" y="130" width="40" height="20" fill="#fbbf24" fillOpacity="0.8" />
        <circle cx="200" cy="140" r="2" fill="black" className="animate-pulse" />
    </svg>

    <div className="relative z-10 text-white animate-fade-in-down">
        <h2 className="text-sm font-medium text-amber-400 tracking-wider uppercase mb-1">Panel de Control</h2>
        <h1 className="text-3xl md:text-5xl font-bold mb-2">
            Hola, {userName}
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-md">
            Bienvenido al sistema de gestión hotelera LevelBlack. Aquí tienes el resumen de operaciones de hoy.
        </p>
    </div>
  </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentView }) => {
  const { sales, rooms, expenses, currentUser } = useAppContext();

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter(sale => new Date(sale.date) >= today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    const todayExpenses = expenses
      .filter(expense => new Date(expense.date) >= today)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const netCashFlow = todayRevenue - todayExpenses;
    
    const availableRooms = rooms.filter(room => room.status === 'disponible').length;
    const recentSales = sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    return {
      todayRevenue,
      todayExpenses,
      netCashFlow,
      availableRooms,
      recentSales,
      todaySalesCount: todaySales.length
    };
  }, [sales, rooms, expenses]);

  const MetricCard = ({ title, value, subtext, colorClass = 'text-slate-900', delay = '0s' }: { title: string; value: string | number; subtext: string; colorClass?: string; delay?: string }) => (
    <div 
        className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-slate-200 hover:border-amber-400 transition-all duration-300 animate-fade-in-down"
        style={{ animationDelay: delay }}
    >
      <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide truncate mb-2">{title}</dt>
      <dd className={`text-3xl font-extrabold tracking-tight ${colorClass}`}>{value}</dd>
      <p className="text-sm text-slate-500 mt-1">{subtext}</p>
    </div>
  );
  
  const ActionButton = ({ title, icon, onClick, delay = '0s' }: { title: string; icon: React.ReactNode; onClick: () => void; delay?: string }) => (
    <button
      onClick={onClick}
      style={{ animationDelay: delay }}
      className="group flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-slate-600 hover:text-sky-600 animate-fade-in-down"
    >
      <div className="p-3 bg-slate-50 rounded-full group-hover:bg-sky-50 transition-colors mb-3">
        {icon}
      </div>
      <span className="text-sm font-bold">{title}</span>
    </button>
  );

  return (
    <div className="pb-8">
      {/* Hero Banner */}
      <DashboardHero userName={currentUser?.name.split(' ')[0] || 'Usuario'} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard 
            title="Ingresos de Hoy" 
            value={`$${formatCurrency(metrics.todayRevenue)}`} 
            subtext={`${metrics.todaySalesCount} ventas realizadas`} 
            colorClass="text-emerald-600" 
            delay="0.1s"
        />
        <MetricCard 
            title="Gastos de Hoy" 
            value={`$${formatCurrency(metrics.todayExpenses)}`} 
            subtext="Operaciones y servicios" 
            colorClass="text-rose-600" 
            delay="0.2s"
        />
        <MetricCard 
            title="Flujo de Caja Neto" 
            value={`$${formatCurrency(metrics.netCashFlow)}`} 
            subtext="Balance final estimado" 
            colorClass={metrics.netCashFlow >= 0 ? 'text-sky-600' : 'text-amber-500'} 
            delay="0.3s"
        />
        <MetricCard 
            title="Habitaciones Disponibles" 
            value={metrics.availableRooms} 
            subtext={`de ${rooms.length} totales`} 
            delay="0.4s"
        />
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
         <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-1 h-6 bg-amber-400 rounded mr-3"></span>
            Acciones Rápidas
         </h2>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ActionButton 
                title="Nueva Venta" 
                icon={<SalesIcon className="h-8 w-8 text-sky-500 group-hover:text-sky-600"/>} 
                onClick={() => setCurrentView('SALES')} 
                delay="0.5s"
            />
            <ActionButton 
                title="Inventario" 
                icon={<InventoryIcon className="h-8 w-8 text-indigo-500 group-hover:text-indigo-600"/>} 
                onClick={() => setCurrentView('INVENTORY')} 
                delay="0.6s"
            />
            <ActionButton 
                title="Habitaciones" 
                icon={<RoomsIcon className="h-8 w-8 text-emerald-500 group-hover:text-emerald-600"/>} 
                onClick={() => setCurrentView('ROOMS')} 
                delay="0.7s"
            />
         </div>
      </div>
      
      {/* Recent Sales */}
      <div className="animate-fade-in-down" style={{ animationDelay: '0.8s' }}>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="w-1 h-6 bg-slate-300 rounded mr-3"></span>
            Ventas Recientes
        </h2>
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-100">
          <ul className="divide-y divide-slate-100">
            {metrics.recentSales.length > 0 ? metrics.recentSales.map((sale, idx) => (
              <li key={sale.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        #{idx + 1}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Factura #{sale.id}</p>
                        <p className="text-xs text-slate-500 font-medium">
                            {new Date(sale.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} • {sale.user_name || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                    ${formatCurrency(sale.total)}
                </div>
              </li>
            )) : (
              <li className="p-8 text-center text-slate-500">No hay registros de ventas recientes hoy.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;