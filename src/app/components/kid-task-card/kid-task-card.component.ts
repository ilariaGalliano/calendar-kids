import { Component, Input, ViewEncapsulation } from '@angular/core';
import { IonItem, IonLabel, IonBadge, IonIcon, IonCheckbox } from '@ionic/angular/standalone';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { KidTask } from '../../models/task.models';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-kid-task-card',
  standalone: true,
  imports: [IonItem, IonLabel, IonBadge, CdkDrag, DatePipe, IonIcon, IonCheckbox, FormsModule],
  templateUrl: './kid-task-card.component.html',
  styleUrls: ['./kid-task-card.component.css']
})
export class KidTaskCardComponent {
  @Input() task!: KidTask;

  onDoneChange() {
    if (this.task.done) {
      const audio = new Audio('assets/sounds/done.mp3');
      audio.play().catch(err => console.warn('Audio play failed:', err));
    }
  }
}
