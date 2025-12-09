import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Child } from 'src/app/models/family.models';

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
    IonSelectOption
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

      <form [formGroup]="form" (ngSubmit)="submit()">

        <ion-item>
          <ion-label position="stacked">Nome</ion-label>
          <ion-input formControlName="name"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Età</ion-label>
          <ion-input type="number" formControlName="age"></ion-input>
        </ion-item>

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
  `
})
export class AddChildModalComponent {

  @Input() child!: Child;

  form = this.fb.group({
    name: ['', Validators.required],
    age: [0, Validators.required],
    view: ['child', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    if (this.child) {
      this.form.patchValue(this.child);
    }
  }

  close() {
    this.modalCtrl.dismiss(null);
  }

  submit() {
    if (this.form.valid) {
      this.modalCtrl.dismiss(this.form.value);
    }
  }
}
