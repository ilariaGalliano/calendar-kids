import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  IonText
} from '@ionic/angular/standalone';
import { FamilyService } from '../../services/family.service';

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
    IonText
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  
  email = '';
  password = '';

  constructor(
    private router: Router,
    private familyService: FamilyService
  ) { }

  ngOnInit() {
    console.log('🔄 Login Component ngOnInit');
    
    // Controlla se c'è già una famiglia attiva
    const activeFamily = this.familyService.getActiveFamily()();
    if (activeFamily) {
      console.log('�‍👩‍👧‍👦 Famiglia già attiva trovata:', activeFamily.parentName);
      // Naviga direttamente alla home se c'è già una famiglia
      this.router.navigate(['/home']);
    }
  }

  loginParent() {
    if (this.email && this.password) {
      console.log('👨‍👩‍👧‍👦 Login genitore effettuato');
      
      // Verifica se esiste già una famiglia
      const activeFamily = this.familyService.getActiveFamily()();
      
      if (activeFamily) {
        // Se c'è già una famiglia, vai direttamente alla home
        console.log('👨‍👩‍👧‍👦 Famiglia esistente trovata, navigando alla home');
        this.router.navigate(['/home']);
      } else {
        // Se non c'è una famiglia, vai al setup
        console.log('🏗️ Nessuna famiglia trovata, navigando al setup');
        this.router.navigate(['/family-setup']);
      }
    } else {
      alert('📧 Inserisci email e password!');
    }
  }

  // Metodo per creare una famiglia demo veloce
  createDemoFamily() {
    console.log('🚀 Creando famiglia demo...');
    
    // Crea una famiglia demo con 3 bambini
    const family = this.familyService.createFamily('Famiglia Demo', 3);
    console.log('✅ Famiglia demo creata:', family);
    
    // Naviga alla home
    this.router.navigate(['/home']);
  }

  goToFamilySetup() {
    this.router.navigate(['/family-setup']);
  }

}
