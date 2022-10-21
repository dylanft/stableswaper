import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConnectWalletComponent } from './components/connect-wallet/connect-wallet.component';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  declarations: [HeaderComponent, ConnectWalletComponent],
  imports: [CommonModule, RouterModule],
  exports: [HeaderComponent, ConnectWalletComponent],
  providers: [],
})
export class SharedModule {}
