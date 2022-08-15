import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'stacks-angular';
  content: string = "home";

  setContent(c: string) {
    this.content = c;
  }
}
