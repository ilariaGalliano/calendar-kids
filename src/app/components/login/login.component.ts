import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
    ReactiveFormsModule
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

  loginForm!: FormGroup;

  constructor(
    private router: Router,
    private kidProfileService: KidProfileService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', Validators.required),
    });
  }

  async loginParent() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        const response = await this.authService.login(email, password); // Call BE API
        if (response) {
          // await this.authService.setToken(response.token);
          console.log('respo', response);
          this.router.navigate(['/family-setup']);
        } else {
          alert('❌ Login fallito. Controlla le credenziali.');
        }
      } catch (error) {
        alert('Errore di login. Riprova più tardi.');
      }
    } else {
      alert('Inserisci email e password validi!');
    }
  }
}
