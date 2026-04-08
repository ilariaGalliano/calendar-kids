import { Component, EventEmitter, Input, Output, ViewEncapsulation, ElementRef, inject, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { IonItem, IonLabel, IonBadge, IonIcon, IonCheckbox} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KidTask } from 'src/app/models/kid.models';
import { RewardsService } from '../../services/rewards.service';
import { LocalTimePipe } from '../../pipes/local-time.pipe';
import { addIcons } from 'ionicons';
import { playCircleOutline, pauseCircleOutline, refreshCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-kid-task-card',
  standalone: true,
  imports: [IonItem, IonLabel, IonBadge, IonIcon, CommonModule, IonCheckbox, FormsModule, LocalTimePipe],
  templateUrl: './kid-task-card.component.html',
  styleUrls: ['./kid-task-card.component.scss'],
  animations: [
    trigger('flyPoints', [
      state('void', style({ opacity: 0, transform: 'translateY(0)' })),
      state('*', style({ opacity: 1, transform: 'translateY(-30px)' })),
      transition('void => *', [
        animate('600ms cubic-bezier(.42,1.5,.58,1)')
      ]),
      transition('* => void', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-60px)' }))
      ])
    ])
  ]
})
export class KidTaskCardComponent implements OnDestroy {
  @Input() task!: KidTask;
  @Output() doneChange = new EventEmitter<{ instanceId: string; done: boolean }>();
  showFlyingPoints: boolean = false;

  // ── Timer state ────────────────────────────────────────────────────────────
  timerActive = false;
  timerFinished = false;
  remainingSeconds = 0;
  private timerInterval: any = null;
  private totalSeconds = 0;

  /** SVG ring: r=24 → circumference = 2π*24 ≈ 150.8 */
  readonly CIRCUMFERENCE = 150.8;

  get timerDurationMinutes(): number {
    return (this.task as any).timer ?? this.task.duration ?? 0;
  }

  get hasTimer(): boolean {
    return this.timerDurationMinutes > 0;
  }

  get timerPercent(): number {
    if (this.totalSeconds === 0) return 100;
    return Math.max(0, (this.remainingSeconds / this.totalSeconds) * 100);
  }

  get strokeDashoffset(): number {
    return this.CIRCUMFERENCE * (1 - this.timerPercent / 100);
  }

  get timerDisplay(): string {
    const s = Math.max(0, this.remainingSeconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  get timerState(): 'idle' | 'running' | 'paused' | 'warning' | 'finished' {
    if (this.timerFinished) return 'finished';
    if (!this.timerActive && this.totalSeconds > 0 && this.remainingSeconds < this.totalSeconds) return 'paused';
    if (this.timerActive && this.timerPercent <= 20) return 'warning';
    if (this.timerActive) return 'running';
    return 'idle';
  }

  get timerColor(): string {
    switch (this.timerState) {
      case 'finished': return '#ef4444';
      case 'warning':  return '#f97316';
      case 'running':  return this.task.color || '#4ECDC4';
      case 'paused':   return '#94a3b8';
      default:         return '#cbd5e1';
    }
  }

  toggleTimer() {
    if (this.timerFinished) {
      this.resetTimer();
      return;
    }

    if (!this.timerActive) {
      // First start: init countdown
      if (this.totalSeconds === 0) {
        this.totalSeconds = this.timerDurationMinutes * 60;
        this.remainingSeconds = this.totalSeconds;
      }
      this.timerActive = true;
      this.timerInterval = setInterval(() => {
        this.remainingSeconds--;
        if (this.remainingSeconds <= 0) {
          this.remainingSeconds = 0;
          this.onTimerFinished();
        }
      }, 1000);
    } else {
      // Pause
      this.timerActive = false;
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.timerActive = false;
    this.timerFinished = false;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
  }

  private onTimerFinished() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.timerActive = false;
    this.timerFinished = true;

    // Synthesise a short alarm beep using Web Audio API (no extra asset needed)
    this.playAlarmBeep();

    // Browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`⏰ ${this.task.title}`, {
        body: 'Il tempo è scaduto!',
        icon: 'assets/icon/favicon.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  private playAlarmBeep() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx() as AudioContext;

      // Three short beeps: 880 Hz → 1100 Hz → 880 Hz
      const beepTimes = [0, 0.28, 0.56];
      beepTimes.forEach(startAt => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + startAt);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + startAt + 0.1);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + 0.22);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + 0.22);
      });
    } catch (_) { /* AudioContext not supported — silently skip */ }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  constructor() {
    addIcons({ playCircleOutline, pauseCircleOutline, refreshCircleOutline });
  }

  // ── Task completion ────────────────────────────────────────────────────────

  private rewardsService = inject(RewardsService);
  private elementRef = inject(ElementRef);

  onDoneChange() {
    this.doneChange.emit({ instanceId: this.task.instanceId, done: this.task.done });
    
    const taskData = this.task as any;
    const childId = taskData.childId;
    const childName = taskData.childName || 'Bambino';
    
    if (this.task.done) {
      this.rewardsService.addPointsForTask(childId, childName, this.elementRef.nativeElement);
      new Audio('assets/sounds/done.mp3').play().catch(() => {});
      this.showFlyingPoints = true;
    } else {
      this.rewardsService.removePointsForTask(childId);
    }
  }
}