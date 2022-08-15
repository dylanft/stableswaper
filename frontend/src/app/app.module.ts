import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ConnectWalletComponent } from './connect-wallet/connect-wallet.component';
import { ContractVoteComponent } from './contract-vote/contract-vote.component';

@NgModule({
  declarations: [
    AppComponent,
    ConnectWalletComponent,
    ContractVoteComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      {path: 'vote', component: ContractVoteComponent}
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
