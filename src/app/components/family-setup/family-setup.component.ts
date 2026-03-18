import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonRange,
  IonLabel,
  IonText,
  IonBackButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  AlertController,
  IonAlert
} from '@ionic/angular/standalone';
import { Family, Child } from 'src/app/models/family.models';
import { FamilyService } from 'src/app/services/family.service';
import { supabase } from 'src/app/core/supabase.client';


interface ChildForm {
  id: string;
  name: string;
  isValid: boolean;
  sex: string;
}

@Component({
  selector: 'app-family-setup',
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
    IonRange,
    IonLabel,
    IonText,
    IonBackButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonAlert
  ],
  templateUrl: './family-setup.component.html',
  styleUrls: ['./family-setup.component.scss'],
})
export class FamilySetupComponent implements OnInit {
  private router = inject(Router);
  private familyService = inject(FamilyService);
  private alertController = inject(AlertController);

  // Stato del componente
  step = signal<'welcome' | 'select-count' | 'enter-names' | 'review'>('welcome');
  parentName = signal<string>('');
  numberOfChildren = signal<number>(2);
  childrenForms = signal<ChildForm[]>([]);
  
  // Stato UI
  isLoading = signal<boolean>(false);
  showAlert = signal<boolean>(false);
  alertMessage = signal<string>('');

  // Famiglia esistente
  existingFamily = signal<Family | null>(null);
  
  // Computed properties
  canProceedToNames = computed(() => this.numberOfChildren() > 0 && this.numberOfChildren() <= 6);
  allNamesValid = computed(() => {
    const forms = this.childrenForms();
    return forms.length > 0 && forms.every(form => form.name.trim().length >= 2);
  });

  // Suggerimenti nomi per aiutare i genitori
  suggestedNames = {
    boys: ['Luca', 'Marco', 'Alessandro', 'Matteo', 'Lorenzo', 'Andrea', 'Gabriele', 'Riccardo'],
    girls: ['Giulia', 'Francesca', 'Sofia', 'Martina', 'Giorgia', 'Sara', 'Emma', 'Alice'],
    neutral: ['Alex', 'Sasha', 'Andrea', 'Nicola']
  };

  ngOnInit() {
    this.loadParentEmail();
    this.loadChildrenFromAPI();
  }

