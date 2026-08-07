


import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { SuperAdminOrganization, Plan } from '../types';

const PLAN_OPTIONS: Plan[] = ['free', 'professional', 'business', 'corporate'];

const formatTimeSince = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `Hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `Hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval >= 1) return `Hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `Hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `Hace ${Math.floor(interval)} minutos`;
    return 'Recientemente';
};


const SuperAdminView: React.FC = () => {
  const { superAdminOrganizations, fetchSuperAdminData, updateOrganizationPlan, superAdminResetUserPassword, deleteOrganization } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  
  const [planChanges, setPlanChanges] = useState<Record<number, Plan>>({});
  const [limitChanges, setLimitChanges] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchSuperAdminData();
    setIsLoading(false);
  }, [fetchSuperAdminData]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    if (superAdminOrganizations.length > 0) {
        const plans: Record<number, Plan> = {};
        const limits: Record<number, string> = {};
        superAdminOrganizations.forEach(org => {
            plans[org.id] = org.plan;
            limits[org.id] = org.corporate_user_limit ? String(org.corporate_user_limit) : '';
        });
        setPlanChanges(plans);
        setLimitChanges(limits);
    }
  }, [superAdminOrganizations]);


  const handleSave = async (orgId: number) => {
    const newPlan = planChanges[orgId];
    const newLimit = parseInt(limitChanges[orgId], 10);

    await updateOrganizationPlan(orgId, newPlan, newPlan === 'corporate' ? newLimit : undefined);
  };
  
  const handleResetPassword = async (userId: number, userName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres reiniciar la contraseña para ${userName}? Se generará una nueva clave.`)) {
        try {
            const newPassword = await superAdminResetUserPassword(userId);
            alert(`La nueva contraseña para ${userName} es:\n\n${newPassword}\n\nPor favor, guárdala y compártela de forma segura.`);
        } catch (error) {
            // Error is already handled and alerted in context
        }
    }
  };
  
  const handleDelete = async (org: SuperAdminOrganization) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la organización "${org.name}"? Esta acción es irreversible y eliminará todos sus datos (usuarios, ventas, etc.).`)) {
        await deleteOrganization(org.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-600">Cargando datos de organizaciones...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Panel de Super Administrador</h1>
      <p className="text-slate-600 mb-6">Gestiona todas las organizaciones de la plataforma.</p>

      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Organización (ID)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Creador de la Cuenta</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Usuarios</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Último Acceso</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Límite Corporativo</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {superAdminOrganizations.map((org, index) => {
                const currentPlan = planChanges[org.id] || org.plan;
                const currentLimit = limitChanges[org.id] || '';
                const hasChanged = org.plan !== currentPlan || String(org.corporate_user_limit || '') !== currentLimit;

                return (
                    <tr key={org.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-5 py-4 text-sm text-slate-900">
                            <p className="font-semibold">{org.name}</p>
                            <p className="text-xs text-slate-500">ID: {org.id} / Registrado: {new Date(org.created_at).toLocaleDateString('es-DO')}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-900">
                           {org.creator_name ? (
                             <>
                                <p className="font-semibold">{org.creator_name}</p>
                                <p className="text-xs text-slate-500">{org.creator_email}</p>
                             </>
                           ) : (
                             <span className="text-xs text-slate-400">N/A</span>
                           )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-900 text-center">{org.user_count}</td>
                        <td className="px-5 py-4 text-sm text-slate-900">{formatTimeSince(org.last_login)}</td>
                        <td className="px-5 py-4 text-sm">
                        <select
                            value={currentPlan}
                            onChange={(e) => setPlanChanges(prev => ({...prev, [org.id]: e.target.value as Plan}))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        >
                            {PLAN_OPTIONS.map(plan => (
                            <option key={plan} value={plan}>
                                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </option>
                            ))}
                        </select>
                        </td>
                        <td className="px-5 py-4 text-sm">
                            <input 
                                type="number"
                                value={currentLimit}
                                onChange={(e) => setLimitChanges(prev => ({...prev, [org.id]: e.target.value}))}
                                disabled={currentPlan !== 'corporate'}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                placeholder={currentPlan === 'corporate' ? 'Definir límite' : 'N/A'}
                            />
                        </td>
                         <td className="px-5 py-4 text-sm whitespace-nowrap">
                            <button
                                onClick={() => handleSave(org.id)}
                                disabled={!hasChanged}
                                className="px-3 py-1.5 text-xs bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed mr-2"
                            >
                                Guardar
                            </button>
                             <button
                                onClick={() => handleResetPassword(org.creator_id, org.creator_name)}
                                disabled={!org.creator_id}
                                className="px-3 py-1.5 text-xs bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-300 disabled:cursor-not-allowed mr-2"
                            >
                                Reiniciar Clave
                            </button>
                             <button
                                onClick={() => handleDelete(org)}
                                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Eliminar
                            </button>
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SuperAdminView;