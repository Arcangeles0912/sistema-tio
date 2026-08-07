import React, { useState, useEffect } from 'react';

interface PlateInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (plate: string, isAmanecida: boolean) => void;
  roomNumber?: string;
}

const PlateInputModal: React.FC<PlateInputModalProps> = ({ isOpen, onClose, onConfirm, roomNumber }) => {
  const [plate, setPlate] = useState('');
  const [isAmanecida, setIsAmanecida] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlate('');
      setIsAmanecida(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim()) {
      onConfirm(plate.trim(), isAmanecida);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Registrar Placa
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Por favor, introduce el número de placa para la Habitación <span className="font-bold">{roomNumber}</span>.
            </p>
            <div>
              <label htmlFor="plate" className="block text-sm font-medium text-slate-700">Número de Placa</label>
              <input
                type="text"
                id="plate"
                data-tour-id="plate-input"
                value={plate}
                onChange={e => setPlate(e.target.value)}
                required
                autoFocus
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="ABC-123"
              />
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  id="amanecida"
                  name="amanecida"
                  type="checkbox"
                  checked={isAmanecida}
                  onChange={(e) => setIsAmanecida(e.target.checked)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <label htmlFor="amanecida" className="ml-2 block text-sm text-slate-900">
                  Venta tipo Amanecida (+20%)
                </label>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" data-tour-id="plate-confirm-button" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
              Confirmar y Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlateInputModal;