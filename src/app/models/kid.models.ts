export interface Kid {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

export type KidId = string;

export interface KidTask {
  childName: string;
  id: string;
  instanceId: string; // per identificare l'istanza specifica
  title: string;
  color: string;
  start: string; // ISO string
  end: string;   // ISO string
  done: boolean;
  doneAt?: string | null;
  // altri campi opzionali dal BE
  childId: string;
  taskId?: string;
  assigneeProfileId?: string;
  description?: string | null;
  icon?: string;
  repeat?: any; //TODO: fix this
  reminders?: number[];
  timerActive?: boolean;
  timerValue?: number; 
}