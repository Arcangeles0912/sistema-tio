import React, { useState, useEffect } from 'react';
import { getRoomUsageInfo, RoomUsageInfo } from '../utils';

interface RoomTimerProps {
  soldAt: Date;
}

const RoomTimer: React.FC<RoomTimerProps> = ({ soldAt }) => {
  const [usageInfo, setUsageInfo] = useState<RoomUsageInfo>(() => getRoomUsageInfo(soldAt));

  useEffect(() => {
    setUsageInfo(getRoomUsageInfo(soldAt));
    const intervalId = setInterval(() => {
      setUsageInfo(getRoomUsageInfo(soldAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [soldAt]);

  return (
    <div className="mt-1 text-xs" aria-live="off">
      <p className="text-white/95 font-medium">
        <span className="font-bold">Uso:</span> {usageInfo.formattedElapsed}
      </p>
      {usageInfo.status === 'warning' && (
        <p className="mt-0.5 font-bold text-amber-200 bg-black/25 px-1.5 py-0.5 rounded inline-block animate-pulse">
          ⚠️ Quedan: {usageInfo.formattedRemaining}
        </p>
      )}
      {usageInfo.status === 'expired' && (
        <p className="mt-0.5 font-bold text-rose-200 bg-black/35 px-1.5 py-0.5 rounded inline-block animate-pulse">
          🚨 Excedido: {usageInfo.formattedRemaining}
        </p>
      )}
      {usageInfo.status === 'normal' && (
        <p className="text-[11px] text-white/70">
          Restan: {usageInfo.formattedRemaining}
        </p>
      )}
    </div>
  );
};

export default RoomTimer;