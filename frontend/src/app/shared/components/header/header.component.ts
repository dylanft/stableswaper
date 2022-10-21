import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserSession } from '@stacks/connect';
import { userSession } from 'src/stacksUserSession';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  private userSession: UserSession;
  authenticatedPages = ['Swap', 'Pool', 'Earn', 'Faucet'];

  constructor(private router: Router) {
    this.userSession = userSession;
  }

  ngOnInit(): void {}

  isUserSignedIn() {
    return this.userSession.isUserSignedIn();
  }

  navigateToHome() {
    this.router.navigate(['home']);
  }
}
