import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private _granted = false;

  async ensurePermissions() {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') { this._granted = true; return true; }
    const req = await LocalNotifications.requestPermissions();
    this._granted = req.display === 'granted';
    return this._granted;
  }

  async schedule(title: string, body: string, at: Date) {
    if (!this._granted) await this.ensurePermissions();
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random()*1e9),
        title, body,
        schedule: { at },
        sound: undefined,
        smallIcon: 'ic_stat_icon',
      }]
    });
  }

  async pingNow() {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    await LocalNotifications.schedule({
      notifications: [{ id: Date.now(), title: 'Promemoria', body: 'È ora!', schedule: { at: new Date() } }]
    });
  }
}
