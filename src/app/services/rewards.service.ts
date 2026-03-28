import { Injectable, signal } from '@angular/core';

export interface RewardPoints {
  childId: string;
  childName: string;
  totalPoints: number;
  dailyPoints: number;
  tasksCompleted: number;
}

export interface PointsAnimation {
  id: string;
  points: number;
  x: number;
  y: number;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly POINTS_PER_TASK = 10;
  private readonly STORAGE_KEY = 'calendarKids_rewards';
  
  // Signals per il reactive state
  childrenPoints = signal<RewardPoints[]>([]);
  pointsAnimations = signal<PointsAnimation[]>([]);

  constructor() {
    this.loadPointsFromStorage();
  }

  // Aggiunge punti quando un'attività viene completata
  addPointsForTask(childId: string, childName: string, taskElement?: HTMLElement): void {
    const points = this.childrenPoints();
    const existingIndex = points.findIndex(p => p.childId === childId);
    
    if (existingIndex >= 0) {
      // Aggiorna i punti del bambino esistente
      const existing = points[existingIndex];
      points[existingIndex] = {
        ...existing,
        totalPoints: existing.totalPoints + this.POINTS_PER_TASK,
        dailyPoints: existing.dailyPoints + this.POINTS_PER_TASK,
        tasksCompleted: existing.tasksCompleted + 1
      };
    } else {
      // Nuovo bambino
      points.push({
        childId,
        childName,
        totalPoints: this.POINTS_PER_TASK,
        dailyPoints: this.POINTS_PER_TASK,
        tasksCompleted: 1
      });
    }
    
    this.childrenPoints.set([...points]);
    this.savePointsToStorage();
    
    // Mostra animazione dei punti se abbiamo l'elemento
    if (taskElement) {
      this.showPointsAnimation(taskElement);
    }
  }

  // Rimuove punti quando un'attività viene decompletata
  removePointsForTask(childId: string): void {
    const points = this.childrenPoints();
    const existingIndex = points.findIndex(p => p.childId === childId);
    
    if (existingIndex >= 0) {
      const existing = points[existingIndex];
      if (existing.totalPoints >= this.POINTS_PER_TASK) {
        points[existingIndex] = {
          ...existing,
          totalPoints: existing.totalPoints - this.POINTS_PER_TASK,
          dailyPoints: existing.dailyPoints - this.POINTS_PER_TASK,
          tasksCompleted: Math.max(0, existing.tasksCompleted - 1)
        };
        
        this.childrenPoints.set([...points]);
        this.savePointsToStorage();
      }
    }
  }

  // Ottiene i punti di un bambino specifico
  getPointsForChild(childId: string): RewardPoints | null {
    return this.childrenPoints().find(p => p.childId === childId) || null;
  }

  // Reset dei punti giornalieri (da chiamare ogni giorno)
  resetDailyPoints(): void {
    const points = this.childrenPoints().map(p => ({
      ...p,
      dailyPoints: 0,
      tasksCompleted: 0
    }));
    
    this.childrenPoints.set(points);
    this.savePointsToStorage();
  }

  // Animazione visiva dei punti guadagnati
  private showPointsAnimation(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const animation: PointsAnimation = {
      id: Date.now().toString(),
      points: this.POINTS_PER_TASK,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      timestamp: Date.now()
    };
    
    const animations = this.pointsAnimations();
    this.pointsAnimations.set([...animations, animation]);
    
    // Rimuove l'animazione dopo 2 secondi
    setTimeout(() => {
      this.pointsAnimations.update(anims => 
        anims.filter(a => a.id !== animation.id)
      );
    }, 2000);
  }

  // Salva i punti nel localStorage
  private savePointsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.childrenPoints()));
    } catch (error) {
      console.error('❌ Errore nel salvataggio punti:', error);
    }
  }

  // Carica i punti dal localStorage
  private loadPointsFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const points = JSON.parse(saved) as RewardPoints[];
        this.childrenPoints.set(points);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento punti:', error);
    }
  }

  // Ottiene il numero totale di stelle guadagnate
  getStarsForPoints(points: number): number {
    return Math.floor(points / 50); // 1 stella ogni 50 punti
  }

  // Ottiene i punti necessari per la prossima stella
  getPointsToNextStar(points: number): number {
    const nextStarPoints = (Math.floor(points / 50) + 1) * 50;
    return nextStarPoints - points;
  }
}