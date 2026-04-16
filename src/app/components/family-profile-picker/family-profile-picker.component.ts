import { Component, EventEmitter, Output, Input, Signal, WritableSignal, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { KidAvatar, PREDEFINED_AVATARS } from '../../models/avatar.models';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from 'src/app/services/profile-service';
import { RewardsService } from '../../services/rewards.service';
import { FamilyService } from 'src/app/services/family.service';
import {
  IonModal, IonButton, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonSpinner
} from '@ionic/angular/standalone';

export interface FamilyProfile {
  id: string;
  name: string;
  icon: string;
  photo?: string | null;
  isParent?: boolean;
}

@Component({
  selector: 'app-family-profile-picker',
  standalone: true,
  imports: [CommonModule, AvatarSelectorComponent, FormsModule,
    IonModal, IonButton, IonHeader, IonToolbar, IonTitle,
    IonContent, IonButtons, IonSpinner
  ],
  templateUrl: './family-profile-picker.component.html',
  styleUrls: ['./family-profile-picker.component.scss']
})
export class FamilyProfilePickerComponent implements OnInit {
  @Input() profiles: FamilyProfile[] = [];
  @Output() profileSelected = new EventEmitter<FamilyProfile>();

  private router = inject(Router);
  private rewardsService = inject(RewardsService);
  AppUserLogged: WritableSignal<string> = signal('');

  showAvatarSelector: boolean = false;
  newKidName: string = '';
  selectedAvatar: KidAvatar | null = null;

  // ── PIN modal state ────────────────────────────────────────────────────
  showPinModal = signal(false);
  isSettingPin = signal(false);
  pinValue = signal('');
  pinError = signal('');
  pinLoading = signal(false);

  parentProfile: FamilyProfile = {
    id: 'parent',
    name: '',
    icon: '👩',
    isParent: true
  };

  constructor(private profileService: ProfileService, private familyService: FamilyService) { }

  ngOnInit() {
    // Recupera i dati passati dalla navigazione
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (window as any).history?.state;
    
    if (state?.parentName) {
      this.AppUserLogged.set(state.parentName);
      this.parentProfile.name = state.parentName;
    }
    
    if (state?.children && Array.isArray(state.children)) {
      this.profiles = state.children.map((child: any) => ({
        id: child.id,
        name: child.name,
        icon: child.icon || '🧒',
        photo: child.avatar && (child.avatar.startsWith('data:') || child.avatar.startsWith('http')) ? child.avatar : null,
        isParent: false
      }));
    } else {
      // Fallback: carica dalla FamilyService in memoria o dall'API
      const family = this.familyService.getCurrentFamily();
      if (family?.children?.length) {
        this.profiles = family.children.map((child: any) => ({
          id: child.id,
          name: child.name,
          icon: child.avatar && !child.avatar.startsWith('data:') && !child.avatar.startsWith('http') ? child.avatar : '🧒',
          photo: child.avatar && (child.avatar.startsWith('data:') || child.avatar.startsWith('http')) ? child.avatar : null,
          isParent: false
        }));
      } else {
        this.familyService.fetchChildrenForCurrentUser().subscribe({
          next: (children) => {
            this.profiles = children.map((child: any) => ({
              id: child.id,
              name: child.name,
              icon: child.avatar && !child.avatar.startsWith('data:') && !child.avatar.startsWith('http') ? child.avatar : (child.icon || '🧒'),
              photo: child.avatar && (child.avatar.startsWith('data:') || child.avatar.startsWith('http')) ? child.avatar : null,
              isParent: false
            }));
          }
        });
      }
    }
  }

  selectProfile(profile: FamilyProfile) {
    if (!profile.id) {
      this.showAvatarSelector = true;
      this.newKidName = '';
      this.selectedAvatar = null;
      return;
    }

    if (profile.isParent) {
      // Chiedi il PIN prima di entrare come genitore
      this.openParentPinModal();
      return;
    }

    this.navigateAsChild(profile);
  }

  private navigateAsParent() {
    this.profileSelected.emit(this.parentProfile);
    this.router.navigate(['/home'], {
      queryParams: { mode: 'parent' },
      state: { parentName: this.parentProfile.name }
    });
  }

  private navigateAsChild(profile: FamilyProfile) {
    this.profileSelected.emit(profile);
    this.router.navigate(['/home'], {
      queryParams: { mode: 'child', childId: profile.id },
      state: { parentName: this.parentProfile.name }
    });
  }

  // ── PIN methods ──────────────────────────────────────────────────────────

  openParentPinModal() {
    this.pinValue.set('');
    this.pinError.set('');
    this.pinLoading.set(true);
    this.rewardsService.hasPinSet().subscribe({
      next: (hasPin) => {
        this.pinLoading.set(false);
        this.isSettingPin.set(!hasPin);
        this.showPinModal.set(true);
      },
      error: () => {
        this.pinLoading.set(false);
        this.isSettingPin.set(true);
        this.showPinModal.set(true);
      }
    });
  }

  closePinModal() {
    this.showPinModal.set(false);
    this.pinValue.set('');
    this.pinError.set('');
  }

  appendPin(digit: string) {
    if (this.pinValue().length >= 4) return;
    this.pinValue.update(v => v + digit);
    this.pinError.set('');
    if (this.pinValue().length === 4) {
      this.isSettingPin() ? this.submitSetPin() : this.submitVerifyPin();
    }
  }

  deletePin() {
    this.pinValue.update(v => v.slice(0, -1));
    this.pinError.set('');
  }

  private submitSetPin() {
    this.pinLoading.set(true);
    this.rewardsService.setPin(this.pinValue()).subscribe({
      next: () => {
        this.pinLoading.set(false);
        this.closePinModal();
        this.navigateAsParent();
      },
      error: () => {
        this.pinLoading.set(false);
        this.pinError.set('Errore nel salvataggio del PIN. Riprova.');
        this.pinValue.set('');
      }
    });
  }

  private submitVerifyPin() {
    this.pinLoading.set(true);
    this.rewardsService.verifyPin(this.pinValue()).subscribe({
      next: ({ valid }) => {
        this.pinLoading.set(false);
        if (valid) {
          this.closePinModal();
          this.navigateAsParent();
        } else {
          this.pinError.set('PIN errato. Riprova.');
          this.pinValue.set('');
        }
      },
      error: () => {
        this.pinLoading.set(false);
        this.pinError.set('Errore di rete. Riprova.');
        this.pinValue.set('');
      }
    });
  }

  onAvatarSelected(avatar: KidAvatar) {
    this.selectedAvatar = avatar;
    
    // Crea nuovo bambino tramite FamilyService
    const newChildData = {
      name: this.newKidName || 'Nuovo Bambino',
      icon: avatar.emoji,
      years: '5',
      sex: 'male'
    };

    this.profileService.createChildProfile('', this.newKidName || 'Nuovo Bambino', avatar.emoji)
      .subscribe({
        next: (createdProfile: any) => {
          const newProfile: FamilyProfile = {
            id: createdProfile.id,
            name: createdProfile.displayName || createdProfile.name,
            icon: createdProfile.icon || avatar.emoji
          };
          this.profiles.push(newProfile);
          this.profileSelected.emit(newProfile);
          this.showAvatarSelector = false;
          this.router.navigate(['/home'], {
            queryParams: {
              mode: 'child',
              childId: newProfile.id
            },
            state: { parentName: this.parentProfile.name }
          });
        },
        error: (error) => {
          console.error('Errore creazione bambino:', error);
          this.showAvatarSelector = false;
        }
      });
  }

  onAvatarCancelled() {
    this.showAvatarSelector = false;
  }
}
