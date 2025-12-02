import { Component, EventEmitter, Input, Output, ViewEncapsulation, ElementRef, inject } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { IonItem, IonLabel, IonBadge, IonIcon, IonCheckbox} from '@ionic/angular/standalone';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KidTask } from 'src/app/models/kid.models';
import { RewardsService } from '../../services/rewards.service';

@Component({
  selector: 'app-kid-task-card',
  standalone: true,
  imports: [IonItem, IonLabel, IonBadge, DatePipe, CommonModule, IonIcon, IonCheckbox, FormsModule],
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
export class KidTaskCardComponent {
  private timerInterval: any = null;
  // Timer control: start/stop and update timerValue
  toggleTimer() {
    this.timerActive = !this.timerActive;
    if (this.timerActive) {
      this.timerInterval = setInterval(() => {
        this.timerValue++;
      }, 1000);
    } else {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }
  @Input() task!: KidTask;
  @Output() doneChange = new EventEmitter<{ instanceId: string; done: boolean }>();
  showFlyingPoints: boolean = false;

  // Timer properties for each activity
  timerActive: boolean = false;
  timerValue: number = 0; // seconds elapsed or remaining

  private rewardsService = inject(RewardsService);
  private elementRef = inject(ElementRef);

  onDoneChange() {
    this.doneChange.emit({ instanceId: this.task.instanceId, done: this.task.done });
    
    // Gestisci i punti ricompensa
    const taskData = this.task as any;
    const childId = taskData.childId;
    const childName = taskData.childName || 'Bambino';
    
    if (this.task.done) {
      // Aggiungi punti quando l'attività viene completata
      this.rewardsService.addPointsForTask(childId, childName, this.elementRef.nativeElement);
      
      // Suono di completamento
      new Audio('assets/sounds/done.mp3').play().catch(() => {});
      this.showFlyingPoints = true;
    } else {
      // Rimuovi punti quando l'attività viene decompletata
      this.rewardsService.removePointsForTask(childId);
    }
  }
}