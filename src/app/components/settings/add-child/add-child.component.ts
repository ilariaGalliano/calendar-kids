import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonNote } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Child, calcAge } from 'src/app/models/family.models';

@Component({
  selector: 'app-add-child',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Modifica Bambino</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">Chiudi</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Photo upload section -->
      <div class="photo-section">
        <div class="photo-preview" (click)="photoInput.click()">
          @if (photoPreview) {
            <img [src]="photoPreview" alt="Foto profilo" class="preview-img" />
            <div class="photo-overlay">
              <span>✏️ Cambia</span>
            </div>
          } @else {
            <div class="photo-placeholder">
              <span class="photo-icon">📷</span>
              <span class="photo-label">Aggiungi foto</span>
            </div>
          }
        </div>
        <input #photoInput type="file" accept="image/*" style="display:none" (change)="onPhotoSelected($event)" />
        @if (photoPreview) {
          <button class="remove-photo-btn" (click)="removePhoto()">🗑️ Rimuovi foto</button>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">

        <ion-item>
          <ion-label position="stacked">Nome</ion-label>
          <ion-input formControlName="name"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Data di nascita</ion-label>
          <ion-input type="date" formControlName="birth_date" [max]="today"></ion-input>
        </ion-item>
        <ion-note class="ion-padding-start" color="medium" *ngIf="computedAge !== null">
          Età: {{ computedAge }} anni
        </ion-note>

        <ion-item>
          <ion-label position="stacked">Visualizzazione</ion-label>
          <ion-select formControlName="view">
            <ion-select-option value="child">Child</ion-select-option>
            <ion-select-option value="teen">Teen</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button
          class="ion-margin-top"
          expand="block"
          type="submit"
          [disabled]="form.invalid"
        >
          Salva
        </ion-button>

      </form>

    </ion-content>

    <style>
      .photo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0 8px;
        gap: 10px;
      }
      .photo-preview {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        background: var(--ion-color-light);
        border: 2px dashed var(--ion-color-medium-tint);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .preview-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .photo-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        color: white;
        font-size: 0.85rem;
      }
      .photo-preview:hover .photo-overlay { opacity: 1; }
      .photo-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .photo-icon { font-size: 2rem; }
      .photo-label { font-size: 0.75rem; color: var(--ion-color-medium); }
      .remove-photo-btn {
        background: none;
        border: none;
        color: var(--ion-color-danger);
        font-size: 0.85rem;
        cursor: pointer;
        padding: 4px 8px;
      }
    </style>
  `
})
export class AddChildModalComponent implements OnInit {

  @Input() child!: Child;

  today = new Date().toISOString().split('T')[0];
  photoPreview: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    birth_date: [null as string | null],
    view: ['child', Validators.required],
  });

  get computedAge(): number | null {
    return calcAge(this.form.value.birth_date);
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    if (this.child) {
      this.form.patchValue({
        name: this.child.name,
        birth_date: this.child.birth_date ?? null,
        view: this.child.view ?? 'child',
      });
      if (this.child.avatar) {
        this.photoPreview = this.child.avatar;
      }
    }
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.photoPreview = null;
  }

  close() {
    this.modalCtrl.dismiss(null);
  }

  submit() {
    if (this.form.valid) {
      this.modalCtrl.dismiss({ ...this.form.value, avatar: this.photoPreview ?? null });
    }
  }
}
