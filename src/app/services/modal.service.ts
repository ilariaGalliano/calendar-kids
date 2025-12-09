import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private modalState$ = new BehaviorSubject<ModalState>({ isOpen: false });

  open(data?: any) {
    this.modalState$.next({ isOpen: true, data });
  }

  close() {
    this.modalState$.next({ isOpen: false });
  }

  get state() {
    return this.modalState$.asObservable();
  }
}
