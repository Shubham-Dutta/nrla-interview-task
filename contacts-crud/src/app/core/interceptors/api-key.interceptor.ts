import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const apiKey = (environment.apiKey ?? '').trim();
  if (!apiKey) return next(req);

  return next(req.clone({ setHeaders: { 'X-API-Key': apiKey } }));
};
