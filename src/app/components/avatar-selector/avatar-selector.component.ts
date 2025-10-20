import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol, 
  IonButton, IonIcon, IonLabel, IonItem, IonList, IonBadge
} from '@ionic/angular/standalone';
import { KidAvatar, PREDEFINED_AVATARS } from '../../models/avatar.models';

@Component({
  selector: 'app-avatar-selector',
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol,
    IonButton, IonIcon, IonBadge
  ],
  templateUrl: './avatar-selector.component.html',
  styleUrls: ['./avatar-selector.component.scss']
})
export class AvatarSelectorComponent {
  @Input() kidName: string = '';
  @Input() selectedAvatar: KidAvatar | null = null;
  @Output() avatarSelected = new EventEmitter<KidAvatar>();
  @Output() cancelled = new EventEmitter<void>();

  availableAvatars = PREDEFINED_AVATARS;
  
  // Raggruppa avatar per categoria
  get avatarsByCategory() {
    const categories = {
      animals: this.availableAvatars.filter(a => a.category === 'animals'),
      fantasy: this.availableAvatars.filter(a => a.category === 'fantasy'),
      nature: this.availableAvatars.filter(a => a.category === 'nature'),
      classic: this.availableAvatars.filter(a => a.category === 'classic')
    };
    return categories;
  }

  // Raggruppa per palette di colori
  get avatarsByPalette() {
    const palettes = {
      pink: this.availableAvatars.filter(a => a.palette.name === 'Rosa Dolce'),
      blue: this.availableAvatars.filter(a => a.palette.name === 'Cielo Sereno'),
      green: this.availableAvatars.filter(a => a.palette.name === 'Prato Fresco'),
      yellow: this.availableAvatars.filter(a => a.palette.name === 'Sole Dolce')
    };
    return palettes;
  }

  selectAvatar(avatar: KidAvatar) {
    console.log('👆 Selezionato avatar:', avatar.name);
    this.selectedAvatar = avatar;
    // Non emettiamo ancora l'evento, solo selezioniamo l'avatar
  }

  confirmSelection() {
    console.log('🎯 Confermando selezione avatar:', this.selectedAvatar);
    if (this.selectedAvatar) {
      console.log('📤 Emettendo evento avatarSelected per:', this.selectedAvatar.name);
      this.avatarSelected.emit(this.selectedAvatar);
    } else {
      console.warn('⚠️ Nessun avatar selezionato!');
    }
  }

  cancel() {
    console.log('↩️ Emettendo evento cancelled');
    this.cancelled.emit();
  }

  getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      animals: '🐾 Animali',
      fantasy: '✨ Fantasy',
      nature: '🌸 Natura',
      classic: '👧👦 Classici'
    };
    return names[category] || category;
  }

  getColorKey(paletteName: string): string {
    const colorMap: { [key: string]: string } = {
      'Rosa Dolce': 'pink',
      'Cielo Sereno': 'blue',
      'Prato Fresco': 'green',
      'Sole Dolce': 'yellow'
    };
    return colorMap[paletteName] || 'pink';
  }

  getAvatarsForSelectedPalette(): KidAvatar[] {
    if (!this.selectedAvatar) return [];
    
    const colorKey = this.getColorKey(this.selectedAvatar.palette.name);
    const palettes = this.avatarsByPalette as { [key: string]: KidAvatar[] };
    return palettes[colorKey] || [];
  }
}