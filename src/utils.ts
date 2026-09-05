import type { User, ShiftException, Settings, Shift, UserRole } from './types';

export const formatCurrency = (amount: any): string => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numericAmount)) {
    return '0.00';
  }
  return numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Shift Calculation Logic ---

export interface ScheduleUser extends User {
  isSubstitute: boolean;
}

export type WeeklySchedule = Record<string, Record<Shift, ScheduleUser | null>>;

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getDayKey = (d: Date): string => d.toISOString().split('T')[0];

export const calculateWeeklySchedule = (
    users: User[],
    settings: Settings,
    exceptions: ShiftException[],
    weekDate: Date = new Date(),
    role: UserRole
): WeeklySchedule => {
    const idKey = role === 'VENDEDOR' ? 'shift_rotation_user_ids' : 'cleaner_shift_rotation_user_ids';
    const dateKey = role === 'VENDEDOR' ? 'shift_rotation_start_date' : 'cleaner_shift_rotation_start_date';

    const rotatingUserIds: number[] = JSON.parse(settings[idKey] || '[]');
    if (rotatingUserIds.length < 3) return {};

    const rotatingUsers = rotatingUserIds
      .map(id => users.find(u => u.id === id))
      .filter((u): u is User => !!u && u.role === role);
      
    if (rotatingUsers.length < 3) return {};
    
    // Explicitly check for settings[dateKey] to satisfy TypeScript's strict null checks
    let rotationStartDate = new Date();
    if (settings[dateKey]) {
      rotationStartDate = new Date(settings[dateKey] as string);
    }
    
    const currentWeekMonday = getMonday(weekDate);
    const startWeekMonday = getMonday(rotationStartDate);
    
    const weeksPassed = Math.floor((currentWeekMonday.getTime() - startWeekMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const rotationOffset = weeksPassed % 3;

    const rotatedUsers = [...rotatingUsers];
    for (let i = 0; i < rotationOffset; i++) {
      const user = rotatedUsers.shift();
      if (user) rotatedUsers.push(user);
    }
    
    const [morningUser, afternoonUser, nightUser] = rotatedUsers;

    const schedule: WeeklySchedule = {};

    for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekMonday);
        day.setDate(currentWeekMonday.getDate() + i);
        const dayKey = getDayKey(day);

        schedule[dayKey] = {
            'Mañana': morningUser ? { ...morningUser, isSubstitute: false } : null,
            'Tarde': afternoonUser ? { ...afternoonUser, isSubstitute: false } : null,
            'Noche': nightUser ? { ...nightUser, isSubstitute: false } : null,
        };
    }
    
    // Apply exceptions
    exceptions.forEach(ex => {
        const exceptionDate = new Date(ex.exceptionDate);
        exceptionDate.setMinutes(exceptionDate.getMinutes() + exceptionDate.getTimezoneOffset()); // Adjust for timezone
        const dayKey = getDayKey(exceptionDate);
        
        if (schedule[dayKey] && schedule[dayKey][ex.shiftType]) {
             const originalUser = schedule[dayKey][ex.shiftType];
             // Apply exception only if it's for the correct role
             if(originalUser?.role === role) {
                const substituteUser = users.find(u => u.id === ex.substituteUserId);
                if (substituteUser) {
                    schedule[dayKey][ex.shiftType] = { ...substituteUser, isSubstitute: true };
                }
             }
        }
    });

    return schedule;
};

// --- Room Usage & 4-Hour Time Limit Helpers ---

export const ROOM_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours
export const ROOM_WARNING_THRESHOLD_MS = 10 * 60 * 1000;    // 10 minutes
export const ROOM_WARNING_TRIGGER_MS = ROOM_SESSION_DURATION_MS - ROOM_WARNING_THRESHOLD_MS; // 3h 50m

export type RoomTimeStatus = 'normal' | 'warning' | 'expired';

export interface RoomUsageInfo {
  status: RoomTimeStatus;
  elapsedMs: number;
  remainingMs: number;
  formattedElapsed: string;
  formattedRemaining: string;
  minutesRemaining: number;
}

export const getRoomUsageInfo = (startTimeInput: Date | string | number): RoomUsageInfo => {
  const start = new Date(startTimeInput);
  const now = new Date();
  
  if (isNaN(start.getTime())) {
    return {
      status: 'normal',
      elapsedMs: 0,
      remainingMs: ROOM_SESSION_DURATION_MS,
      formattedElapsed: '00:00:00',
      formattedRemaining: '04:00:00',
      minutesRemaining: 240,
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - start.getTime());
  const remainingMs = ROOM_SESSION_DURATION_MS - elapsedMs;

  const totalElapsedSec = Math.floor(elapsedMs / 1000);
  const elpHours = Math.floor(totalElapsedSec / 3600).toString().padStart(2, '0');
  const elpMinutes = Math.floor((totalElapsedSec % 3600) / 60).toString().padStart(2, '0');
  const elpSeconds = (totalElapsedSec % 60).toString().padStart(2, '0');
  const formattedElapsed = `${elpHours}:${elpMinutes}:${elpSeconds}`;

  let status: RoomTimeStatus = 'normal';
  let formattedRemaining = '';

  if (elapsedMs >= ROOM_SESSION_DURATION_MS) {
    status = 'expired';
    const overdueMs = elapsedMs - ROOM_SESSION_DURATION_MS;
    const totalOverdueSec = Math.floor(overdueMs / 1000);
    const odHours = Math.floor(totalOverdueSec / 3600).toString().padStart(2, '0');
    const odMinutes = Math.floor((totalOverdueSec % 3600) / 60).toString().padStart(2, '0');
    const odSeconds = (totalOverdueSec % 60).toString().padStart(2, '0');
    formattedRemaining = odHours !== '00' ? `+${odHours}:${odMinutes}:${odSeconds}` : `+${odMinutes}:${odSeconds}`;
  } else if (elapsedMs >= ROOM_WARNING_TRIGGER_MS) {
    status = 'warning';
    const remSec = Math.max(0, Math.floor(remainingMs / 1000));
    const remMinutes = Math.floor(remSec / 60).toString().padStart(2, '0');
    const remSeconds = (remSec % 60).toString().padStart(2, '0');
    formattedRemaining = `${remMinutes}:${remSeconds}`;
  } else {
    status = 'normal';
    const remSec = Math.max(0, Math.floor(remainingMs / 1000));
    const remHours = Math.floor(remSec / 3600).toString().padStart(2, '0');
    const remMinutes = Math.floor((remSec % 3600) / 60).toString().padStart(2, '0');
    const remSeconds = (remSec % 60).toString().padStart(2, '0');
    formattedRemaining = `${remHours}:${remMinutes}:${remSeconds}`;
  }

  const minutesRemaining = Math.max(0, Math.ceil(remainingMs / 60000));

  return {
    status,
    elapsedMs,
    remainingMs,
    formattedElapsed,
    formattedRemaining,
    minutesRemaining,
  };
};

export const playAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Play attention-grabbing 2-tone melodic chime
    playTone(587.33, now, 0.35);        // D5
    playTone(880.00, now + 0.15, 0.55); // A5
  } catch (e) {
    console.warn('Audio alert could not be played:', e);
  }
};