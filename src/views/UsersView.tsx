import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { EditIcon, TrashIcon, PlusIcon } from '../components/icons';
import UserFormModal from '../components/UserFormModal';
import type { User, Shift, Plan, View } from '../types';
import { calculateWeeklySchedule, getDayKey, ScheduleUser } from '../utils';

const PLAN_LIMITS: Omit<Record<Plan, number>, 'corporate'> = {
  free: 2,
  professional: 10,
  business: 50,
};

interface UsersViewProps {
  setCurrentView: (view: View) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ setCurrentView }) => {
  const { users, currentUser, deleteUser, settings, shiftExceptions } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

  const organization = currentUser?.organization;
  const plan = organization?.plan || 'free';
  
  const userLimit = useMemo(() => {
    if (plan === 'corporate') {
        return organization?.corporate_user_limit || 9999;
    }
    return PLAN_LIMITS[plan] || 2;
  }, [plan, organization]);

  const userCount = users.length;
  const limitReached = userCount >= userLimit;

  const vendorSchedule = useMemo(() => 
    calculateWeeklySchedule(users, settings, shiftExceptions, new Date(), 'VENDEDOR'), 
    [users, settings, shiftExceptions]
  );
  const cleanerSchedule = useMemo(() => 
    calculateWeeklySchedule(users, settings, shiftExceptions, new Date(), 'LIMPIADOR'), 
    [users, settings, shiftExceptions]
  );

  const todayKey = useMemo(() => getDayKey(new Date()), []);
  const todayVendorSchedule = useMemo(() => vendorSchedule[todayKey], [vendorSchedule, todayKey]);
  const todayCleanerSchedule = useMemo(() => cleanerSchedule[todayKey], [cleanerSchedule, todayKey]);
  
  const vendorRotatingIds = useMemo(() => JSON.parse(settings.shift_rotation_user_ids || '[]'), [settings.shift_rotation_user_ids]);
  const cleanerRotatingIds = useMemo(() => JSON.parse(settings.cleaner_shift_rotation_user_ids || '[]'), [settings.cleaner_shift_rotation_user_ids]);

  const getUserCurrentShift = useCallback((user: User): Shift | null => {
      const schedule = user.role === 'VENDEDOR' ? todayVendorSchedule : todayCleanerSchedule;
      if (!schedule) return null;
      
      const shiftEntry = Object.entries(schedule).find(
        ([_shift, scheduleUser]) => (scheduleUser as ScheduleUser | null)?.id === user.id
      );
      return shiftEntry ? (shiftEntry[0] as Shift) : null;
  }, [todayVendorSchedule, todayCleanerSchedule]);


  const openAddModal = () => {
    setUserToEdit(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUserToEdit(undefined);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
        alert("No puedes eliminar al usuario actualmente autenticado.");
        return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.name}?`)) {
      deleteUser(user.id);
    }
  };


  return (
    <>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-700 bg-slate-200 px-3 py-1.5 rounded-md">
            <span>{userCount} / {userLimit} Usuarios</span>
          </div>
          <div className="relative group">
            <button
              onClick={openAddModal}
              disabled={limitReached}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar Usuario
            </button>
            {limitReached && (
                <div className="absolute bottom-full mb-2 right-0 w-max bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Límite de usuarios alcanzado. 
                    <button onClick={() => setCurrentView('BILLING')} className="underline hover:text-sky-300 ml-1 pointer-events-auto">Actualizar plan.</button>
                </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Correo Electrónico</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rol</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Horario</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const isRotating = user.role === 'VENDEDOR' 
                ? vendorRotatingIds.includes(user.id) 
                : user.role === 'LIMPIADOR' 
                  ? cleanerRotatingIds.includes(user.id)
                  : false;
                  
              const currentShift = isRotating ? getUserCurrentShift(user) : null;

              return (
              <tr key={user.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-sky-50`}>
                <td className="px-5 py-4 text-sm text-slate-900">{user.id}</td>
                <td className="px-5 py-4 text-sm text-slate-900">{user.name}</td>
                <td className="px-5 py-4 text-sm text-slate-900">{user.email}</td>
                <td className="px-5 py-4 text-sm text-slate-900">
                    <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${
                        user.role === 'ADMINISTRADOR' ? 'bg-red-200 text-red-900' :
                        user.role === 'VENDEDOR' ? 'bg-green-200 text-green-900' :
                        user.role === 'LIMPIADOR' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-blue-200 text-blue-900' // For COORDINADOR
                    }`}>
                        {user.role}
                    </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-900">
                  {isRotating && currentShift ? (
                    <>
                      {currentShift}
                      <span className="ml-2 text-xs text-sky-600 font-semibold">(Rotación)</span>
                    </>
                  ) : (
                    user.schedule
                  )}
                </td>
                <td className="px-5 py-4 text-sm">
                    <button 
                      onClick={() => openEditModal(user)} 
                      className="text-slate-500 p-1 hover:text-sky-600 rounded-full hover:bg-sky-100 transition-colors duration-200 mr-2"
                      aria-label="Editar usuario"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                     <button 
                      onClick={() => handleDeleteUser(user)} 
                      className="text-slate-500 p-1 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors duration-200"
                      aria-label="Eliminar usuario"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <UserFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        userToEdit={userToEdit}
      />
    </>
  );
};

export default UsersView;