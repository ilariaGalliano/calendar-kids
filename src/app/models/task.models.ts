export type KidId = string;

export interface KidTask {
  id: string;
  kidId: KidId;
  title: string;
  color: string;
  start: string; // ISO
  end: string;   // ISO
  done: boolean,
  repeat?: 'none' | 'daily' | 'weekly';
  reminders?: number[]; // minutes before
}
