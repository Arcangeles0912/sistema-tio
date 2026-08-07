import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EditIcon, TrashIcon, PlusIcon, HistoryIcon, RoomsIcon } from '../components/icons';
import RoomFormModal from '../components/RoomFormModal';
import RoomClearingModal from '../components/RoomClearingModal';
import RoomLogHistory from '../components/RoomLogHistory';
import RoomTimer from '../components/RoomTimer';
import type { Room, RoomClearingStatus } from '../types';
import { formatCurrency } from '../utils';

const RoomsView: React.FC = () => {
  const { rooms, clearRoom, deleteRoom, currentUser, roomLogs, sales } = useAppContext();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | undefined>(undefined);
  
  const [isClearingModalOpen, setIsClearingModalOpen] = useState(false);
  const [roomToClear, setRoomToClear] = useState<Room | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const canClearRooms = useMemo(() => {
    if (!currentUser) return false;
    return ['ADMINISTRADOR', 'LIMPIADOR', 'COORDINADOR'].includes(currentUser.role);
  }, [currentUser]);


  const occupiedRoomSaleDates = useMemo(() => {
    const dateMap = new Map<number, Date>();
    if (!sales || sales.length === 0) return dateMap;

    const occupiedRooms = rooms.filter(r => r.status === 'no disponible');
    
    // The sales from API are already sorted by date descending. We can rely on that.
    occupiedRooms.forEach(room => {
        const saleForRoom = sales.find(s => 
            s.items.some(i => i.type === 'room' && i.id === room.id)
        );
        if (saleForRoom) {
            dateMap.set(room.id, new Date(saleForRoom.date));
        }
    });

    return dateMap;
  }, [rooms, sales]);


  const openAddModal = () => {
    setRoomToEdit(undefined);
    setIsFormModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setRoomToEdit(room);
    setIsFormModalOpen(true);
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'no disponible' && canClearRooms) {
      setRoomToClear(room);
      setIsClearingModalOpen(true);
    }
    // If room is 'disponible' or user lacks permissions, do nothing on click.
  };

  const handleConfirmClearing = (status: RoomClearingStatus) => {
    if (roomToClear) {
      clearRoom(roomToClear.id, status);
    }
    setIsClearingModalOpen(false);
    setRoomToClear(null);
  };

  const handleDeleteRoom = (roomId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta habitación? Esta acción no se puede deshacer.')) {
      deleteRoom(roomId);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {showHistory ? 'Registro de Habitaciones' : 'Gestión de Habitaciones'}
        </h1>
        <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                {showHistory ? <RoomsIcon className="h-5 w-5" /> : <HistoryIcon className="h-5 w-5" />}
                <span className="max-sm:hidden">{showHistory ? 'Ver Habitaciones' : 'Ver Registro'}</span>
              </button>
            )}
            {isAdmin && !showHistory && (
                <button
                onClick={openAddModal}
                data-tour-id="add-room-button"
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                <PlusIcon className="h-5 w-5" />
                <span className="max-sm:hidden">Agregar</span>
                </button>
            )}
        </div>
      </div>

      {showHistory ? (
        <RoomLogHistory logs={roomLogs} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rooms.map(room => {
            const lastSaleDate = occupiedRoomSaleDates.get(room.id);
            const isOccupied = room.status === 'no disponible';
            const canBeClearedByUser = isOccupied && canClearRooms;

            return (
            <div
              key={room.id}
              className={`relative group p-4 md:p-6 rounded-lg shadow-sm text-white transition-all ${
                isOccupied
                  ? `bg-slate-500 ${canBeClearedByUser ? 'cursor-pointer hover:bg-slate-600' : ''}`
                  : 'bg-teal-500'
              }`}
              onClick={canBeClearedByUser ? () => handleRoomClick(room) : undefined}
            >
              {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(room); }}
                      className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full"
                      aria-label="Editar habitación"
                  >
                      <EditIcon className="h-4 w-4 text-white" />
                  </button>
                  <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                      className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full"
                      aria-label="Eliminar habitación"
                  >
                      <TrashIcon className="h-4 w-4 text-white" />
                  </button>
                  </div>
              )}
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{room.number}</h3>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    room.status === 'disponible' ? 'bg-white/25' : 'bg-black/20'
                  }`}>
                    {room.status === 'disponible' ? 'Disponible' : 'No Disponible'}
                  </span>
                   {room.status === 'no disponible' && lastSaleDate && (
                      <RoomTimer soldAt={lastSaleDate} />
                    )}
                </div>
              </div>
              <p className="mt-4 text-2xl font-light">${formatCurrency(room.price)}</p>
            </div>
          )})}
        </div>
      )}

      {isAdmin && (
        <RoomFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          roomToEdit={roomToEdit}
        />
      )}
      <RoomClearingModal
        isOpen={isClearingModalOpen}
        onClose={() => {
          setIsClearingModalOpen(false);
          setRoomToClear(null);
        }}
        onConfirm={handleConfirmClearing}
      />
    </>
  );
};

export default RoomsView;