import React from 'react';
import type { RoomLog } from '../types';

interface RoomLogHistoryProps {
  logs: RoomLog[];
}

const formatDuration = (start: Date, end: Date): string => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return 'N/A';

    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
};

const getStatusChip = (status: RoomLog['clearingStatus']) => {
    switch(status) {
        case 'LISTA':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Lista</span>;
        case 'ARTICULO_OLVIDADO':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Art. Olvidado</span>;
        case 'REPORTE_ROBO':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Robo</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">N/A</span>;
    }
}


const RoomLogHistory: React.FC<RoomLogHistoryProps> = ({ logs }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
            <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Habitación</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Venta</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Limpieza</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">T. Ocupado</th>
                </tr>
            </thead>
            <tbody>
                {logs.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500">No hay registros de limpieza.</td>
                    </tr>
                ) : (
                    logs.map((log, index) => (
                        <tr key={log.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-sky-50`}>
                            <td className="px-5 py-4 text-sm text-slate-900 font-bold">{log.roomNumber}</td>
                            <td className="px-5 py-4 text-sm text-slate-900">
                                <p>{new Date(log.soldAt).toLocaleString('es-DO')}</p>
                                <p className="text-xs text-slate-500">por {log.soldByUserName || 'N/A'}</p>
                            </td>
                             <td className="px-5 py-4 text-sm text-slate-900">
                                <p>{new Date(log.clearedAt).toLocaleString('es-DO')}</p>
                                <p className="text-xs text-slate-500">por {log.clearedByUserName}</p>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-900">{getStatusChip(log.clearingStatus)}</td>
                            <td className="px-5 py-4 text-sm text-slate-900">{formatDuration(log.soldAt, log.clearedAt)}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
  );
};

export default RoomLogHistory;