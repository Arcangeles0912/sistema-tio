import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { getRoomUsageInfo, playAlertChime, RoomUsageInfo } from '../utils';
import type { Room } from '../types';

interface RoomAlertBannerProps {
  onNavigateToRooms?: () => void;
}

interface ActiveRoomAlert {
  room: Room;
  usageInfo: RoomUsageInfo;
  occupiedAt: Date;
}

export const RoomAlertBanner: React.FC<RoomAlertBannerProps> = ({ onNavigateToRooms }) => {
  const { rooms } = useAppContext();
  const [activeAlerts, setActiveAlerts] = useState<ActiveRoomAlert[]>([]);
  // Store acknowledged keys in the format `${roomId}-${status}` so user dismissing it keeps it hidden until status changes
  const [acknowledgedKeys, setAcknowledgedKeys] = useState<Set<string>>(new Set());

  // Keep track of which rooms have already chimed for their current status phase
  const chimedStatusRef = useRef<Map<number, string>>(new Map());

  // Filter occupied rooms with a valid occupied_at timestamp
  const occupiedRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    return rooms.filter(r => r.status === 'no disponible' && r.occupied_at);
  }, [rooms]);

  // Periodic check (every 3 seconds)
  useEffect(() => {
    const checkRoomTimes = () => {
      const currentAlerts: ActiveRoomAlert[] = [];
      const currentOccupiedIds = new Set<number>();

      occupiedRooms.forEach(room => {
        currentOccupiedIds.add(room.id);
        const occupiedAt = new Date(room.occupied_at!);
        const usageInfo = getRoomUsageInfo(occupiedAt);

        // ONLY alert if status is 'warning' (<= 10 min left for 4h) or 'expired' (>= 4h)
        if (usageInfo.status === 'warning' || usageInfo.status === 'expired') {
          currentAlerts.push({ room, usageInfo, occupiedAt });

          // Check if chime needs to play for this status phase
          const previousChimed = chimedStatusRef.current.get(room.id);
          if (previousChimed !== usageInfo.status) {
            chimedStatusRef.current.set(room.id, usageInfo.status);
            playAlertChime();
          }
        }
      });

      // Cleanup freed/available rooms from chime and acknowledgement memory
      chimedStatusRef.current.forEach((_, roomId) => {
        if (!currentOccupiedIds.has(roomId)) {
          chimedStatusRef.current.delete(roomId);
        }
      });

      setActiveAlerts(currentAlerts);
    };

    checkRoomTimes();
    const interval = setInterval(checkRoomTimes, 3000);
    return () => clearInterval(interval);
  }, [occupiedRooms]);

  // Unacknowledged alerts are those that should stay fixed on screen until dismissed by user
  const unacknowledgedAlerts = useMemo(() => {
    return activeAlerts.filter(
      alert => !acknowledgedKeys.has(`${alert.room.id}-${alert.usageInfo.status}`)
    );
  }, [activeAlerts, acknowledgedKeys]);

  const handleAcknowledge = (roomId: number, status: string) => {
    setAcknowledgedKeys(prev => new Set(prev).add(`${roomId}-${status}`));
  };


  const warningCount = activeAlerts.filter(a => a.usageInfo.status === 'warning').length;
  const expiredCount = activeAlerts.filter(a => a.usageInfo.status === 'expired').length;

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Fixed Unacknowledged Alert Popups - Stays fixed until user clicks button */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full space-y-3 pointer-events-auto">
          {unacknowledgedAlerts.map(alert => {
            const isExpired = alert.usageInfo.status === 'expired';
            return (
              <div
                key={`${alert.room.id}-${alert.usageInfo.status}`}
                className={`p-4 rounded-xl shadow-2xl border-2 transition-all duration-300 ${
                  isExpired
                    ? 'bg-rose-950 text-white border-rose-500 shadow-rose-950/80 animate-pulse'
                    : 'bg-amber-950 text-white border-amber-400 shadow-amber-950/80'
                }`}
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg flex items-center justify-center ${isExpired ? 'bg-rose-700' : 'bg-amber-600'}`}>
                    <span className="text-2xl">
                      {isExpired ? '🚨' : '⏰'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-extrabold text-base text-white tracking-wide">
                        {isExpired
                          ? `¡Tiempo Cumplido: Hab. ${alert.room.number}!`
                          : `¡Tiempo por Vencer: Hab. ${alert.room.number}!`}
                      </h4>
                      <button
                        onClick={() => handleAcknowledge(alert.room.id, alert.usageInfo.status)}
                        className="text-white/70 hover:text-white text-base px-1.5 py-0.5 rounded hover:bg-white/10 font-bold"
                        aria-label="Cerrar alerta"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-white/95 mt-1.5 font-medium leading-relaxed">
                      {isExpired
                        ? `La habitación ha alcanzado las 4 horas de uso (${alert.usageInfo.formattedElapsed} de actividad).`
                        : `A la habitación le quedan ${alert.usageInfo.formattedRemaining} para cumplir las 4 horas de uso.`}
                    </p>
                    <div className="mt-3.5 flex items-center gap-2">
                      {onNavigateToRooms && (
                        <button
                          onClick={() => {
                            handleAcknowledge(alert.room.id, alert.usageInfo.status);
                            onNavigateToRooms();
                          }}
                          className={`px-3.5 py-2 text-xs font-bold rounded-lg shadow-md transition-transform transform active:scale-95 ${
                            isExpired
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          Ver Habitación
                        </button>
                      )}
                      <button
                        onClick={() => handleAcknowledge(alert.room.id, alert.usageInfo.status)}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg transition-colors border border-white/20"
                      >
                        Entendido
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Persistent Top Warning Header Ribbon if any room is active in warning or expired status */}
      <div
        className={`w-full px-4 py-2.5 shadow-sm border-b flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium transition-colors ${
          expiredCount > 0
            ? 'bg-rose-100 text-rose-900 border-rose-300'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${expiredCount > 0 ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${expiredCount > 0 ? 'bg-rose-600' : 'bg-amber-600'}`}></span>
          </span>
          <span className="font-bold">
            {expiredCount > 0
              ? `🚨 ${expiredCount} habitación(es) con 4h de uso cumplidas/excedidas`
              : `⏰ ${warningCount} habitación(es) a menos de 10 min de cumplir 4h`}
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="text-slate-700 font-normal">
            {activeAlerts.map((a, idx) => (
              <span key={a.room.id} className="mr-2 inline-block">
                <strong className="font-semibold">Hab. {a.room.number}</strong> (
                {a.usageInfo.status === 'expired'
                  ? `Excedido ${a.usageInfo.formattedRemaining}`
                  : `Faltan ${a.usageInfo.formattedRemaining}`}
                ){idx < activeAlerts.length - 1 ? ',' : ''}
              </span>
            ))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToRooms && (
            <button
              onClick={onNavigateToRooms}
              className={`px-3 py-1 rounded font-semibold text-xs transition-all ${
                expiredCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              Ir a Habitaciones
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default RoomAlertBanner;
