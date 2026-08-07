import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plan } from '../types';
import { UsersIcon } from '../components/icons';
import UpgradeRequestModal from '../components/UpgradeRequestModal';

const PLAN_DETAILS: Record<Plan, { name: string; limit: (org?: any) => number; price?: string, features: string[] }> = {
  free: { name: 'Gratis', limit: () => 2, price: '$0/mes', features: ['Hasta 2 usuarios', 'Funcionalidades básicas'] },
  professional: { name: 'Profesional', limit: () => 10, price: '$30/mes', features: ['Hasta 10 usuarios', 'Métricas y Reportes', 'Registro de Auditoría', 'Soporte por correo'] },
  business: { name: 'Empresarial', limit: () => 50, price: '$100/mes', features: ['Hasta 50 usuarios', 'Métricas y Reportes', 'Registro de Auditoría', 'Soporte prioritario'] },
  corporate: { name: 'Corporativo', limit: (org) => org?.corporate_user_limit || 9999, price: 'Personalizado', features: ['Límite de usuarios a medida', 'Soporte dedicado', 'Funciones personalizadas'] },
};

const BillingView: React.FC = () => {
  const { currentUser, users } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const cooldownActive = useMemo(() => {
    if (!currentUser?.organization.plan_trial_cooldown_until) return false;
    return new Date(currentUser.organization.plan_trial_cooldown_until) > new Date();
  }, [currentUser?.organization.plan_trial_cooldown_until]);

  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  const { organization } = currentUser;
  const currentPlan = organization.plan;
  const userCount = users.length;
  const userLimit = PLAN_DETAILS[currentPlan].limit(organization);
  const usagePercentage = Math.min((userCount / userLimit) * 100, 100);
  const isTrial = organization.plan_upgrade_status === 'trial';

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const PlanCard = ({ plan, isCurrent }: { plan: Plan, isCurrent: boolean }) => {
    const details = PLAN_DETAILS[plan];
    const isPlanDisabled = isCurrent || (plan === 'free' && currentPlan !== 'free') || isTrial || cooldownActive;
    return (
      <div className={`border rounded-lg p-6 flex flex-col ${isCurrent ? 'border-sky-500 bg-sky-50' : 'bg-white'}`}>
        <h3 className="text-lg font-bold text-slate-800">{details.name}</h3>
        <p className="text-3xl font-extrabold text-slate-900 my-4">{details.price}</p>
        <ul className="space-y-2 text-sm text-slate-600 mb-6 flex-grow">
          {details.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => handleSelectPlan(plan)}
          disabled={isPlanDisabled}
          className="w-full mt-auto px-4 py-2 rounded-md font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}
        </button>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Facturación y Plan</h1>
      
      {isTrial && (
        <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Período de prueba activo</p>
          <p>Actualmente estás en un período de prueba de 30 días para el plan <span className="font-semibold">{PLAN_DETAILS[currentPlan].name}</span>. Un agente se pondrá en contacto contigo para finalizar la negociación.</p>
        </div>
      )}
      
      {cooldownActive && (
        <div className="mb-6 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
          <p className="font-bold">Período de enfriamiento activo</p>
          <p>Tu período de prueba anterior expiró. No puedes solicitar un nuevo plan de prueba hasta el <strong>{new Date(currentUser.organization.plan_trial_cooldown_until!).toLocaleDateString('es-DO')}</strong>.</p>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan & Usage */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Uso Actual</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-slate-800">
                  Plan Actual: <span className="text-sky-600">{PLAN_DETAILS[currentPlan].name}</span>
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                Organización: {organization.name}
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-slate-600 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2 text-slate-400"/>
                  Uso de Usuarios
                </h4>
                <span className="text-sm font-semibold text-slate-800">{userCount} / {userLimit}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-sky-500 h-2.5 rounded-full" 
                  style={{ width: `${usagePercentage}%` }}
                  aria-valuenow={usagePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            
            <div className="border-t pt-4">
                <p className="text-sm text-slate-600">
                    Para agregar más usuarios o acceder a nuevas funcionalidades, por favor actualiza tu plan.
                </p>
            </div>
          </div>
        </div>

        {/* Plan Options */}
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlanCard plan="professional" isCurrent={currentPlan === 'professional'} />
                <PlanCard plan="business" isCurrent={currentPlan === 'business'} />
            </div>
             <p className="text-center text-sm text-slate-500 mt-6">
                ¿Necesitas un plan más grande?{' '}
                <button onClick={() => handleSelectPlan('corporate')} disabled={isTrial || cooldownActive} className="text-sky-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                    Contacta con ventas
                </button>
                {' '}para nuestro plan Corporativo.
            </p>
        </div>
      </div>

      {isModalOpen && selectedPlan && (
        <UpgradeRequestModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            planToUpgrade={selectedPlan}
        />
      )}
    </>
  );
};

export default BillingView;