import { HttpInterceptorFn } from '@angular/common/http';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // non toccare richieste esterne
  const isApi = req.url.startsWith('http://') || req.url.startsWith('https://');
  if (!isApi || (!req.url.includes('/api/'))) return next(req);

  return from(auth.getToken()).pipe(
    switchMap(token => {
      if (!token) return next(req);
      const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      return next(cloned);
    })
  );
};
