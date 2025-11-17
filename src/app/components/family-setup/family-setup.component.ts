import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText
} from '@ionic/angular/standalone';
import { FamilyService } from '../../services/family.service';

@Component({
  selector: 'app-family-setup',
  templateUrl: './family-setup.component.html',
  styleUrls: ['./family-setup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText
  ]
})
export class FamilySetupComponent {
  parentName = signal<string>('');
  numberOfChildren = signal<number>(1);
  isLoading = signal<boolean>(false);

  constructor(
    private familyService: FamilyService,
    private router: Router
  ) {}

  onChildrenCountChange(event: any) {
    this.numberOfChildren.set(parseInt(event.detail.value));
  }

  async createFamily() {
    const name = this.parentName().trim();
    const childCount = this.numberOfChildren();

    if (!name) {
      alert('Inserisci il nome del genitore');
      return;
    }

    if (childCount < 1 || childCount > 10) {
      alert('Il numero di bambini deve essere tra 1 e 10');
      return;
    }

    this.isLoading.set(true);

    try {
      // Crea la famiglia
      const family = this.familyService.createFamily(name, childCount);
      
      console.log('✅ Famiglia creata con successo:', family);
      
      // Vai alla home page
      await this.router.navigate(['/home']);
      
    } catch (error) {
      console.error('❌ Errore nella creazione della famiglia:', error);
      alert('Errore nella creazione della famiglia');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}