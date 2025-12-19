import { Component, EventEmitter, Output, Input, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSelectorComponent } from '../avatar-selector/avatar-selector.component';
import { KidAvatar, PREDEFINED_AVATARS } from '../../models/avatar.models';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from 'src/app/services/profile-service';

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
    { id: 'kid1', name: 'Sofia', avatar: '🧚‍♀️' },
    { id: 'kid2', name: 'Marco', avatar: '🤴' },
    { id: 'kid3', name: 'Emma', avatar: '🦸‍♀️' }
  ];
  @Output() profileSelected = new EventEmitter<FamilyProfile>();

  AppUserLogged: Signal<string> = signal('Lorena');

  showAvatarSelector: boolean = false;
  newKidName: string = '';
  selectedAvatar: KidAvatar | null = null;

  parentProfile: FamilyProfile = {
    id: 'parent',
    name: this.AppUserLogged(),
    avatar: '👩',
    isParent: true
  };

  constructor(private router: Router, private profileService: ProfileService) { }

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
        queryParams: { mode: 'parent' }
      });
    } else {
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
    // Call the backend API to create the new kid profile
    // Replace 'householdId' with the actual household id from your app context
    const householdId = 'your-household-id'; // <-- replace with real value
    this.profileService.createChildProfile(householdId, this.newKidName || 'Nuovo Bambino', avatar.emoji)
      .subscribe({
        next: (createdProfile: any) => {
          const newProfile: FamilyProfile = {
            id: createdProfile.id,
            name: createdProfile.displayName,
            avatar: createdProfile.avatar || avatar.emoji
          };
          this.profileSelected.emit(newProfile);
          this.showAvatarSelector = false;
          this.router.navigate(['/home'], {
            queryParams: {
              mode: 'child',
              childId: newProfile.id
            }
          });
        },
        error: () => {
          // handle error (show toast, etc)
          this.showAvatarSelector = false;
        }
      });
  }

  onAvatarCancelled() {
    this.showAvatarSelector = false;
  }
}
