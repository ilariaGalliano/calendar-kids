export interface Family {
  id: string;
  parentName: string;
  children: Child[];
  createdAt: Date;
}

export interface Child {
  birth_date?: string | null; // YYYY-MM-DD
  years?: number | null;      // legacy, kept for compat
  id: string;
  name: string;
  avatar: string;             // emoji or data URL photo
  photo?: string | null;      // base64 photo (overrides avatar for display)
  createdAt: Date;
  sex: string;
  point?: number;
  view: 'teen' | 'child';
  tasks: ChildTask[];
}

/** Calculates age in years from a YYYY-MM-DD birth date */
export function calcAge(birth_date?: string | null): number | null {
  if (!birth_date) return null;
  const today = new Date();
  const dob = new Date(birth_date);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
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
  icon?: string;
}

export interface DaySchedule {
  date: string;
  childrenTasks: Record<string, ChildTask[]>;
}