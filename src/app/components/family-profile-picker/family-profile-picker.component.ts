import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { KidAvatar, PREDEFINED_AVATARS } from '../../models/avatar.models';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface FamilyProfile {
  id: string;
  name: string;
  avatar: string;
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

  showAvatarSelector: boolean = false;
  newKidName: string = '';
  selectedAvatar: KidAvatar | null = null;

  constructor(private router: Router) {}

  selectProfile(profile: FamilyProfile) {
    if (profile.id === 'new') {
      this.showAvatarSelector = true;
      this.newKidName = '';
      this.selectedAvatar = null;
    } else {
      this.profileSelected.emit(profile);
      this.router.navigate(['/home']);
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
