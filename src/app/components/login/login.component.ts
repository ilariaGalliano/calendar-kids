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
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';

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
    IonCol
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';

  kidsAvatars = [
    { name: 'Giulia', emoji: '👧', color: 'linear-gradient(45deg, #ff9a9e, #fecfef)' },
    { name: 'Marco', emoji: '👦', color: 'linear-gradient(45deg, #a8edea, #fed6e3)' },
    { name: 'Sofia', emoji: '🦄', color: 'linear-gradient(45deg, #ffecd2, #fcb69f)' },
    { name: 'Luca', emoji: '🦖', color: 'linear-gradient(45deg, #84fab0, #8fd3f4)' }
  ];

  constructor(private router: Router) { }

  loginParent() {
    if (this.email && this.password) {
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 800);
    } else {
      alert('📧 Inserisci email e password!');
    }
  }

  loginKid(kid: any) {
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 500);
  }

}
