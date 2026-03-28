import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

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

export interface RedemptionRecord {
  childId: string;
  childName: string;
  pointsRedeemed: number;
  redeemedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly POINTS_PER_TASK = 10;
  private readonly STORAGE_KEY = 'calendarKids_rewards';
  private readonly REDEMPTION_HISTORY_KEY = 'calendarKids_redemptions';
  private http = inject(HttpClient);
  private baseUrl = environment.apiBase;
  
  // Signals per il reactive state
  childrenPoints = signal<RewardPoints[]>([]);
  pointsAnimations = signal<PointsAnimation[]>([]);
  redemptionHistory = signal<RedemptionRecord[]>([]);

  constructor() {
    this.loadPointsFromStorage();
    this.loadRedemptionHistory();
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

  // ─── PIN & Riscossione ──────────────────────────────────────────────────

  /** Controlla se il genitore ha già impostato un PIN */
  hasPinSet(): Observable<boolean> {
    return this.http.get<{ hasPin: boolean }>(`${this.baseUrl}/users/me/pin/status`)
      .pipe(map(r => r.hasPin));
  }

  /** Imposta o aggiorna il PIN del genitore */
  setPin(pin: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/users/me/pin`, { pin });
  }

  /** Verifica il PIN — restituisce { valid: true/false } */
  verifyPin(pin: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.baseUrl}/users/me/pin/verify`, { pin });
  }

  /** Azzera i punti del bambino dopo riscossione */
  redeemPoints(childId: string): void {
    const points = this.childrenPoints();
    const idx = points.findIndex(p => p.childId === childId);
    if (idx < 0) return;

    const record: RedemptionRecord = {
      childId,
      childName: points[idx].childName,
      pointsRedeemed: points[idx].totalPoints,
      redeemedAt: new Date().toISOString(),
    };

    points[idx] = {
      ...points[idx],
      totalPoints: 0,
      dailyPoints: 0,
      tasksCompleted: 0,
    };

    this.childrenPoints.set([...points]);
    this.savePointsToStorage();

    // Salva nella cronologia
    const history = this.redemptionHistory();
    this.redemptionHistory.set([record, ...history]);
    this.saveRedemptionHistory();
  }

  // ─── Storage helpers ────────────────────────────────────────────────────

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

  private saveRedemptionHistory(): void {
    try {
      localStorage.setItem(this.REDEMPTION_HISTORY_KEY, JSON.stringify(this.redemptionHistory()));
    } catch { /* ignore */ }
  }

  private loadRedemptionHistory(): void {
    try {
      const saved = localStorage.getItem(this.REDEMPTION_HISTORY_KEY);
      if (saved) this.redemptionHistory.set(JSON.parse(saved) as RedemptionRecord[]);
    } catch { /* ignore */ }
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