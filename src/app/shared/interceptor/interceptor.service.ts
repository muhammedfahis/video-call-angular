import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ) {
    // Get the access token or any value needed for the header
    const strToken = localStorage.getItem('token');
    const startIndex:any = strToken?.indexOf('"');
// Find the index of the last dot (.)
    const lastIndex = strToken?.lastIndexOf('"');

// Extract the substring between the first and last dots
    const result = strToken?.substring(startIndex + 1, lastIndex);


    // Clone the request and add the header
    const authReq = request.clone({
      setHeaders: {
        Authorization: `Bearer ${result}`,
      },
    });

    // Pass on the cloned request to the next handler
    return next.handle(authReq);
  }
}
