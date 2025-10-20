// Interfacce per il calendario che corrispondono al backend
export interface CalendarTask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  startTime?: string;
  endTime?: string;
  done: boolean;
  doneAt?: Date;
  assigneeProfileId: string;
  assigneeProfile?: {
    id: string;
    displayName: string;
    color?: string;
    avatarUrl?: string;
  };
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  isToday: boolean;
  tasks: CalendarTask[];
}

export interface CalendarWeek {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  weekNumber: number;
  days: CalendarDay[];
}

export interface CalendarResponse {
  month: number;
  year: number;
  totalDays: number;
  weeks: CalendarWeek[];
  dailyView: CalendarDay[];
}

// Interfacce per la vista "Ora Corrente"
export interface CurrentTimeWindowTask extends CalendarTask {
  timeStatus: 'past' | 'current' | 'upcoming';
  minutesFromNow: number;
}

export interface CurrentTimeWindowResponse {
  currentTime: string;
  currentDate: string;
  timeWindow: {
    start: string;
    end: string;
  };
  tasks: CurrentTimeWindowTask[];
  summary: {
    total: number;
    completed: number;
    pending: number;
    current: number;
    upcoming: number;
  };
}

export interface CurrentTimeWindowData {
  currentTime: string;
  currentDate: string;
  timeWindow: {
    start: string;
    end: string;
  };
  tasks: (import('./kid.models').KidTask & {
    timeStatus: 'past' | 'current' | 'upcoming';
    minutesFromNow: number;
  })[];
  summary: {
    total: number;
    completed: number;
    pending: number;
    current: number;
    upcoming: number;
  };
}

// Utility per convertire CalendarTask in KidTask (compatibilità)
export function calendarTaskToKidTask(calendarTask: CalendarTask, date: string): import('./kid.models').KidTask {
  return {
    id: calendarTask.taskId,
    instanceId: calendarTask.id,
    title: calendarTask.title,
    color: calendarTask.color || '#6B73FF',
    start: calendarTask.startTime ? `${date}T${calendarTask.startTime}:00.000Z` : `${date}T08:00:00.000Z`,
    end: calendarTask.endTime ? `${date}T${calendarTask.endTime}:00.000Z` : `${date}T09:00:00.000Z`,
    done: calendarTask.done,
    doneAt: calendarTask.doneAt ? calendarTask.doneAt.toString() : null,
    taskId: calendarTask.taskId,
    assigneeProfileId: calendarTask.assigneeProfileId,
    description: calendarTask.description,
    icon: calendarTask.icon
  };
}