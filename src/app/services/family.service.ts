import { Injectable, signal } from '@angular/core';
import { Family, Child, ChildTask, DaySchedule } from '../models/family.models';

@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  private activeFamily = signal<Family | null>(null);
  private selectedChild = signal<Child | null>(null);

  constructor() {
    // Carica la famiglia dal localStorage se presente
    this.loadFamilyFromStorage();
  }

  // Getter per la famiglia attiva
  getActiveFamily() {
    return this.activeFamily;
  }

  // Getter per famiglia attiva come signal
  get currentFamily() {
    return this.activeFamily.asReadonly();
  }

  // Metodo per ottenere la famiglia corrente
  getCurrentFamily(): Family | null {
    return this.activeFamily();
  }

  // Metodo per pulire/resettare la famiglia
  clearFamily() {
    this.activeFamily.set(null);
    this.selectedChild.set(null);
    localStorage.removeItem('calendarKids_family');
  }

  // Getter per il bambino selezionato
  getSelectedChild() {
    return this.selectedChild;
  }

  // Crea una nuova famiglia
  createFamily(parentName: string, numberOfChildren: number): Family {
    const family: Family = {
      id: this.generateId(),
      parentName,
      children: [],
      createdAt: new Date()
    };

    // Crea i bambini con nomi di default
    for (let i = 1; i <= numberOfChildren; i++) {
      const child: Child = {
        id: this.generateId(),
        name: `Bambino ${i}`,
        avatar: this.getRandomAvatar(),
        createdAt: new Date()
      };
      family.children.push(child);
    }

    this.activeFamily.set(family);
    this.saveFamilyToStorage(family);
    
    console.log('👨‍👩‍👧‍👦 Famiglia creata:', family);
    return family;
  }

  // Aggiunge un bambino alla famiglia
  addChild(name: string): Child | null {
    const family = this.activeFamily();
    if (!family) return null;

    const child: Child = {
      id: this.generateId(),
      name,
      avatar: this.getRandomAvatar(),
      createdAt: new Date()
    };

    family.children.push(child);
    this.activeFamily.set({...family});
    this.saveFamilyToStorage(family);

    return child;
  }

  // Seleziona un bambino (null = tutti i bambini)
  selectChild(childId: string | null) {
    const family = this.activeFamily();
    if (!family) return;

    if (childId === null) {
      this.selectedChild.set(null);
    } else {
      const child = family.children.find(c => c.id === childId);
      this.selectedChild.set(child || null);
    }
  }

  // Genera task mock per una data specifica
  generateMockTasksForDate(date: string): DaySchedule {
    const family = this.activeFamily();
    if (!family) {
      return { date, childrenTasks: {} };
    }

    const childrenTasks: Record<string, ChildTask[]> = {};

    family.children.forEach((child, childIndex) => {
      const tasks: ChildTask[] = [
        {
          id: `${child.id}_breakfast_${date}`,
          childId: child.id,
          title: '🍎 Colazione',
          startTime: '08:00',
          endTime: '08:30',
          color: child.avatar.color,
          completed: false,
          date
        },
        {
          id: `${child.id}_homework_${date}`,
          childId: child.id,
          title: '📚 Compiti',
          startTime: `${14 + childIndex}:00`, // Orari diversi per ogni bambino
          endTime: `${15 + childIndex}:00`,
          color: child.avatar.color,
          completed: false,
          date
        },
        {
          id: `${child.id}_play_${date}`,
          childId: child.id,
          title: '🎮 Gioco libero',
          startTime: `${16 + childIndex}:00`,
          endTime: `${17 + childIndex}:00`,
          color: child.avatar.color,
          completed: false,
          date
        },
        {
          id: `${child.id}_dinner_${date}`,
          childId: child.id,
          title: '🍽️ Cena',
          startTime: '19:00',
          endTime: '19:30',
          color: child.avatar.color,
          completed: false,
          date
        },
        {
          id: `${child.id}_bedtime_${date}`,
          childId: child.id,
          title: '🛏️ Andare a letto',
          startTime: `${20 + childIndex}:00`,
          endTime: `${20 + childIndex}:30`,
          color: child.avatar.color,
          completed: false,
          date
        }
      ];

      childrenTasks[child.id] = tasks;
    });

    return { date, childrenTasks };
  }

  // Toggle completamento task
  toggleTaskCompletion(taskId: string, date: string): boolean {
    // Per ora solo mock, in futuro si integrerà con l'API
    console.log(`✅ Task ${taskId} completata per il ${date}`);
    return true;
  }

  // Logout - pulisce i dati
  logout() {
    this.activeFamily.set(null);
    this.selectedChild.set(null);
    localStorage.removeItem('calendarKids_family');
  }

  // Metodi privati

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomAvatar() {
    const avatars = [
      { id: 'boy1', emoji: '👦', color: '#FFB84D' },
      { id: 'girl1', emoji: '👧', color: '#FF69B4' },
      { id: 'boy2', emoji: '🧒', color: '#4ECDC4' },
      { id: 'girl2', emoji: '👩', color: '#96CEB4' },
      { id: 'baby', emoji: '👶', color: '#FFD93D' }
    ];
    
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  private saveFamilyToStorage(family: Family) {
    localStorage.setItem('calendarKids_family', JSON.stringify(family));
  }

  private loadFamilyFromStorage() {
    try {
      const stored = localStorage.getItem('calendarKids_family');
      if (stored) {
        const family = JSON.parse(stored) as Family;
        this.activeFamily.set(family);
      }
    } catch (error) {
      console.error('Errore nel caricamento famiglia dal storage:', error);
    }
  }
}