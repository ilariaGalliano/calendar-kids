export interface Family {
  id: string;
  parentName: string;
  children: Child[];
  createdAt: Date;
}

export interface Child {
  id: string;
  name: string;
  avatar: {
    id: string;
    emoji: string;
    color: string;
  };
  age?: number;
  createdAt: Date;
}

export interface ChildTask {
  id: string;
  childId: string;
  title: string;
  description?: string;
  startTime: string; // HH:MM format
  endTime?: string;
  color: string;
  completed: boolean;
  completedAt?: Date;
  date: string; // YYYY-MM-DD format
}

export interface DaySchedule {
  date: string;
  childrenTasks: Record<string, ChildTask[]>; // childId -> tasks
}