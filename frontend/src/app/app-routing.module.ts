import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SwapComponent } from './swap/swap.component';
import { AuthGuardService as AuthGuard } from './guards/auth-guard.service';
import { PoolComponent } from './pool/pool.component';
import { EarnComponent } from './earn/earn.component';
import { FaucetComponent } from './faucet/faucet.component';
import { ContractVoteComponent } from './contract-vote/contract-vote.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/home',
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'swap',
    component: SwapComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'pool',
    component: PoolComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'earn',
    component: EarnComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'faucet',
    component: FaucetComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'vote',
    component: ContractVoteComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
