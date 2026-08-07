import React, { useState, useMemo, useEffect, FC } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateWeeklySchedule, WeeklySchedule, ScheduleUser } from '../utils';
import type { User, Shift, UserRole } from '../types';
import ShiftExceptionModal from '../components/ShiftExceptionModal';
import { TrashIcon } from '../components/icons';

// --- Admin Components ---

interface RotationConfigProps {
    title: string;
    role: UserRole;
    users: User[];
    rotatingUserIds: number[];
    setRotatingUserIds: React.Dispatch<React.SetStateAction<number[]>>;
    onSave: () => void;
}

const RotationConfig: FC<RotationConfigProps> = ({ title, role, users, rotatingUserIds, setRotatingUserIds, onSave }) => {
    const availableUsers = useMemo(() => users.filter(u => u.role === role), [users, role]);

    const handleUserChange = (index: number, userId: string) => {
        const newIds = [...rotatingUserIds];
        const intUserId = parseInt(userId, 10);

        if (newIds.some(id => id === intUserId)) {
            alert("Este empleado ya está asignado a otra posición en la rotación.");
            return;
        }
        newIds[index] = intUserId;
        setRotatingUserIds(newIds);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {[0, 1, 2].map(index => (
                    <div key={index}>
                        <label htmlFor={`rot-user-${role}-${index}`} className="block text-sm font-medium text-slate-600 mb-1">
                            Posición de Rotación {index + 1}
                        </label>
                        <select
                            id={`rot-user-${role}-${index}`}
                            value={rotatingUserIds[index] || ''}
                            onChange={e => handleUserChange(index, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="" disabled>Seleccionar empleado</option>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                <button
                    onClick={onSave}
                    className="w-full md:w-auto px-6 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                    Guardar
                </button>
            </div>
        </div>
    );
};

const ScheduleTable: FC<{
    title: string;
    schedule: WeeklySchedule;
    role: UserRole;
    onOpenModal: (date: Date, shift: Shift, user: User) => void;
}> = ({ title, schedule, role, onOpenModal }) => {
    const { shiftExceptions, deleteShiftException, users } = useAppContext();
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">{title}</h2>
            <div className="overflow-x-auto">
                {Object.keys(schedule).length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No hay un equipo de rotación configurado para este rol.</p>
                ) : (
                    <table className="min-w-full border-collapse border border-slate-200">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-200 p-3 text-sm font-semibold text-slate-600">Turno</th>
                                {Object.keys(schedule).map((dayKey, index) => (
                                    <th key={dayKey} className="border border-slate-200 p-3 text-sm font-semibold text-slate-600">
                                        {weekDays[index]}
                                        <span className="block font-normal text-xs">{new Date(dayKey).toLocaleDateString('es-DO', {day: '2-digit', month: '2-digit'})}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(['Mañana', 'Tarde', 'Noche'] as Shift[]).map(shift => (
                                <tr key={shift}>
                                    <td className="border border-slate-200 p-3 font-bold text-sm text-slate-700">{shift}</td>
                                    {Object.entries(schedule).map(([dayKey, daySchedule]) => {
                                        const user: ScheduleUser | null = daySchedule[shift];
                                        const date = new Date(dayKey);
                                        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                                        
                                        const exceptionForCell = shiftExceptions.find(ex => {
                                            if (new Date(ex.exceptionDate).toDateString() !== date.toDateString() || ex.shiftType !== shift) {
                                                return false;
                                            }
                                            const originalUser = users.find(u => u.id === ex.originalUserId);
                                            return originalUser?.role === role;
                                        });

                                        return (
                                            <td key={`${dayKey}-${shift}`} className="border border-slate-200 p-3 text-sm text-center align-middle">
                                                {user ? (
                                                    <div className={`p-2 rounded-md ${user.isSubstitute ? 'bg-yellow-100 border border-yellow-300' : 'bg-green-50'}`}>
                                                        <p className="font-semibold">{user.name}</p>
                                                        {user.isSubstitute && <p className="text-xs text-yellow-700">(Sustituto)</p>}
                                                        
                                                        {exceptionForCell ? (
                                                            <button 
                                                                onClick={() => deleteShiftException(exceptionForCell.id)}
                                                                className="text-red-500 hover:text-red-700 mt-1"
                                                                aria-label="Eliminar excepción"
                                                            >
                                                                <TrashIcon className="h-4 w-4 mx-auto" />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => onOpenModal(date, shift, user)}
                                                                className="text-xs text-sky-600 hover:underline mt-1"
                                                            >
                                                                Sustituir
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : <span className="text-slate-400">N/A</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const AdminShiftsView: FC = () => {
    const { users, settings, updateSettings, shiftExceptions } = useAppContext();
    
    const [vendorRotatingIds, setVendorRotatingIds] = useState<number[]>([]);
    const [cleanerRotatingIds, setCleanerRotatingIds] = useState<number[]>([]);
    
    const [vendorWeekSchedule, setVendorWeekSchedule] = useState<WeeklySchedule>({});
    const [cleanerWeekSchedule, setCleanerWeekSchedule] = useState<WeeklySchedule>({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exceptionInfo, setExceptionInfo] = useState<{ date: Date; shift: Shift; originalUser: User } | null>(null);

    useEffect(() => {
        setVendorRotatingIds(JSON.parse(settings.shift_rotation_user_ids || '[]'));
        setCleanerRotatingIds(JSON.parse(settings.cleaner_shift_rotation_user_ids || '[]'));
    }, [settings]);

    useEffect(() => {
        setVendorWeekSchedule(calculateWeeklySchedule(users, settings, shiftExceptions, new Date(), 'VENDEDOR'));
        setCleanerWeekSchedule(calculateWeeklySchedule(users, settings, shiftExceptions, new Date(), 'LIMPIADOR'));
    }, [users, settings, shiftExceptions]);

    const handleSaveRotation = async (role: UserRole) => {
        const ids = role === 'VENDEDOR' ? vendorRotatingIds : cleanerRotatingIds;
        const idKey = role === 'VENDEDOR' ? 'shift_rotation_user_ids' : 'cleaner_shift_rotation_user_ids';
        const dateKey = role === 'VENDEDOR' ? 'shift_rotation_start_date' : 'cleaner_shift_rotation_start_date';
        
        if (ids.length !== 3 || ids.some(id => !id)) {
            alert(`Por favor, selecciona 3 ${role.toLowerCase()}es para la rotación.`);
            return;
        }

        const today = new Date();
        const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0];

        const formData = new FormData();
        formData.append(idKey, JSON.stringify(ids));
        formData.append(dateKey, settings[dateKey] || monday);

        await updateSettings(formData, {
            noReload: true,
            message: `Configuración de rotación para ${role.toLowerCase()}es guardada.`
        });
    };
    
    const handleOpenModal = (date: Date, shift: Shift, originalUser: User) => {
        setExceptionInfo({ date, shift, originalUser });
        setIsModalOpen(true);
    };
    
    return (
        <>
            <RotationConfig
                title="Configurar Equipo de Rotación Semanal (Vendedores)"
                role="VENDEDOR"
                users={users}
                rotatingUserIds={vendorRotatingIds}
                setRotatingUserIds={setVendorRotatingIds}
                onSave={() => handleSaveRotation('VENDEDOR')}
            />

            <RotationConfig
                title="Configurar Equipo de Rotación Semanal (Limpiadores)"
                role="LIMPIADOR"
                users={users}
                rotatingUserIds={cleanerRotatingIds}
                setRotatingUserIds={setCleanerRotatingIds}
                onSave={() => handleSaveRotation('LIMPIADOR')}
            />

            <ScheduleTable 
                title="Horario Semanal - Vendedores" 
                schedule={vendorWeekSchedule} 
                role="VENDEDOR"
                onOpenModal={handleOpenModal}
            />
            <ScheduleTable 
                title="Horario Semanal - Limpiadores" 
                schedule={cleanerWeekSchedule}
                role="LIMPIADOR"
                onOpenModal={handleOpenModal}
            />
            
            <ShiftExceptionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                exceptionInfo={exceptionInfo}
            />
        </>
    )
}

// --- User-facing Schedule View Component ---
const UserScheduleView: FC = () => {
    const { currentUser, users, settings, shiftExceptions } = useAppContext();
    const role = currentUser!.role as 'VENDEDOR' | 'LIMPIADOR';

    const weeklySchedule = useMemo(() => 
        calculateWeeklySchedule(users, settings, shiftExceptions, new Date(), role),
        [users, settings, shiftExceptions, role]
    );
    
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    if (Object.keys(weeklySchedule).length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-slate-600">Actualmente no estás asignado a un horario de rotación.</p>
                <p className="text-slate-500 text-sm mt-2">Contacta a un administrador si crees que esto es un error.</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(weeklySchedule).map(([dayKey, daySchedule]: [string, Record<Shift, ScheduleUser | null>], index) => {
                    const date = new Date(dayKey);
                    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                    
                    let myShift: Shift | null = null;
                    if (daySchedule.Mañana?.id === currentUser?.id) myShift = 'Mañana';
                    else if (daySchedule.Tarde?.id === currentUser?.id) myShift = 'Tarde';
                    else if (daySchedule.Noche?.id === currentUser?.id) myShift = 'Noche';
                    
                    return (
                        <div key={dayKey} className={`p-4 rounded-lg border ${myShift ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-200'}`}>
                            <h3 className="font-bold text-slate-800">{weekDays[index]}</h3>
                            <p className="text-sm text-slate-500 mb-3">{date.toLocaleDateString('es-DO', { day: 'numeric', month: 'long' })}</p>
                            {myShift ? (
                                <div className="text-center bg-sky-500 text-white font-bold py-2 px-3 rounded-md">
                                    Turno de {myShift}
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 font-medium py-2 px-3 rounded-md bg-slate-200">
                                    Día Libre
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// --- Main ShiftsView Component ---
const ShiftsView: React.FC = () => {
    const { currentUser } = useAppContext();
    
    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">
                {currentUser?.role === 'ADMINISTRADOR' ? 'Gestión de Horarios y Rotación' : 'Mi Horario Semanal'}
            </h1>
            {currentUser?.role === 'ADMINISTRADOR' ? (
                <AdminShiftsView />
            ) : (
                <UserScheduleView />
            )}
        </>
    );
};

export default ShiftsView;