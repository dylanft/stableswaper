import { Component, OnInit } from '@angular/core';
import { userSession } from 'src/stacksUserSession';

@Component({
  selector: 'earn',
  templateUrl: './earn.component.html',
  styleUrls: ['./earn.component.css']
})
export class EarnComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  public userSession = userSession;

}
