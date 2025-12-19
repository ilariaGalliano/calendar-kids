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
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

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
    private authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', Validators.required),
    });
  }

  // async loginParent() {
  //   if (this.loginForm.valid) {
  //     const { email, password } = this.loginForm.value;
  //     try {
  //       const response = await this.authService.login(email, password); // Call BE API
  //       if (response) {
  //         // await this.authService.setToken(response.token);
  //         console.log('respo', response);
  //         this.router.navigate(['/family-setup']);
  //       } else {
  //         alert('❌ Login fallito. Controlla le credenziali.');
  //       }
  //     } catch (error) {
  //       alert('Errore di login. Riprova più tardi.');
  //     }
  //   } else {
  //     alert('Inserisci email e password validi!');
  //   }
  // }
  async login() {
    console.log("🔐 Fake login enabled (mock mode)");
    console.log('respo', this.loginForm.value);

    const demoFamily = {
      id: "demo-family",
      parentName: "Lorena",
      createdAt: new Date(),
      children: [
        { id: "kid1", name: "Sofia", avatar: "🧚‍♀️", age: 8, point: 0, sex: "female", createdAt: new Date(), tasks: [] },
        { id: "kid2", name: "Marco", avatar: "🤴", age: 6, point: 0, sex: "male", createdAt: new Date(), tasks: [] },
        { id: "kid3", name: "Emma", avatar: "🦸‍♀️", age: 3, point: 0, sex: "female", createdAt: new Date(), tasks: [] }
      ]
    };

    localStorage.setItem('calendarKids_family', JSON.stringify(demoFamily));
    await this.authService.setToken('token');
    // this.router.navigateByUrl('/home', { replaceUrl: true });
    this.router.navigate(['/family-setup']);
  }

   async loginWithGoogle() {
    // Avvia login Google (redirect)
    await this.authService.loginWithGoogle();
    // Dopo il redirect, in ngOnInit o in un altro punto, verifica la sessione:
    const token = await this.authService.getToken();
    if (token) {
      try {
        // Chiamata al backend con token
        await this.http.get(
          `${environment.apiBase}/AppUsers/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).toPromise();
        // Naviga se tutto ok
        this.router.navigate(['/family-setup']);
      } catch (err) {
        alert('Errore autenticazione backend');
      }
    } else {
      alert('Login Google fallito');
    }
  }

}
