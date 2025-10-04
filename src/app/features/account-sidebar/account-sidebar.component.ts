import { Component, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonButton, IonIcon, IonList, IonItem, IonLabel, 
  IonAvatar, IonHeader, IonTitle, IonContent 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/common/auth.service';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'parent' | 'child';
}

@Component({
  selector: 'app-account-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    IonButton, IonIcon, IonList, IonItem, IonLabel, 
    IonAvatar, IonContent
  ],
  templateUrl: './account-sidebar.component.html',
  styleUrls: ['./account-sidebar.component.scss']
})
export class AccountSidebarComponent implements OnInit {
  @Output() closeSidebar = new EventEmitter<void>();

  currentUser = signal<UserProfile | null>(null);
  familyProfiles = signal<UserProfile[]>([]);
  selectedProfile = signal<UserProfile | null>(null);

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadFamilyProfiles();
  }

  private loadUserData() {
    // Carica dati utente corrente
    // this.currentUser.set(this.auth.getCurrentUser());
    
    // Mock per sviluppo
    this.currentUser.set({
      id: '1',
      name: 'Mario Rossi',
      email: 'mario@example.com',
      role: 'parent'
    });
  }

  private loadFamilyProfiles() {
    // Carica profili famiglia
    // this.auth.getFamilyProfiles().subscribe(profiles => {
    //   this.familyProfiles.set(profiles);
    // });

    // Mock per sviluppo
    this.familyProfiles.set([
      {
        id: '2',
        name: 'Lucia Rossi',
        email: 'lucia@example.com',
        role: 'parent'
      },
      {
        id: '3',
        name: 'Giulia',
        // avatar: 'assets/avatars/girl.png',
        email: '',
        role: 'child'
      },
      {
        id: '4',
        name: 'Marco',
        // avatar: 'assets/avatars/boy.png',
        email: '',
        role: 'child'
      }
    ]);
  }

  addProfile() {

  }

  selectProfile(profile: UserProfile) {
    this.selectedProfile.set(profile);
    // Potresti voler salvare la selezione o fare altre azioni
    console.log('Profilo selezionato:', profile);
  }

 logout() {
    // this.auth.logout();
    this.router.navigate(['/login']);
    // Non serve più emettere closeSidebar
  }

  goToSettings() {
    this.router.navigate(['/settings']);
    // Non serve più emettere closeSidebar
  }
}