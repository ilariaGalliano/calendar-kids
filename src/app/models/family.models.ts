export interface Family {
  id: string;
  parentName: string;
  children: Child[];
  createdAt: Date;
}

export interface Child {
  age: number | null;
  id: string;
  name: string;
  avatar: string;
  createdAt: Date;
  sex: string;
  point?: number;
}

export interface ChildTask {
  id: string;
  childId: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string;
  completed: boolean;
  color: string;
}

export interface DaySchedule {
  date: string;
  childrenTasks: Record<string, ChildTask[]>;
}