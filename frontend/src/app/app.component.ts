import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { userSession } from 'src/stacksUserSession';
import { StacksTestnet } from '@stacks/network';
import {
  callReadOnlyFunction,
  cvToValue,
} from '@stacks/transactions';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public userSession = userSession;
  network: any = new StacksTestnet();
  title = 'stacks-angular';
  content: string = "home";
  usdaBalance: string | null = null;
  xusdBalance: string | null = null;
  xbtcBalance: string | null = null;
  usdlpBalance: string | null = null;
  authenticatedPages = ['Swap', 'Pool', 'Earn', 'Faucet'];

  constructor(private router: Router) {
  }

  ngOnInit(): void {
    this.getUsersTokenBalance('USDA', 1e6).then((x) => this.usdaBalance = x);
    this.getUsersTokenBalance('xUSD', 1e6).then((x) => this.xusdBalance = x);
    this.getUsersTokenBalance('xBTC', 1).then((x) => this.xbtcBalance = x);
    this.getUsersTokenBalance('usd-lp', 1e6).then((x) => this.usdlpBalance = x);
  }
  
  async getUsersTokenBalance(token: string, decimalFactor: number) {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    if (token == 'USDA') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'usda-token'
    } 
    else if (token == 'xUSD') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'xusd-token'
    } 
    else if (token == 'xBTC') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'xbtc-token'
    } 
    else if (token == 'usd-lp') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'usd-lp'
    } 
    else {
      var contractAddress = ''
      var contractName = ''
      console.log(token + " balance lookup not included with app code")
    } 

    var options = {
      network: this.network,
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-balance',
      functionArgs: [principalCV(txSenderAddress)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    return this.numberWithCommas(output.value, decimalFactor);

  }

  numberWithCommas(n: number, uintDecimalFactor: number) {
    var n_str = (n / uintDecimalFactor).toString();
    var x = Number(parseFloat(n_str)).toFixed(2);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  isUserSignedIn() {
    return this.userSession.isUserSignedIn();
  }

  navigateToHome() {
    this.router.navigate(['home']);
  }
}
