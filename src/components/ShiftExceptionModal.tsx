import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { User, Shift } from '../types';

interface ShiftExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exceptionInfo: {
    date: Date;
    shift: Shift;
    originalUser: User;
  } | null;
}

const ShiftExceptionModal: React.FC<ShiftExceptionModalProps> = ({ isOpen, onClose, exceptionInfo }) => {
  const { users, addShiftException } = useAppContext();
  const [substituteUserId, setSubstituteUserId] = useState<string>('');
  
  const availableSubstitutes = useMemo(() => {
    if (!exceptionInfo) return [];
    return users.filter(u => u.role === exceptionInfo.originalUser.role && u.id !== exceptionInfo.originalUser.id);
  }, [users, exceptionInfo]);

  useEffect(() => {
    if (isOpen) {
      if (availableSubstitutes.length > 0) {
        setSubstituteUserId(availableSubstitutes[0].id.toString());
      } else {
        setSubstituteUserId('');
      }
    }
  }, [isOpen, availableSubstitutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!substituteUserId || !exceptionInfo) {
      alert("Por favor, selecciona un sustituto.");
      return;
    }

    try {
        await addShiftException({
            exceptionDate: exceptionInfo.date.toISOString().split('T')[0],
            shiftType: exceptionInfo.shift,
            originalUserId: exceptionInfo.originalUser.id,
            substituteUserId: parseInt(substituteUserId, 10),
        });
        onClose();
    } catch(error: any) {
        alert(`Error: ${error.message}`);
    }
  };

  if (!isOpen || !exceptionInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Crear Sustitución
            </h3>
            <div className="text-sm text-slate-600 mb-4 bg-slate-100 p-3 rounded-md">
                <p><strong>Fecha:</strong> {exceptionInfo.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p><strong>Turno:</strong> {exceptionInfo.shift}</p>
                <p><strong>Empleado Original:</strong> {exceptionInfo.originalUser.name} ({exceptionInfo.originalUser.role})</p>
            </div>
            
            <div>
              <label htmlFor="substitute" className="block text-sm font-medium text-slate-700">Seleccionar Sustituto</label>
              <select
                id="substitute"
                value={substituteUserId}
                onChange={e => setSubstituteUserId(e.target.value)}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md disabled:bg-slate-100"
                disabled={availableSubstitutes.length === 0}
              >
                {availableSubstitutes.length > 0 ? (
                  <>
                    <option value="" disabled>-- Elige un {exceptionInfo.originalUser.role.toLowerCase()} --</option>
                    {availableSubstitutes.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">No hay sustitutos disponibles</option>
                )}
              </select>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-400" disabled={!substituteUserId}>
              Confirmar Sustitución
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftExceptionModal;