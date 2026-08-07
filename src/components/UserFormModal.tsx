import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { User, UserRole, UserSchedule } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User;
}

const ROLES: UserRole[] = ['ADMINISTRADOR', 'VENDEDOR', 'LIMPIADOR', 'COORDINADOR'];
const SCHEDULES: UserSchedule[] = ['Completo', 'Mañana', 'Tarde', 'Noche', 'Fuera de la empresa'];

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, userToEdit }) => {
  const { addUser, updateUser } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [schedule, setSchedule] = useState<UserSchedule>('Completo');

  const showScheduleField = role === 'ADMINISTRADOR' || role === 'COORDINADOR';

  useEffect(() => {
    if (isOpen) {
        if (userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email);
            setRole(userToEdit.role);
            setSchedule(userToEdit.schedule);
            setPassword(''); // Clear password field for editing
        } else {
            setName('');
            setEmail('');
            setPassword('');
            setRole('VENDEDOR');
            setSchedule('Completo');
        }
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userToEdit) {
        // Fix: The object being created now matches the expected type for the `updateUser` function.
        // The previous type annotation and inclusion of `is_active` were incorrect, causing the type error.
        const userData = {
            id: userToEdit.id,
            name,
            email,
            role,
            schedule: showScheduleField ? schedule : userToEdit.schedule,
            password: password,
        };
      updateUser(userData);
    } else {
        if (!password) {
            alert('La contraseña es obligatoria para nuevos usuarios.');
            return;
        }
        const userData = {
            name,
            email,
            password,
            role,
            schedule: showScheduleField ? schedule : 'Completo', // Default schedule if field is hidden
        };
        addUser(userData);
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
              {userToEdit ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
               <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required={!userToEdit}
                  placeholder={userToEdit ? 'Dejar en blanco para no cambiar' : ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">Rol</label>
                <select
                    id="role"
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              {showScheduleField && (
                  <div>
                    <label htmlFor="schedule" className="block text-sm font-medium text-slate-700">Horario de Trabajo Fijo</label>
                    <select
                        id="schedule"
                        value={schedule}
                        onChange={e => setSchedule(e.target.value as UserSchedule)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                    >
                        {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Este horario se usa si el usuario no está en un equipo de rotación.</p>
                  </div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 rounded-b-lg flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;