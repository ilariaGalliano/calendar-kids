import { Component, signal, computed } from '@angular/core';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { SchedulerService } from './services/scheduler.service';
import { CalendarBoardComponent } from './components/calendar-board/calendar-board.component';
import { ParentPanelComponent } from './components/parent-panel/parent-panel.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, CalendarBoardComponent, ParentPanelComponent],
  template: `
<ion-page>
  <ion-header><ion-toolbar><ion-title>CalendarKidsApp Demo</ion-title></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-grid fixed>
      <ion-row>
        <ion-col size="12" sizeLg="8">
          <calendar-board [days]="days()" [tasksByDay]="tasksByDay()"></calendar-board>
        </ion-col>
        <ion-col size="12" sizeLg="4">
          <parent-panel></parent-panel>
        </ion-col>
      </ion-row>
    </ion-grid>
  </ion-content>
</ion-page>
  `
})
export class HomeComponent {
  today = new Date();
  days = signal<string[]>(Array.from({length:7}, (_,i)=>{
    const d = new Date(this.today); d.setDate(d.getDate()+i);
    return d.toISOString().slice(0,10);
  }));

  constructor(private sched: SchedulerService) {}

  tasksByDay = computed(() => {
    const out: Record<string, any[]> = {};
    for (const d of this.days()) out[d] = this.sched.tasksForDay(d);
    return out;
  });
}
