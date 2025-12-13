import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private base = environment.apiBase;
  constructor(private http: HttpClient) { }

createChildProfile(householdId: string, displayName: string, avatar?: string) {
  return this.http.post(`${this.base}/profiles`, {
    householdId,
    displayName,
    avatar
  });
}
}
