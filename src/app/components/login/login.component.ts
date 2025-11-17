import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonModal
} from '@ionic/angular/standalone';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { KidProfileService } from '../../services/kid-profile.service';
import { KidAvatar } from '../../models/avatar.models';
import { AuthService } from '../../common/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    AvatarSelectorComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @ViewChild('avatarModal', { static: false }) avatarModal!: IonModal;
  
  email = '';
  password = '';
  
  showAvatarSelector = false;
  selectedKidName: string | null = null;
  
  // Lista bambini predefiniti (può venire da un servizio)
  kidsNames = ['Giulia', 'Marco', 'Sofia', 'Luca', 'Emma', 'Alessandro'];

  constructor(
    private router: Router,
    private kidProfileService: KidProfileService,
    private authService: AuthService = inject(AuthService)
  ) { }

  ngOnInit() {
    console.log('🔄 Login Component ngOnInit - URL attuale:', this.router.url);
  }

  async loginParent() {
    if (this.email && this.password) {
      // Logout completo da eventuali profili bambini attivi
      console.log('🚪 Logout profili bambini...');
      this.kidProfileService.logout();
      
      // Reset anche dello stato del componente
      this.selectedKidName = null;
      this.showAvatarSelector = false;
      
      // Salva un token fittizio per l'autenticazione (modalità mock)
      await this.authService.setToken('mock-parent-token');
      console.log('🔑 Token di autenticazione salvato');
      
      // Naviga al setup famiglia invece che direttamente alla home
      setTimeout(() => {
        this.router.navigate(['/family-setup']);
      }, 800);
    } else {
      alert('📧 Inserisci email e password!');
    }
  }

  // quando l'utente tocca un nome bambino
  startKidLogin(kidName: string) {
    console.log('👆 Cliccato su:', kidName);
    this.selectedKidName = kidName;
    
    // Prima pulisci qualsiasi tema esistente
    console.log('🧹 Pulendo tema precedente...');
    this.kidProfileService.clearKidTheme();
    
    // SEMPRE mostra la selezione avatar (per permettere di cambiare)
    console.log('🎨 Aprendo selezione avatar per:', kidName);
    this.showAvatarSelector = true;
    
    // Debug: controlla se il modal è disponibile
    setTimeout(() => {
      console.log('🔍 Modal disponibile?', !!this.avatarModal);
      console.log('🔍 showAvatarSelector:', this.showAvatarSelector);
    }, 100);
    
    /* 
    // Logica originale per controllare profili esistenti (commentata per test)
    const savedProfiles = this.kidProfileService.getSavedProfiles()();
    const existingProfile = savedProfiles.find(p => p.name === kidName);
    
    if (existingProfile) {
      // Ha già un avatar, effettua il login diretto
      console.log('👦 Profilo esistente trovato per:', kidName);
      this.completeKidLogin(existingProfile.selectedAvatar);
    } else {
      // Non ha un avatar, mostra la selezione
      console.log('🎨 Nessun profilo trovato, aprendo selezione avatar per:', kidName);
      this.showAvatarSelector = true;
    }
    */
  }

  // chiamato dal figlio <app-avatar-selector> quando preme "Iniziamo!"
  async onAvatarSelected(avatar: any) {
    console.log('🎯 Avatar selezionato:', avatar);
    
    try {
      // 1) crea profilo + attiva
      if (this.selectedKidName) {
        console.log('📝 Creando profilo per:', this.selectedKidName);
        const profile = this.kidProfileService.selectAvatarForKid(this.selectedKidName, avatar);
        console.log('✅ Profilo creato:', profile);
        
        console.log('🎨 Attivando tema per:', profile.name);
        this.kidProfileService.activateKidProfile(profile);
        console.log('✨ Tema attivato!');
      }
      
      // 2) chiudi il modal
      console.log('🚪 Chiudendo modal...');
      if (this.avatarModal) {
        await this.avatarModal.dismiss({ reason: 'confirm', avatar }, 'confirm');
      }
    } catch (error) {
      console.error('❌ Errore durante selezione avatar:', error);
    }
  }

  // chiamato dal figlio quando preme "Indietro"
  async onAvatarCancelled() {
    console.log('↩️ Cancellazione avatar...');
    try {
      if (this.avatarModal) {
        await this.avatarModal.dismiss({ reason: 'cancel' }, 'cancel');
      }
    } catch (error) {
      console.error('❌ Errore durante cancellazione:', error);
    }
  }

  // il punto UNICO in cui resetti lo stato e navighi
  async onAvatarDidDismiss(ev: CustomEvent) {
    console.log('🔄 Modal didDismiss chiamato:', ev.detail);
    
    // Reset stato
    this.showAvatarSelector = false;
    this.selectedKidName = null;

    const role = (ev as any).detail?.role;
    const data = (ev as any).detail?.data;

    console.log('📊 Role:', role, 'Data:', data);

    if (role === 'confirm') {
      // Modal chiuso con conferma - salva token per bambini e naviga alla home
      console.log('🔑 Salvando token per bambino...');
      await this.authService.setToken('mock-kid-token');
      
      console.log('🏠 Navigando alla home...');
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 100);
    } else {
      console.log('❌ Modal chiuso senza conferma');
    }
  }



  private async completeKidLogin(avatar: KidAvatar) {
    if (this.selectedKidName) {
      console.log('🚀 Completando login per:', this.selectedKidName, avatar.name);
      
      // Crea/aggiorna il profilo bambino
      const profile = this.kidProfileService.selectAvatarForKid(this.selectedKidName, avatar);
      console.log('👦 Profilo creato:', profile);
      
      // Attiva il profilo
      const activeProfile = this.kidProfileService.activateKidProfile(profile);
      console.log('✅ Profilo attivato:', activeProfile);
      
      // Naviga direttamente (senza modal da chiudere)
      console.log('🏠 Navigazione diretta alla home...');
      this.router.navigate(['/home']);
    }
  }

}
