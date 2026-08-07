import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plan } from '../types';

interface UpgradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToUpgrade: Plan;
}

const UpgradeRequestModal: React.FC<UpgradeRequestModalProps> = ({ isOpen, onClose, planToUpgrade }) => {
  const { requestPlanUpgrade, currentUser } = useAppContext();
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
        await requestPlanUpgrade({
            requested_plan: planToUpgrade,
            contact_email: email,
            contact_phone: phone
        });
        alert('¡Solicitud enviada! Tu plan ha sido actualizado por un período de prueba de 30 días.');
        onClose();
    } catch(err: any) {
        setError(err.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Solicitar Plan <span className="capitalize text-sky-600">{planToUpgrade}</span>
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Tu plan se actualizará inmediatamente y tendrás <strong>30 días de prueba</strong>. Un agente se pondrá en contacto contigo usando la siguiente información para finalizar la negociación.
            </p>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700">Correo de Contacto</label>
                <input
                  type="email"
                  id="contact-email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700">Número de Teléfono</label>
                <input
                  type="tel"
                  id="contact-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  placeholder="Ej: (809) 555-1234"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-400" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Confirmar y Empezar Prueba'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpgradeRequestModal;
