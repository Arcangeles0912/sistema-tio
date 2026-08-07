import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Room } from '../types';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: Room;
}

const RoomFormModal: React.FC<RoomFormModalProps> = ({ isOpen, onClose, roomToEdit }) => {
  const { addRoom, updateRoom } = useAppContext();
  const [number, setNumber] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (roomToEdit) {
            setNumber(roomToEdit.number);
            setPrice(roomToEdit.price.toString());
        } else {
            setNumber('');
            setPrice('');
        }
    }
  }, [roomToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomData = {
      number,
      price: parseFloat(price) || 0,
    };

    if (roomToEdit) {
      updateRoom({ ...roomData, id: roomToEdit.id });
    } else {
      addRoom(roomData);
    }
    onClose();
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
              {roomToEdit ? 'Editar Habitación' : 'Agregar Nueva Habitación'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-slate-700">Número de Habitación</label>
                <input
                  type="text"
                  id="number"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  required
                  data-tour-id="room-number-input"
                  placeholder="Ej: H-101"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700">Precio por noche</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  data-tour-id="room-price-input"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" data-tour-id="save-room-button" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;