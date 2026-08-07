import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sale } from '../types';
import { EyeIcon, TrashIcon } from '../components/icons';
import InvoiceModal from '../components/InvoiceModal';
import { formatCurrency } from '../utils';

const AuditView: React.FC = () => {
    const { auditLogs, sales, deleteSale, currentUser } = useAppContext();
    
    // State for Audit Logs
    const [filterUser, setFilterUser] = useState<string>('');
    const [filterAction, setFilterAction] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // State for Invoice History
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [saleToView, setSaleToView] = useState<Sale | null>(null);

    const isAdmin = currentUser?.role === 'ADMINISTRADOR';

    // Memoized calculations for Audit Logs
    const uniqueUsers = useMemo(() => {
        const userNames = auditLogs.map(log => log.user_name);
        return Array.from(new Set(userNames)).sort();
    }, [auditLogs]);

    const uniqueActions = useMemo(() => {
        const actions = auditLogs.map(log => log.action);
        return Array.from(new Set(actions)).sort();
    }, [auditLogs]);
    
    const filteredLogs = useMemo(() => {
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59.999') : null;

        return auditLogs.filter(log => {
            const userMatch = filterUser ? log.user_name === filterUser : true;
            const actionMatch = filterAction ? log.action === filterAction : true;
            if (!userMatch || !actionMatch) return false;

            const logDate = new Date(log.timestamp);

            if (start && logDate < start) return false;
            if (end && logDate > end) return false;
            
            return true;
        });
    }, [auditLogs, filterUser, filterAction, startDate, endDate]);
    
    // Reset page to 1 when filters or itemsPerPage change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterUser, filterAction, itemsPerPage, startDate, endDate]);

    // Calculate paginated logs and total pages
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredLogs, currentPage, itemsPerPage]);


    // Helpers and Memoized calculations for Invoice History
    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    const handleDateChange = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        setSelectedDate(newDate);
    }

    const filteredSalesByDay = useMemo(() => {
        return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getFullYear() === selectedDate.getFullYear() &&
                saleDate.getMonth() === selectedDate.getMonth() &&
                saleDate.getDate() === selectedDate.getDate();
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, selectedDate]);
    
    const PaginationControls = () => (
        <div className="flex justify-between items-center px-5 py-3 border-t border-slate-200">
            <div>
                <label htmlFor="items-per-page" className="text-sm text-slate-600 mr-2">Registros por página:</label>
                <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <span className="text-sm text-slate-600">
                    Página {totalPages > 0 ? currentPage : 0} de {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
    
    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Auditoría y Registros</h1>

            {/* --- Invoice History Section --- */}
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Historial de Facturas</h2>
                <div className="mb-4">
                    <label htmlFor="sale-date-picker" className="block text-sm font-medium text-slate-600 mb-1">
                        Seleccionar fecha
                    </label>
                    <input
                        type="date"
                        id="sale-date-picker"
                        value={formatDateForInput(selectedDate)}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    />
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {filteredSalesByDay.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No se encontraron ventas para esta fecha.</p>
                    ) : (
                        filteredSalesByDay.map(sale => (
                            <details key={sale.id} className="bg-slate-50 rounded-lg group">
                                <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
                                    <div>
                                        <span className="font-bold text-slate-800">Factura #{sale.id}</span>
                                        <span className="text-sm text-slate-500 ml-3">
                                        {new Date(sale.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-lg text-slate-800 mr-2">${formatCurrency(sale.total)}</span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); setSaleToView(sale); }}
                                            className="text-slate-500 p-2 hover:bg-sky-100 hover:text-sky-600 rounded-full transition-colors"
                                            aria-label="Ver factura"
                                        >
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                        {isAdmin && (
                                             <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    deleteSale(sale.id);
                                                }}
                                                className="text-slate-500 p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
                                                aria-label="Eliminar factura"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                        <span className="ml-2 transform transition-transform group-open:rotate-90 text-slate-500">▶</span>
                                    </div>
                                </summary>
                                <div className="border-t border-slate-200 px-4 pt-3 pb-4">
                                    <h4 className="font-semibold text-sm text-slate-600 mb-2">Artículos:</h4>
                                    <ul className="space-y-1 text-sm">
                                        {sale.items.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>
                                                {item.name}
                                                {item.plateNumber && <span className="text-xs text-slate-400 ml-1">(Placa: {item.plateNumber})</span>}
                                            </span>
                                            <span>${formatCurrency(item.price)}</span>
                                        </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        ))
                    )}
                </div>
            </div>

            {/* --- Audit Log Section --- */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Registro de Acciones</h2>
                <p className="text-slate-600 mb-6">Un historial de todas las acciones importantes realizadas en el sistema.</p>
                
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="user-filter" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Usuario</label>
                        <select
                            id="user-filter"
                            value={filterUser}
                            onChange={e => setFilterUser(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="">Todos los usuarios</option>
                            {uniqueUsers.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="action-filter" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Acción</label>
                        <select
                            id="action-filter"
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="">Todas las acciones</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start-date-filter" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
                        <input
                            type="date"
                            id="start-date-filter"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date-filter" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Fin</label>
                        <input
                            type="date"
                            id="end-date-filter"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            min={startDate}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="border-b-2 border-slate-200 bg-slate-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha y Hora</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Usuario</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rol</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acción</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLogs.map((log, index) => (
                                    <tr key={log.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-sky-50`}>
                                        <td className="px-5 py-4 text-sm text-slate-900 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString('es-DO')}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-900">{log.user_name}</td>
                                        <td className="px-5 py-4 text-sm text-slate-900">
                                        <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${
                                                log.user_role === 'ADMINISTRADOR' ? 'bg-red-200 text-red-900' :
                                                log.user_role === 'VENDEDOR' ? 'bg-green-200 text-green-900' :
                                                'bg-yellow-200 text-yellow-900'
                                            }`}>
                                                {log.user_role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-900 font-medium">{log.action}</td>
                                        <td className="px-5 py-4 text-sm text-slate-900">
                                            {log.details && Object.keys(log.details).length > 0 ? (
                                                <pre className="bg-slate-100 p-2 rounded text-xs font-mono max-w-sm overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            ) : (
                                                <span className="text-slate-400">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-500">
                                            No se encontraron registros con los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredLogs.length > 0 && <PaginationControls />}
                </div>
            </div>
            
            {saleToView && (
                <InvoiceModal
                isOpen={!!saleToView}
                onClose={() => setSaleToView(null)}
                sale={saleToView}
                />
            )}
        </>
    );
};

export default AuditView;
