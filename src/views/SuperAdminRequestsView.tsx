import React, { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

const SuperAdminRequestsView: React.FC = () => {
    const { 
        superAdminUpgradeRequests, 
        fetchSuperAdminUpgradeRequests, 
        approveUpgradeRequest 
    } = useAppContext();

    const loadRequests = useCallback(async () => {
        await fetchSuperAdminUpgradeRequests();
    }, [fetchSuperAdminUpgradeRequests]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleApprove = async (requestId: number) => {
        if (window.confirm('¿Estás seguro de que quieres aprobar esta solicitud? El cambio de plan será permanente.')) {
            await approveUpgradeRequest(requestId);
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Solicitudes de Actualización de Plan</h1>
            <p className="text-slate-600 mb-6">Gestiona las solicitudes pendientes de los clientes.</p>

            <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-100">
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Organización</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacto</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan Solicitado</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha de Solicitud</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {superAdminUpgradeRequests.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="text-center py-10 text-slate-500">
                                    No hay solicitudes de actualización pendientes.
                                </td>
                            </tr>
                        ) : (
                            superAdminUpgradeRequests.map((req, index) => (
                                <tr key={req.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <td className="px-5 py-4 text-sm text-slate-900">
                                        <p className="font-semibold">{req.organization_name}</p>
                                        <p className="text-xs text-slate-500">ID: {req.organization_id}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-900">
                                        <p>{req.contact_email}</p>
                                        <p className="text-xs text-slate-500">{req.contact_phone}</p>
                                    </td>
                                     <td className="px-5 py-4 text-sm">
                                        <span className="capitalize font-semibold bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs">
                                            {req.requested_plan}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-900">
                                        {new Date(req.requested_at).toLocaleString('es-DO')}
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <button
                                            onClick={() => handleApprove(req.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            Aprobar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default SuperAdminRequestsView;
