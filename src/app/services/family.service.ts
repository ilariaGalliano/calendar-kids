import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Family, DaySchedule, ChildTask, Child } from '../models/family.models';
// Remove the import from task.models to avoid type mismatch
// import { Child } from '../models/task.models';

@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  private activeFamily = signal<Family | null>(null);
  private selectedChild = signal<Child | null>(null);
  private baseUrl = environment.apiBase;

  constructor(private http: HttpClient) {
    // NON caricare dal localStorage per evitare dati vecchi con ID invalidi
    // I children vanno sempre caricati dal database quando necessario
    // this.loadFamilyFromStorage();
  }

  // Getter per la famiglia attiva (signal scrivibile)
  getActiveFamily() {
    return this.activeFamily;
  }

  // Getter per famiglia attiva come signal readonly
  get currentFamily() {
    return this.activeFamily.asReadonly();
  }

  // Metodo per ottenere il valore della famiglia corrente
  getCurrentFamily(): Family | null {
    return this.activeFamily();
  }

  // Metodo per pulire/resettare la famiglia
  clearFamily() {
    this.activeFamily.set(null);
    this.selectedChild.set(null);
    localStorage.removeItem('calendarKids_family');
  }

  // Metodo per rigenerare la famiglia di esempio (per test)
  // regenerateExampleFamily() {
  //   this.clearFamily();
  //   this.createExampleFamily();
  // }

  // Getter per il bambino selezionato
  getSelectedChild() {
    return this.selectedChild;
  }

  // API: bambini del genitore autenticato
  fetchChildrenForCurrentUser() {
    return this.http.get<Child[]>(`${this.baseUrl}/children/me`);
  }

  // Crea una famiglia di esempio per testare l'app
  private createExampleFamily() {
    const family: Family = {
      id: this.generateId(),
      parentName: 'Famiglia Rossi',
      children: [
        {
          id: this.generateId(),
          name: 'Sofia',
          avatar: '🧚‍♀️',
          years: 8,
          sex: 'female',
          createdAt: new Date(),
          tasks: [],
          view: 'teen'
        },
        {
          id: this.generateId(),
          name: 'Marco',
          avatar: '🤴',
          years: 6,
          sex: 'male',
          createdAt: new Date(),
          tasks: [],
          view: 'child'
        },
        {
          id: this.generateId(),
          name: 'Emma',
          avatar: '🦸‍♀️',
          years: 3,
          sex: 'female',
          createdAt: new Date(),
          tasks: [],
           view: 'child'
        }
      ],
      createdAt: new Date()
    };

    this.activeFamily.set(family);
    this.saveFamilyToStorage(family);
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
        avatar: this.getRandomAvatar() ?? '',
        years: null, // valore di default, da aggiornare quando l'utente imposta l'età
        createdAt: new Date(),
        sex: '',
        tasks: [],
        view: 'child'
      };
      family.children.push(child);
    }

    this.activeFamily.set(family);
    this.saveFamilyToStorage(family);
    
    return family;
  }

  // Salva la famiglia (nuovo metodo)
  saveFamily(family: Family) {
    this.activeFamily.set(family);
    this.saveFamilyToStorage(family);
  }

  // Aggiunge un bambino alla famiglia
  addChild(name: string, years: number = 0): Child | null {
    const family = this.activeFamily();
    if (!family) return null;

    const child: Child = {
      id: this.generateId(),
      name,
      avatar: this.getRandomAvatar() ?? '',
      years: null,
      sex: '', 
      createdAt: new Date(),
      tasks: [],
      view: 'child'
    };

    family.children.push(child);
    this.activeFamily.set({ ...family });
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
      const child = family.children.find((c: Child) => c.id === childId);
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

    family.children.forEach((child: Child, childIndex: number) => {
      const tasks: ChildTask[] = [
        {
          id: `${child.id}_breakfast_${date}`,
          childId: child.id,
          title: '🍎 Colazione',
          startTime: '08:00',
          endTime: '08:30',
          description: 'Colazione sana e nutriente',
          completed: Math.random() > 0.7,
          color: this.getChildColor(childIndex)
        },
        {
          id: `${child.id}_school_${date}`,
          childId: child.id,
          title: '📚 Scuola',
          startTime: '09:00',
          endTime: '13:00',
          description: 'Tempo di apprendimento',
          completed: Math.random() > 0.8,
          color: this.getChildColor(childIndex)
        },
        {
          id: `${child.id}_lunch_${date}`,
          childId: child.id,
          title: '🍽️ Pranzo',
          startTime: '13:00',
          endTime: '14:00',
          description: 'Pranzo in famiglia',
          completed: Math.random() > 0.5,
          color: this.getChildColor(childIndex)
        },
        {
          id: `${child.id}_play_${date}`,
          childId: child.id,
          title: '🎮 Gioco libero',
          startTime: '15:00',
          endTime: '16:30',
          description: 'Tempo per giocare e rilassarsi',
          completed: Math.random() > 0.6,
          color: this.getChildColor(childIndex)
        }
      ];

      childrenTasks[child.id] = tasks;
    });

    return {
      date,
      childrenTasks
    };
  }

  // Carica famiglia dal localStorage
  private loadFamilyFromStorage() {
    try {
      const savedFamily = localStorage.getItem('calendarKids_family');
      if (savedFamily) {
        const family = JSON.parse(savedFamily) as Family;
        // Converti le date string in oggetti Date
        family.createdAt = new Date(family.createdAt);
        family.children.forEach((child: Child) => {
          child.createdAt = new Date(child.createdAt);
          // fallback se nei dati vecchi non esiste 'years'
          if (child.years === undefined || child.years === null) {
            child.years = null;
          }
        });
        this.activeFamily.set(family);
      }
    } catch (error) {
      console.error('❌ Errore caricamento famiglia:', error);
      localStorage.removeItem('calendarKids_family');
    }
  }

  // Salva famiglia nel localStorage
  private saveFamilyToStorage(family: Family) {
    try {
      localStorage.setItem('calendarKids_family', JSON.stringify(family));
    } catch (error) {
      console.error('❌ Errore salvataggio famiglia:', error);
    }
  }

  // Genera ID univoco
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Genera UUID valido (v4)
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Avatar casuali
   private getRandomAvatar(sex: 'male' | 'female' = 'male'): string {
    const avatars = {
      male: [
        '🧒', '👦', '🧑', '👶', // bambini maschi
        '🦸‍♂️', // supereroe maschio
        '🧙‍♂️', // mago
        '🐻', '🐱', '🐶', '🦊', '🐵', '🐼', // animali
        '🤠', '🤴', // cowboy, principe
        '🧑‍🚀', '🧑‍🎨', '🧑‍🚒' // astronauta, artista, pompiere
      ],
      female: [
        '👧', '🧑', '👶', // bambine
        '🦸‍♀️', // supereroina
        '🧚‍♀️', // fata
        '🐻', '🐱', '🐶', '🦊', '🐵', '🐼', // animali
        '👸', // principessa
        '🧑‍🚀', '🧑‍🎨', '🧑‍🚒' // astronauta, artista, pompiere
      ]
    };
    const selectedAvatars = avatars[sex] || avatars.male;
    return selectedAvatars[Math.floor(Math.random() * selectedAvatars.length)];
  }

  // Colori per i bambini
  private getChildColor(index: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC'];
    return colors[index % colors.length];
  }
}
