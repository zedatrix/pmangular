import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    this.authService.checkAuthStatus();
    
    if (this.authService.authenticated && this.authService.authenticatedUserToken)
    {
      return true;
    }
    else {
      this.router.navigateByUrl('login');
      return false;
    }
  }
  
}
