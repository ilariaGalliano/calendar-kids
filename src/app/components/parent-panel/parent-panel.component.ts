// import { Component, signal } from '@angular/core';
// import { IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonDatetime } from '@ionic/angular/standalone';
// import { FormsModule } from '@angular/forms';
// import { SchedulerService } from '../../services/scheduler.service';
// import { ReminderService } from '../../services/reminder.service';
// import { KidTask } from '../../models/task.models';

// @Component({
//   selector: 'parent-panel',
//   standalone: true,
//   imports: [FormsModule, IonList, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonDatetime],
//   templateUrl: './parent-panel.component.html',
//   styleUrls: ['./parent-panel.component.css']
// })
// export class ParentPanelComponent {
//   title = signal('Compito');
//   color = signal('#5b8def');
//   startISO = signal(new Date().toISOString());
//   endISO = signal(new Date(Date.now()+60*60*1000).toISOString());
//   repeat = signal<'none'|'daily'|'weekly'>('none');
//   reminders = signal<number[]>([10]);

//   constructor(private sched: SchedulerService, private rem: ReminderService) {}

//   add() {
//     const t: KidTask = {
//       id: crypto.randomUUID(),
//       kidId: 'kid-default',
//       title: this.title(),
//       color: this.color(),
//       start: this.startISO(),
//       end: this.endISO(),
//       repeat: this.repeat(),
//       reminders: this.reminders()
//     };
//     this.sched.upsert(t);

//     const start = new Date(t.start);
//     for (const min of t.reminders || []) {
//       const at = new Date(start.getTime() - min*60*1000);
//       if (at > new Date()) { this.rem.schedule(t.title, 'Tra ' + min + ' min', at); }
//     }
//   }
// }
