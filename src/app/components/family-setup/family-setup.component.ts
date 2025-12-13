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
    this.checkExistingFamily();
  }

  private checkExistingFamily() {
    // Controlla se esiste già una famiglia
    const family = this.familyService.getCurrentFamily();
    if (family) {
      this.existingFamily.set(family);
      this.parentName.set(family.parentName);
      
      // Se esiste famiglia, mostro opzioni per modificarla
      this.step.set('review');
      this.setupChildrenFormsFromFamily(family);
    } else {
      // Nuovo setup, inizia dalla welcome
      this.step.set('welcome');
    }
  }

  private setupChildrenFormsFromFamily(family: Family) {
    const forms = family.children.map((child: Child) => ({
      id: child.id,
      name: child.name,
      isValid: true,
      sex: child.sex
    }));
    this.childrenForms.set(forms);
    this.numberOfChildren.set(family.children.length);
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

    // Inizializza i form per i bambini
    const forms: ChildForm[] = [];
    for (let i = 0; i < this.numberOfChildren(); i++) {
      forms.push({
        id: `child-${i + 1}`,
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

  // Step 4: Review e creazione famiglia
  async createFamily() {
    this.isLoading.set(true);
    
    try {
      const parentName = this.parentName();
      const childrenNames = this.childrenForms().map(form => form.name.trim());

      // Se esiste già una famiglia, la aggiorna
      if (this.existingFamily()) {
        await this.updateExistingFamily(childrenNames);
      } else {
        // Crea nuova famiglia
        const family = this.familyService.createFamily(parentName, childrenNames.length);
        
        // Aggiorna i nomi dei bambini
        family.children.forEach((child: Child, index: number) => {
          child.name = childrenNames[index];
        });
        
        // Salva la famiglia aggiornata
        this.familyService.saveFamily(family);
        
        console.log('👨‍👩‍👧‍👦 Famiglia creata:', family);
      }

      // Naviga alla home
      setTimeout(() => {
        this.router.navigate(['/family-profile-picker']);
      }, 1000);

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
        age: existingChild?.age ?? null,
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
    console.log('🔄 Famiglia aggiornata:', updatedFamily);
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