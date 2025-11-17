import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonButton, IonIcon, IonSp  selectChild(childId: string | null) {
    if (childId === null) {
      this.selectedChild.set(null);
    } else {
      const family = this.activeFamily();
      if (family) {
        const child = family.children.find((c: Child) => c.id === childId);
        this.selectedChild.set(child || null);
      }
    }
  }

  getTasksForDay(day: string): TaskInstance[] {
    const tasks = this.tasksByDay();
    return tasks[day] || [];
  }ext
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

// Services
import { CalendarService } from '../services/calendar.service';
import { FamilyService } from '../services/family.service';

// Components  
import { AccountSidebarComponent } from '../features/account-sidebar/account-sidebar.component';

import { AlertController } from '@ionic/angular';

// Types
import { Family, Child } from '../models/family.models';

interface TaskInstance {
  id: string;
  instanceId: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  done: boolean;
  childId?: string;
  childName?: string;
  color: string;
}

interface DayTasks {
  [day: string]: TaskInstance[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    // Common
    CommonModule,
    
    // Ionic
    IonContent, IonButton, IonIcon, IonSpinner, IonText,
    
    // Custom Components
    AccountSidebarComponent
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private calendarService = inject(CalendarService);
  private familyService = inject(FamilyService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  // Family state
  activeFamily = this.familyService.currentFamily;
  selectedChild = signal<Child | null>(null);

  // Calendar state
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  tasksByDay = signal<DayTasks>({});
  hasTasks = computed(() => {
    const tasks = this.tasksByDay();
    return Object.values(tasks).some(dayTasks => dayTasks.length > 0);
  });

  // UI state
  sidebarExpanded = signal<boolean>(false);

  // Calendar data
  days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  ngOnInit() {
    this.loadFamily();
    this.loadTasks();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private async loadFamily() {
    try {
      const family = this.familyService.getCurrentFamily();
      if (!family) {
        this.goToLogin();
        return;
      }
      this.loading.set(false);
    } catch (err) {
      this.error.set('Errore nel caricamento della famiglia');
      this.loading.set(false);
    }
  }

  private async loadTasks() {
    try {
      this.loading.set(true);
      
      const family = this.activeFamily();
      if (!family) {
        this.tasksByDay.set({});
        this.loading.set(false);
        return;
      }

      // Generate tasks for the current week
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      
      const weekTasks: DayTasks = {};
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const dayName = this.days[i];
        
        weekTasks[dayName] = this.generateMockTasksForDate(currentDate, family);
      }

      this.tasksByDay.set(weekTasks);
      this.loading.set(false);
    } catch (err) {
      this.error.set('Errore nel caricamento delle attività');
      this.loading.set(false);
    }
  }

  private generateMockTasksForDate(date: Date, family: Family): TaskInstance[] {
    const tasks: TaskInstance[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A'];
    
    family.children.forEach((child: Child, childIndex: number) => {
      // Generate 1-3 random tasks per child per day
      const numTasks = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numTasks; i++) {
        const hour = Math.floor(Math.random() * 12) + 8; // Between 8 AM and 8 PM
        const duration = Math.floor(Math.random() * 2) + 1; // 1-2 hours
        
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        
        const end = new Date(start);
        end.setHours(start.getHours() + duration);
        
        const activities = [
          'Compiti di matematica',
          'Allenamento calcio',
          'Lezione di musica',
          'Compiti di italiano',
          'Gioco libero',
          'Merenda',
          'Lettura',
          'Disegno',
          'Inglese',
          'Nuoto'
        ];
        
        const taskId = `${child.id}-${date.getTime()}-${i}`;
        
        tasks.push({
          id: taskId,
          instanceId: taskId,
          title: activities[Math.floor(Math.random() * activities.length)],
          start,
          end,
          description: `Attività per ${child.name}`,
          done: Math.random() > 0.7, // 30% chance of being completed
          childId: child.id,
          childName: child.name,
          color: colors[childIndex % colors.length]
        });
      }
    });

    return tasks.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  selectChild(childId: string | null) {
    if (childId === null) {
      this.selectedChild.set(null);
    } else {
      const family = this.activeFamily();
      if (family) {
        const child = family.children.find(c => c.id === childId);
        this.selectedChild.set(child || null);
      }
    }
  }

  toggleSidebar() {
    this.sidebarExpanded.update(expanded => !expanded);
  }

  closeSidebar() {
    this.sidebarExpanded.set(false);
  }

  onTaskDone(event: { instanceId: string; done: boolean }) {
    const currentTasks = this.tasksByDay();
    const updatedTasks = { ...currentTasks };
    
    // Find and update the task
    Object.keys(updatedTasks).forEach(day => {
      const dayTasks = updatedTasks[day];
      const taskIndex = dayTasks.findIndex(t => t.instanceId === event.instanceId);
      if (taskIndex !== -1) {
        dayTasks[taskIndex] = { ...dayTasks[taskIndex], done: event.done };
      }
    });
    
    this.tasksByDay.set(updatedTasks);
  }

  reload() {
    this.error.set(null);
    this.loadTasks();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Sei sicuro di voler disconnettere la famiglia?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            this.familyService.clearFamily();
            this.goToLogin();
          }
        }
      ]
    });

    await alert.present();
  }
}