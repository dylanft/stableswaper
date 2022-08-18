import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
// import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSlider, MatSliderModule } from '@angular/material/slider'
import { MatFormField, MatFormFieldModule} from '@angular/material/form-field'
import { MatSelect, MatSelectModule } from '@angular/material/select'
import {AutofillMonitor} from '@angular/cdk/text-field'
import { MatInput, MatInputModule } from '@angular/material/input'

import { AppComponent } from './app.component';
import { ConnectWalletComponent } from './connect-wallet/connect-wallet.component';
import { ContractVoteComponent } from './contract-vote/contract-vote.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EarnComponent } from './earn/earn.component';
import { SwapComponent } from './swap/swap.component';

@NgModule({
  declarations: [
    AppComponent,
    ConnectWalletComponent,
    ContractVoteComponent,
    EarnComponent,
    SwapComponent
  ],
  imports: [
    BrowserModule,
    MatSliderModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    RouterModule.forRoot([
      {path: 'vote', component: ContractVoteComponent}
    ]),
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
