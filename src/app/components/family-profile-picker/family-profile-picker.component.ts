import { Component, EventEmitter, Output, Input, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { KidAvatar, PREDEFINED_AVATARS } from '../../models/avatar.models';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface FamilyProfile {
  id: string;
  name: string;
  avatar: string;
  isParent?: boolean;
}

@Component({
  selector: 'app-family-profile-picker',
  standalone: true,
  imports: [CommonModule, AvatarSelectorComponent, FormsModule],
  templateUrl: './family-profile-picker.component.html',
  styleUrls: ['./family-profile-picker.component.scss']
})
export class FamilyProfilePickerComponent {
  @Input() profiles: FamilyProfile[] = [
    { id: 'kid1', name: 'Sofia', avatar: '👧' },
    { id: 'kid2', name: 'Marco', avatar: '👦' },
    { id: 'kid3', name: 'Emma', avatar: '🧒' }
  ];
  @Output() profileSelected = new EventEmitter<FamilyProfile>();

  userLogged: Signal<string> = signal('Lorena');

  showAvatarSelector: boolean = false;
  newKidName: string = '';
  selectedAvatar: KidAvatar | null = null;

  parentProfile: FamilyProfile = {
    id: 'parent',
    name: this.userLogged(),
    avatar: '👩',
    isParent: true
  };

  constructor(private router: Router) { }

  selectProfile(profile: FamilyProfile) {
    if (profile.id === 'new') {
      this.showAvatarSelector = true;
      this.newKidName = '';
      this.selectedAvatar = null;
      return;
    }

    this.profileSelected.emit(profile);

    if (profile.isParent) {
      // genitore → tutte le attività selezionabili
      this.router.navigate(['/home'], {
        queryParams: { mode: 'parent' }
      });
    } else {
      // bambino → tutte visibili, solo le sue selezionabili
      this.router.navigate(['/home'], {
        queryParams: {
          mode: 'child',
          childId: profile.id
        }
      });
    }
  }


  onAvatarSelected(avatar: KidAvatar) {
    this.selectedAvatar = avatar;
    // After avatar selection, create new profile and emit
    const newProfile: FamilyProfile = {
      id: 'kid' + Math.floor(Math.random() * 10000),
      name: this.newKidName || 'Nuovo Bambino',
      avatar: avatar.emoji
    };
    this.profileSelected.emit(newProfile);
    this.showAvatarSelector = false;
    this.router.navigate(['/home']);
  }

  onAvatarCancelled() {
    this.showAvatarSelector = false;
  }
}
