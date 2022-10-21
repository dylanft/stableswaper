import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserSession } from '@stacks/connect';
import { userSession } from 'src/stacksUserSession';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  private userSession: UserSession;

  constructor(public router: Router) {
    this.userSession = userSession;
  }

  canActivate(): boolean {
    if (!userSession.isUserSignedIn()) {
      this.router.navigate(['home']);
      return false;
    }
    return true;
  }
}
