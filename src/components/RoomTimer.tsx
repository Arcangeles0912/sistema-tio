import React, { useState, useEffect } from 'react';

interface RoomTimerProps {
  soldAt: Date;
}

const formatElapsedTime = (startTime: Date): string => {
  const now = new Date();
  // Ensure startTime is a Date object
  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    return '00:00:00';
  }

  const elapsedMs = now.getTime() - start.getTime();
  if (elapsedMs < 0) return '00:00:00';

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const RoomTimer: React.FC<RoomTimerProps> = ({ soldAt }) => {
  const [elapsedTime, setElapsedTime] = useState(() => formatElapsedTime(soldAt));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedTime(formatElapsedTime(soldAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [soldAt]);

  return (
    <p className="mt-1 text-xs text-white/90" aria-live="off">
      <span className="font-semibold">Tiempo:</span> {elapsedTime}
    </p>
  );
};

export default RoomTimer;