  private async loadParentEmail() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.email) {
      const email = data.session.user.email || '';
      const name = email.split('@')[0];
      this.parentName.set(name);
    }
  }

  private loadChildrenFromAPI() {
    this.familyService.fetchChildrenForCurrentUser().subscribe({
      next: (children) => {
        console.log('👶 Children from API:', children);
        if (children && children.length > 0) {
          // Se ci sono già bambini, vai direttamente a family-picker con i dati
          console.log('✅ Bambini già presenti, reindirizzamento a family-picker');
          this.router.navigate(['/family-profile-picker'], {
            state: {
              parentName: this.parentName(),
              children: children
            }
          });
        } else {
          // Nessun bambino, inizia il setup
          this.step.set('welcome');
        }
      },
      error: (err) => {
        console.error('❌ Error fetching children:', err);
        this.step.set('welcome');
      }
    });
  }

  private setupChildrenForms(children: Child[]) {
    const forms = children.map((child: Child) => ({
      id: child.id,
      name: child.name,
      isValid: true,
      sex: child.sex
    }));
    this.childrenForms.set(forms);
  }

  // Step 1: Welcome -> raccoglie nome genitore
  startFamilySetup() {
    const name = this.parentName().trim();
    if (name.length < 2) {
      this.showAlertMessage('Inserisci il tuo nome (almeno 2 caratteri)');
      return;
    }
    this.step.set('select-count');
  }

  // Step 2: Select count -> scegli numero bambini
  proceedToNamesEntry() {
    if (!this.canProceedToNames()) {
      this.showAlertMessage('Scegli tra 1 e 6 bambini');
      return;
    }

    // Inizializza i form per i bambini (ID temporaneo, il DB genererà l'UUID)
    const forms: ChildForm[] = [];
    for (let i = 0; i < this.numberOfChildren(); i++) {
      forms.push({
        id: `temp-${i}`, // ID temporaneo solo per il form, DB genererà UUID
        name: '',
        sex: 'male', 
        isValid: false
      });
    }
    this.childrenForms.set(forms);
    this.step.set('enter-names');
  }

  // Step 3: Enter names -> raccoglie i nomi
  proceedToReview() {
    if (!this.allNamesValid()) {
      this.showAlertMessage('Tutti i nomi devono avere almeno 2 caratteri');
      return;
    }
    this.step.set('review');
  }

  // Step 4: Review e creazione famiglia (salva via API)
  async createFamily() {
    this.isLoading.set(true);
    
    try {
      const childrenForms = this.childrenForms();
      
      // Prepara i dati dei bambini
      const childrenData = childrenForms.map(form => ({
        name: form.name.trim(),
        years: '5',
        icon: form.sex === 'female' ? '👧' : '🧒',
        sex: form.sex
      }));

      // Crea tutti i bambini tramite API
      this.familyService.createChildrenBatch(childrenData).subscribe({
        next: (createdChildren) => {
          // Naviga al family-picker con i bambini creati
          this.router.navigate(['/family-profile-picker'], {
            state: {
              parentName: this.parentName(),
              children: createdChildren.map(child => ({
                id: child.id,
                name: child.name,
                icon: (child as any).icon || '🧒',
                isParent: false
              }))
            }
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Errore creazione famiglia:', error);
          this.showAlertMessage('Errore durante la creazione della famiglia. Riprova.');
          this.isLoading.set(false);
        }
      });

    } catch (error) {
      console.error('❌ Errore creazione famiglia:', error);
      this.showAlertMessage('Errore durante la creazione della famiglia. Riprova.');
      this.isLoading.set(false);
    }
  }

  private async updateExistingFamily(childrenNames: string[]) {
    const currentFamily = this.existingFamily()!;
    
    // Crea nuova lista bambini
    const updatedChildren: Child[] = childrenNames.map((name, index) => {
      // Mantieni il bambino esistente se il nome non è cambiato
      const existingChild = currentFamily.children[index];
      if (existingChild && existingChild.name === name) {
        return existingChild;
      }
      
      // Crea nuovo bambino
      return {
        id: existingChild?.id || this.generateId(),
        name: name,
        avatar: existingChild?.avatar || this.getRandomAvatar(),
        createdAt: existingChild?.createdAt || new Date(),
        years: existingChild?.years ?? null,
        sex: existingChild?.sex ?? 'male',
        point: existingChild?.point,
        view: existingChild?.view ?? 'child',
        tasks: existingChild?.tasks ?? []
      };
    });

    const updatedFamily: Family = {
      ...currentFamily,
      parentName: this.parentName(),
      children: updatedChildren
    };

    this.familyService.saveFamily(updatedFamily);
  }

  // Helper methods
  onChildNameChange(index: number, name: string) {
    const forms = this.childrenForms();
    forms[index] = {
      ...forms[index],
      name: name,
      sex: forms[index].sex,
      isValid: name.trim().length >= 2
    };
    this.childrenForms.set([...forms]);
  }

  useSuggestedName(index: number, name: string) {
    this.onChildNameChange(index, name);
  }

  goBack() {
    const currentStep = this.step();
    switch (currentStep) {
      case 'select-count':
        this.step.set('welcome');
        break;
      case 'enter-names':
        this.step.set('select-count');
        break;
      case 'review':
        this.step.set('enter-names');
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async resetFamily() {
    const alert = await this.alertController.create({
      header: 'Reset Famiglia',
      message: 'Sei sicuro di voler cancellare la famiglia esistente e ricominciare?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Reset',
          role: 'destructive',
          handler: () => {
            this.familyService.clearFamily();
            this.existingFamily.set(null);
            this.step.set('welcome');
            this.parentName.set('');
            this.childrenForms.set([]);
          }
        }
      ]
    });
    await alert.present();
  }

  private showAlertMessage(message: string) {
    this.alertMessage.set(message);
    this.showAlert.set(true);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getRandomAvatar(sex: 'male' | 'female' = 'male'): string {
    const avatars = {
      male: [
        '🧒', '👦', '🧑', '👶', // bambini maschi
        '🦸‍♂️', // supereroe maschio
        '🧙‍♂️', // mago
        '🐻', '🐱', '🐶', '🦊', '🐵', '🐼', // animali
        '🤠', '🤴', // cowboy, principe
        '🧑‍🚀', '🧑‍🎨', '🧑‍🚒' // astronauta, artista, pompiere
      ],
      female: [
        '👧', '🧑', '👶', // bambine
        '🦸‍♀️', // supereroina
        '🧚‍♀️', // fata
        '🐻', '🐱', '🐶', '🦊', '🐵', '🐼', // animali
        '👸', // principessa
        '🧑‍🚀', '🧑‍🎨', '🧑‍🚒' // astronauta, artista, pompiere
      ]
    };
    const selectedAvatars = avatars[sex] || avatars.male;
    return selectedAvatars[Math.floor(Math.random() * selectedAvatars.length)];
  }
}