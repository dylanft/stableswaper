import { Component, OnInit } from '@angular/core';
import { openContractCall } from '@stacks/connect';
import { StacksMocknet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  ContractPrincipal,
  contractPrincipalCV,
  ContractPrincipalCV,
  contractPrincipalCVFromAddress,
  createAddress,
  createLPString,
  PostConditionMode,
  stringUtf8CV,
  uintCV,
} from '@stacks/transactions';
import { userSession } from 'src/stacksUserSession';

@Component({
  selector: 'faucet',
  templateUrl: './faucet.component.html',
  styleUrls: ['./faucet.component.css']
})
export class FaucetComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  tokenList: any[] = ['USDA', 'xUSD'];
  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: string = "0";
  tokenB_amt: string = "0";

  network: any = new StacksMocknet();
  usdaContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
      createAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'),
      createLPString('usda-token')
    );

  xusdContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'),
    createLPString('xusd-token')
  );


  public userSession = userSession;


  swapXforY(tokenX: string, tokenY: string, x: number, y: number) {
    if (tokenX == 'USDA' && tokenY=='xUSD') {
      var tX = this.usdaContract;
      var tY = this.xusdContract;
    }
    else if (tokenX == 'xUSD' && tokenY=='USDA') {
      var tX = this.xusdContract;
      var tY = this.usdaContract;
    }
    else {
      var tX = this.usdaContract;
      var tY = this.xusdContract;
    }
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap-v2',
      functionName: 'swap-x-for-y',
      functionArgs: [tX, tY, uintCV(x), uintCV(y)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
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
    console.log(val)
  }
}