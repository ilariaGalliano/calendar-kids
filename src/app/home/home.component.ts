// import { Component, signal, computed } from '@angular/core';
// import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
// import { CalendarBoardComponent } from '../components/calendar-board/calendar-board.component';
// import { ParentPanelComponent } from '../components/parent-panel/parent-panel.component';
// import { SchedulerService } from '../services/scheduler.service';


// @Component({
//   standalone: true,
//   selector: 'app-home',
//   imports: [IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, CalendarBoardComponent, ParentPanelComponent],
//   template: `
// <ion-page>
//   <ion-header><ion-toolbar><ion-title>CalendarKidsApp Demo</ion-title></ion-toolbar></ion-header>
//   <ion-content class="ion-padding">
//     <ion-grid fixed>
//       <ion-row>
//         <ion-col size="12" sizeLg="8">
//           <calendar-board [days]="days()" [tasksByDay]="tasksByDay()"></calendar-board>
//         </ion-col>
//         <ion-col size="12" sizeLg="4">
//           <parent-panel></parent-panel>
//         </ion-col>
//       </ion-row>
//     </ion-grid>
//   </ion-content>
// </ion-page>
//   `
// })
// export class HomeComponent {
//   today = new Date();
//   days = signal<string[]>(Array.from({length:7}, (_,i)=>{
//     const d = new Date(this.today); d.setDate(d.getDate()+i);
//     return d.toISOString().slice(0,10);
//   }));

//   constructor(private sched: SchedulerService) {}

//   tasksByDay = computed(() => {
//     const out: Record<string, any[]> = {};
//     for (const d of this.days()) out[d] = this.sched.tasksForDay(d);
//     return out;
//   });
// }

// src/app/pages/home.component.ts
import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { CalendarBoardComponent } from '../components/calendar-board/calendar-board.component';
import { ParentPanelComponent } from '../components/parent-panel/parent-panel.component';
import { SchedulerService } from '../services/scheduler.service';
import { Preferences } from '@capacitor/preferences';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonSpinner, IonButton,
    CalendarBoardComponent, ParentPanelComponent, DatePipe
  ],
  template: `
<ion-page>
  <ion-header>
    <ion-toolbar>
      <ion-title>CalendarKidsApp</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-grid fixed>
      <ion-row class="ion-margin-bottom">
        <ion-col size="12">
          <div class="ion-text-end">
            <ion-button size="small" (click)="reload()">Ricarica</ion-button>
          </div>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12" sizeLg="8">
          <calendar-board [days]="days()" [tasksByDay]="tasksByDay()"></calendar-board>
          <div *ngIf="loading()" class="ion-text-center ion-padding">
            <ion-spinner></ion-spinner>
          </div>
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
export class HomeComponent implements OnInit {
  private householdId: string | null = null;

  today = new Date();
  days = signal<string[]>(Array.from({length:7}, (_,i)=>{
    const d = new Date(this.today); d.setDate(d.getDate()+i);
    return d.toISOString().slice(0,10);
  }));

  loading = signal<boolean>(false);

  constructor(private sched: SchedulerService) {}

  tasksByDay = computed(() => {
    const out: Record<string, any[]> = {};
    for (const d of this.days()) out[d] = this.sched.tasksForDay(d);
    return out;
  });

  async ngOnInit() {
    // householdId salvato dopo register/login (Preferences)
    const { value } = await Preferences.get({ key: 'householdId' });
    this.householdId = value;

    // fallback (solo dev): se usi il seed del mock e vuoi hardcodare
    // this.householdId ||= 'SEED-HH-ID';

    this.reload(); // carica al mount
  }

  reload() {
    if (!this.householdId) {
      console.warn('Nessun householdId. Esegui register/login e salva householdId in Preferences.');
      return;
    }
    const from = this.days()[0];
    const to   = this.days()[this.days().length - 1];
    this.loading.set(true);
    const sub = this.sched.loadRange(this.householdId, from, to);
    // gestisci end (subscribe ritorna Subscription)
    // qui usiamo una micro-coda: spegni loading quando arrivano i dati
    setTimeout(()=> this.loading.set(false), 150); // semplice, opzionale
  }
}

