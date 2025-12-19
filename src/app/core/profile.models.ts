export interface Profile {
  id: string;
  householdId: string;
  displayName: string;
  type: 'adult' | 'child';
  role: 'admin' | 'member';
  color?: string | null;
  avatarUrl?: string | null;
}
