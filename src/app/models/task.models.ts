export interface Child {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  view: 'teen' | 'child';
  createdAt: Date;
}

export interface Routine {
  id: string;
  childId: string;
  name: string;
  tasks: Task[];
  days: string[]; // ['mon', 'tue', 'wed', ...]
  startTime: string;
  isActive: boolean;
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
  category: 'morning' | 'afternoon' | 'evening' | 'custom';
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
  task?: Task;
}

export interface TaskPayload {
  title: string;
  emoji: string;
  description?: string;
  duration: number;
  category: string;
  color: string;
  isActive: boolean;
}
