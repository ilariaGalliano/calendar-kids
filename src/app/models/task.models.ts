export interface Task {
  id: string;
  householdId: string;
  title: string;
  color?: string | null;
  icon?: string | null;
  schedule?: any;
  isActive: boolean;
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
