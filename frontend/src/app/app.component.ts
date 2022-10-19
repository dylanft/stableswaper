import { Component } from '@angular/core';
import { userSession } from 'src/stacksUserSession';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  ngOnInit(): void {
  }
  public userSession = userSession;
  title = 'stacks-angular';
  content: string = "home";

  setContent(c: string) {
    this.content = c;
  }
}
