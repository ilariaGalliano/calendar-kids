export interface Child {
  id: string;
  name: string;
  avatar?: string;
  years: string;
  view: 'teen' | 'child';
  createdAt: Date;
}

export interface Routine {
  id: string;
  childId: string;
  name: string;
  description?: string;
  days: string[];
  tasks: any[];
  tasksByDay?: Record<number, any[]>; // NEW: tasks organized by day (0=Sun, 1=Mon, ..., 6=Sat)
  isActive: boolean;
  category: string;
  createdAt: string;
}

export interface Task {
  id: string;
  householdId?: string;
  title: string;
  color?: string | null;
  icon?: string | null;
  schedule?: any;
  isActive: boolean;
  emoji: string;
  duration: number; // minuti
  description?: string;
  reward: number;
  startTime?: string | null; // 'HH:mm' - ora inizio
  endTime?: string | null;   // 'HH:mm' - ora fine
  // category: 'morning' | 'afternoon' | 'evening' | 'custom';
}

export interface TaskInstance {
  id: string;
  taskId: string;
  assigneeProfileId: string;
  date: string;        // ISO date
  startTime?: string | null; // 'HH:mm'
  endTime?: string | null;
  done: boolean;
  doneAt?: string | null;
  reward: number;
  task?: Task;
  duration: number;
}

export interface TaskPayload {
  title: string;
  emoji: string;
  description?: string;
  duration: number;
  color: string;
  isActive: boolean;
  reward: number;
  startTime?: string;
  endTime?: string;
}
