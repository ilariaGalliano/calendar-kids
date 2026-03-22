import { Component, EventEmitter, Output, Input, Signal, WritableSignal, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { KidAvatar, PREDEFINED_AVATARS } from '../../models/avatar.models';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from 'src/app/services/profile-service';

export interface FamilyProfile {
  id: string;
  name: string;
  icon: string;
  isParent?: boolean;
}

@Component({
  selector: 'app-family-profile-picker',
  standalone: true,
  imports: [CommonModule, AvatarSelectorComponent, FormsModule],
  templateUrl: './family-profile-picker.component.html',
  styleUrls: ['./family-profile-picker.component.scss']
})
export class FamilyProfilePickerComponent implements OnInit {
  @Input() profiles: FamilyProfile[] = [];
  @Output() profileSelected = new EventEmitter<FamilyProfile>();

  private router = inject(Router);
  AppUserLogged: WritableSignal<string> = signal('');

  showAvatarSelector: boolean = false;
  newKidName: string = '';
  selectedAvatar: KidAvatar | null = null;

  parentProfile: FamilyProfile = {
    id: 'parent',
    name: '',
    icon: '👩',
    isParent: true
  };

  constructor(private profileService: ProfileService) { }

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
        isParent: false
      }));
    }
  }

  selectProfile(profile: FamilyProfile) {
    if (!profile.id) { // Now the add-profile uses id: ''
      this.showAvatarSelector = true;
      this.newKidName = '';
      this.selectedAvatar = null;
      return;
    }

    this.profileSelected.emit(profile);

    if (profile.isParent) {
      this.router.navigate(['/home'], {
        queryParams: { mode: 'parent' },
        state: { parentName: this.parentProfile.name }
      });
    } else {
      this.router.navigate(['/home'], {
        queryParams: {
          mode: 'child',
          childId: profile.id
        },
        state: { parentName: this.parentProfile.name }
      });
    }
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
