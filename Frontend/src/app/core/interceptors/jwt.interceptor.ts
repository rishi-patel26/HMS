import { HttpInterceptorFn } from '@angular/common/http';

function getTokenFromCookie(): string | null {
  const name = 'accessToken=';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getTokenFromCookie();

  // Always withCredentials so the httpOnly refreshToken cookie is sent to /auth/refresh
  let clonedReq = req.clone({ withCredentials: true });

  if (token) {
    clonedReq = clonedReq.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(clonedReq);
};
