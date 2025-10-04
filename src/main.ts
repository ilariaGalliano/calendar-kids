import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { LOCALE_ID } from '@angular/core';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './app/common/auth.interceptor';
import { environment } from './environments/environment';

console.log('[APP]', 'apiBase =', environment.apiBase);

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
