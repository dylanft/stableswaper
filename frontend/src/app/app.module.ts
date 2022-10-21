import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
// import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSlider, MatSliderModule } from '@angular/material/slider';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';

import { AppComponent } from './app.component';
import { ContractVoteComponent } from './contract-vote/contract-vote.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EarnComponent } from './earn/earn.component';
import { SwapComponent } from './swap/swap.component';
import { FaucetComponent } from './faucet/faucet.component';
import { PoolComponent } from './pool/pool.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ContractVoteComponent,
    EarnComponent,
    SwapComponent,
    FaucetComponent,
    PoolComponent,
  ],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonToggleModule,
    FormsModule,
    MatTableModule,
    BrowserAnimationsModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
