import React from 'react';
import type { RoomClearingStatus } from '../types';

interface RoomClearingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: RoomClearingStatus) => void;
}

const RoomClearingModal: React.FC<RoomClearingModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = (status: RoomClearingStatus) => {
    onConfirm(status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Estado de la Habitación
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Selecciona el estado en que se entrega la habitación para marcarla como disponible.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => handleConfirm('LISTA')}
              className="w-full text-left p-4 border rounded-lg hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <h4 className="font-bold text-green-800">1 - Habitación Lista</h4>
              <p className="text-sm text-slate-600">Todo en orden, lista para el siguiente cliente.</p>
            </button>
            <button
              onClick={() => handleConfirm('ARTICULO_OLVIDADO')}
              className="w-full text-left p-4 border rounded-lg hover:bg-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <h4 className="font-bold text-yellow-800">2 - Artículo Olvidado</h4>
              <p className="text-sm text-slate-600">Se encontró un objeto personal del cliente.</p>
            </button>
            <button
              onClick={() => handleConfirm('REPORTE_ROBO')}
              className="w-full text-left p-4 border rounded-lg hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <h4 className="font-bold text-red-800">3 - Reporte de Robo</h4>
              <p className="text-sm text-slate-600">Falta algún artículo de la habitación.</p>
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomClearingModal;