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
  selector: 'app-contract-vote',
  templateUrl: './contract-vote.component.html',
  styleUrls: ['./contract-vote.component.css'],
})
export class ContractVoteComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  tokenList: any[] = ['USDA', 'xUSD'];
  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: string = "0";



  public userSession = userSession;

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

  selectToken(event: any, tokenAorB: string) {
    // console.log("event: ", event)
    // console.log("event.value: ", event.value)
    if (tokenAorB == "A") {
      this.tokenA = event.value;
      console.log("tokenA: ", this.tokenA);
    }
    else if (tokenAorB == "B") {
      this.tokenB = event.value;
      console.log("tokenB: ", this.tokenB);
    }
  }

  printTokenAmount(val: string) {
    //TODO: update this function to grab price of this # of stablecoins in real dollars based on AMM
    //TODO: display output below the amount entered in the text field
    console.log(val)
  }
}
