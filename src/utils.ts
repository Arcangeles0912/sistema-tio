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