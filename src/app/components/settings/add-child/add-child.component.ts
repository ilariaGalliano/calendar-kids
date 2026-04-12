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
  `
})
export class AddChildModalComponent implements OnInit {

  @Input() child!: Child;

  today = new Date().toISOString().split('T')[0];

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
