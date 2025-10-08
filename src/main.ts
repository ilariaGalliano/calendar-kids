import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { LOCALE_ID } from '@angular/core';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { 
  addOutline, closeOutline, logOutOutline, personOutline, 
  happyOutline, settingsOutline, refreshOutline, checkmarkCircle,
  menuOutline, logInOutline, reorderTwoOutline
} from 'ionicons/icons';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './app/common/auth.interceptor';
import { environment } from './environments/environment';

addIcons({
  'add-outline': addOutline,
  'close-outline': closeOutline,
  'log-out-outline': logOutOutline,
  'person-outline': personOutline,
  'happy-outline': happyOutline,
  'settings-outline': settingsOutline,
  'refresh-outline': refreshOutline,
  'checkmark-circle': checkmarkCircle,
  'menu-outline': menuOutline,
  'log-in-outline': logInOutline,
  'reorder-two-outline': reorderTwoOutline
});


registerLocaleData(localeIt)

bootstrapApplication(AppComponent, {
  // { provide: RouteReuseStrategy, useClass: IonicRouteStr
  providers: [
    provideIonicAngular(),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'it' },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
