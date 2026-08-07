import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { ExpenseType } from '../types';

const EXPENSE_TYPES: ExpenseType[] = ['Servicios', 'Compra de Artículos', 'Pago a Empleados'];

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose }) => {
  const { addExpense } = useAppContext();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ExpenseType>('Servicios');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, introduce un monto válido.');
      return;
    }
    addExpense({ description, amount: parsedAmount, type });
    onClose();
    // Reset form for next time
    setDescription('');
    setAmount('');
    setType('Servicios');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Registrar Nuevo Gasto
            </h3>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descripción</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  autoFocus
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  placeholder="Ej: Pago de factura de luz"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Monto</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700">Tipo de Gasto</label>
                <select
                    id="type"
                    value={type}
                    onChange={e => setType(e.target.value as ExpenseType)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                >
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
              Agregar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseFormModal;