import { Injectable, signal } from '@angular/core';
import { KidProfile, KidAvatar, PREDEFINED_AVATARS } from '../models/avatar.models';

@Injectable({
  providedIn: 'root'
})
export class KidProfileService {
  // Signal per il profilo bambino attivo
  private activeKidProfile = signal<KidProfile | null>(null);
  
  // Signal per i profili salvati
  private savedProfiles = signal<KidProfile[]>([]);

  constructor() {
    this.loadSavedProfiles();
  }

  // Getter per il profilo attivo (readonly)
  getActiveKidProfile() {
    return this.activeKidProfile.asReadonly();
  }

  // Getter per i profili salvati (readonly)
  getSavedProfiles() {
    return this.savedProfiles.asReadonly();
  }

  // Getter per gli avatar disponibili
  getAvailableAvatars(): KidAvatar[] {
    return PREDEFINED_AVATARS;
  }

  // Seleziona un avatar per un bambino (crea o aggiorna profilo)
  selectAvatarForKid(kidName: string, avatar: KidAvatar): KidProfile {
    // Cerca se esiste già un profilo per questo bambino
    const existingProfiles = this.savedProfiles();
    const existingProfile = existingProfiles.find(p => p.name === kidName);

    let profile: KidProfile;

    if (existingProfile) {
      // Aggiorna avatar esistente
      profile = {
        ...existingProfile,
        selectedAvatar: avatar
      };
      
      // Aggiorna nella lista
      const updatedProfiles = existingProfiles.map(p => 
        p.id === profile.id ? profile : p
      );
      this.savedProfiles.set(updatedProfiles);
    } else {
      // Crea nuovo profilo
      profile = {
        id: this.generateId(),
        name: kidName,
        selectedAvatar: avatar,
        isActive: false
      };
      
      // Aggiungi alla lista
      this.savedProfiles.set([...existingProfiles, profile]);
    }

    // Salva in localStorage
    this.saveTolocalStorage();
    
    return profile;
  }

  // Attiva un profilo bambino
  activateKidProfile(profile: KidProfile) {
    // Disattiva tutti gli altri profili
    const updatedProfiles = this.savedProfiles().map(p => ({
      ...p,
      isActive: p.id === profile.id
    }));
    
    this.savedProfiles.set(updatedProfiles);
    
    // Imposta come profilo attivo
    const activeProfile = { ...profile, isActive: true };
    this.activeKidProfile.set(activeProfile);
    
    // Salva in localStorage
    this.saveTolocalStorage();
    
    // Applica il tema del bambino
    this.applyKidTheme(activeProfile.selectedAvatar);
    
    return activeProfile;
  }

  // Applica il tema CSS del bambino selezionato
  private applyKidTheme(avatar: KidAvatar) {
    console.log('🎨 Applicando tema per avatar:', avatar.name, avatar.palette.name);
    
    const root = document.documentElement;
    const palette = avatar.palette;
    
    // Prima pulisci tutto
    this.clearKidTheme();
    
    // Poi applica il nuovo tema
    root.style.setProperty('--kid-primary', palette.primary);
    root.style.setProperty('--kid-secondary', palette.secondary);
    root.style.setProperty('--kid-accent', palette.accent);
    root.style.setProperty('--kid-background', palette.background);
    root.style.setProperty('--kid-surface', palette.surface);
    root.style.setProperty('--kid-text', palette.text);
    root.style.setProperty('--kid-gradient', palette.gradient);
    root.style.setProperty('--kid-shadow', palette.shadow);
    
    // Aggiorna anche le variabili esistenti per compatibilità
    root.style.setProperty('--kids-primary', palette.accent);
    root.style.setProperty('--ion-color-primary', palette.accent);
    root.style.setProperty('--kids-bg-gradient', palette.gradient);
    root.style.setProperty('--kids-card-shadow', `0 8px 25px ${palette.shadow}`);
    
    // Variabili per il calendario e componenti
    root.style.setProperty('--primary-color', palette.primary);
    root.style.setProperty('--secondary-color', palette.secondary);
    root.style.setProperty('--accent-color', palette.accent);
    
    console.log('✅ Tema applicato:', palette.name);
  }

  // Rimuovi tema personalizzato (ritorna ai colori di default) - pubblico
  clearKidTheme() {
    console.log('🧹 Pulendo tema esistente...');
    
    const root = document.documentElement;
    
    // Rimuovi TUTTE le variabili custom
    root.style.removeProperty('--kid-primary');
    root.style.removeProperty('--kid-secondary');
    root.style.removeProperty('--kid-accent');
    root.style.removeProperty('--kid-background');
    root.style.removeProperty('--kid-surface');
    root.style.removeProperty('--kid-text');
    root.style.removeProperty('--kid-gradient');
    root.style.removeProperty('--kid-shadow');
    
    // Rimuovi anche le variabili di compatibilità
    root.style.removeProperty('--kids-primary');
    root.style.removeProperty('--kids-bg-gradient');
    root.style.removeProperty('--kids-card-shadow');
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--secondary-color');
    root.style.removeProperty('--accent-color');
    
    // Ripristina valori di default
    root.style.setProperty('--ion-color-primary', '#6C8CFF');
    
    console.log('✅ Tema pulito');
  }

  // Logout - pulisce il profilo attivo
  logout() {
    console.log('🚪 LOGOUT: Pulendo profilo attivo e tema...');
    
    // Pulisci profilo attivo
    this.activeKidProfile.set(null);
    
    // Pulisci tema
    this.clearKidTheme();
    
    // Aggiorna tutti i profili come non attivi
    const updatedProfiles = this.savedProfiles().map(p => ({
      ...p,
      isActive: false
    }));
    this.savedProfiles.set(updatedProfiles);
    this.saveTolocalStorage();
    
    console.log('✅ LOGOUT completato');
  }

  // Carica profili salvati da localStorage
  private loadSavedProfiles() {
    try {
      const saved = localStorage.getItem('kidProfiles');
      if (saved) {
        const profiles: KidProfile[] = JSON.parse(saved);
        this.savedProfiles.set(profiles);
        
        // Trova e ripristina il profilo attivo
        const activeProfile = profiles.find(p => p.isActive);
        if (activeProfile) {
          this.activeKidProfile.set(activeProfile);
          this.applyKidTheme(activeProfile.selectedAvatar);
        }
      }
    } catch (error) {
      console.error('Errore caricamento profili bambini:', error);
    }
  }

  // Salva profili in localStorage
  private saveTolocalStorage() {
    try {
      localStorage.setItem('kidProfiles', JSON.stringify(this.savedProfiles()));
    } catch (error) {
      console.error('Errore salvataggio profili bambini:', error);
    }
  }

  // Genera ID unico
  private generateId(): string {
    return 'kid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Metodo per ottenere i task filtrati per il bambino attivo
  getTasksForActiveKid(allTasks: any[]): any[] {
    const activeProfile = this.activeKidProfile();
    if (!activeProfile || !allTasks?.length) {
      return [];
    }

    // Filtra i task per l'ID del profilo attivo
    // Assuming tasks have assigneeProfileId field
    return allTasks.filter(task => 
      task.assigneeProfileId === activeProfile.id ||
      task.assigneeProfile?.id === activeProfile.id
    );
  }
}