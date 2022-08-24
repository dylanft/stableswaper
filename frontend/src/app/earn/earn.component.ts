import { Component, OnInit } from '@angular/core';
import { openContractCall } from '@stacks/connect';
import { StacksMocknet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
} from '@stacks/transactions';
import { userSession } from 'src/stacksUserSession';

export interface CycleDatapoint{
  position: number;
  startBlock: string;
  totalLPtokens: number;
  userLPtokens: number;
  userRewards: number;
  userCTA: string;
}

const CYCLES_DATA: CycleDatapoint[] = [
  {position: 1, startBlock: '1000', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 1.23, userCTA: 'claimed'},
  {position: 2, startBlock: '1100', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 1.23, userCTA: 'claim'},
  {position: 3, startBlock: '1200', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 1.23, userCTA: 'claim'},
  {position: 4, startBlock: '1300', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 0.615, userCTA: 'in-progress'},
  {position: 5, startBlock: '1400', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 0, userCTA: 'upcoming'},
  {position: 6, startBlock: '1500', totalLPtokens: 123332, userLPtokens: 0, userRewards: 0, userCTA: 'N/A'},
];

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
  cycleView: string = 'cycle';
  cycleClaimNumber: number = 1;


  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: number = 0;
  tokenB_amt: number = 0;


  lpToken: string = '';
  lpToken_amt_user: number = 0;
  lpToken_amt_user_earn: number = 0;
  lpToken_amt_user_pool: number = 0;
  lpToken_amt_total: number = 0;

  numCycles: number = 50;

  displayedColumns: string[] = ['position', 'startBlock', 'totalLPtokens', 'userLPtokens', 'userRewards', 'userCTA']
  dataSource = [...CYCLES_DATA];

  swap(pick: string) {
    openContractCall({
      network: new StacksMocknet(),
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

  swapStxForMagic(pick: string) {
    openContractCall({
      network: new StacksTestnet(),
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1RF441MG7VMFPN73DNHEH341DH7GDZW0MYD0GDY',
      contractName: 'beanstalk-exchange',
      functionName: 'stx-to-token-swap',
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
    if (tokenType == "LP-pool") {
      this.lpToken_amt_user_pool = parseInt(val);
    }
    else if (tokenType == "LP-earn") {
      this.lpToken_amt_user_earn = parseInt(val);
    }
    else if (tokenType=='Cycle') {
      this.cycleClaimNumber = parseInt(val)
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

  cvToggle(cycleViewOption: string) {
    this.cycleView = cycleViewOption;
    console.log(this.cycleView)
  }

  printNumCycles() {
    console.log(this.numCycles)
  }
}
