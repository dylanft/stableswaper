import { Component, OnInit } from '@angular/core';
import { openContractCall } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
} from '@stacks/transactions';
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
  tokenList: any[] = ['USDA', 'xUSD'];
  lpTokenList: any[] = ['USDA-xUSD-LP']
  poolChoice: string = 'add';


  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: number = 0;
  tokenB_amt: number = 0;


  lpToken: string = '';
  lpToken_amt_user: number = 0;
  lpToken_amt_total: number = 0;

  numCycles: number = 50;

  swap(pick: string) {
    openContractCall({
      network: new StacksTestnet(),
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST39MJ145BR6S8C315AG2BD61SJ16E208P1FDK3AK',
      contractName: 'example-fruit-vote-contract',
      functionName: 'vote',
      functionArgs: [stringUtf8CV(pick)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `https://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  selectToken(event: any, tokenType: string) {
    // console.log("event: ", event)
    // console.log("event.value: ", event.value)
    if (tokenType == "A") {
      this.tokenA = event.value;
      console.log("tokenA: ", this.tokenA);
    }
    else if (tokenType == "B") {
      this.tokenB = event.value;
      console.log("tokenB: ", this.tokenB);
    }
    else if (tokenType == "LP") {
      this.lpToken = event.value;
      console.log("LP Token: ", this.lpToken);
    }
  }

  updateTokenAmount(val: string, tokenType: string) {
    //TODO: update this function to grab price of this # of stablecoins in real dollars based on AMM
    //TODO: display output below the amount entered in the text field
    console.log(val)
    if (tokenType == "LP") {
      this.lpToken_amt_user = parseInt(val);
    }
    else {
      this.tokenA_amt = parseInt(val);
      this.tokenB_amt = this.tokenA_amt;
    }
    
  }

  toggle(poolOption: string) {
    this.poolChoice = poolOption;
    console.log(this.poolChoice)
  }

  printNumCycles() {
    console.log(this.numCycles)
  }
}
